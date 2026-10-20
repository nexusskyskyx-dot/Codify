import { AGENTS, ROLE_ORDER, type Role, type Turn, type Session, extractJSON, collectFinalFiles } from './team'
import { PROVIDERS, getProviderChain, getEnvKey, type ProviderId } from './providers'
import { callAgent } from './client'

type Callbacks = {
  onTurnStart?: (role: Role, round: number) => void
  onTurnEnd?: (turn: Turn) => void
  onRoundEnd?: (round: number, consensus: boolean) => void
  onDone?: (session: Session) => void
  onError?: (e: Error) => void
  onLog?: (msg: string) => void
}

function buildPrompt(role: Role, task: string, projectCtx: string, history: Turn[]): string {
  const base = `TASK: ${task}\n\nPROJECT CONTEXT (files, truncated):\n${projectCtx.slice(0, 55000)}\n\n`
  const transcripts = history.map(h => `[${h.role.toUpperCase()} R${h.round}]:\n${h.raw.slice(0, 7000)}\n${h.parsed ? `PARSED: ${JSON.stringify(h.parsed).slice(0, 5000)}` : ''}`).join('\n\n---\n\n')
  const roleHelp: Record<Role, string> = {
    architect: base + (history.length ? '' : ''),
    coder: base + (history.length ? `PRIOR TURNS:\n${transcripts}\n\nNow write v1 (or v2 if prior feedback exists).` : ''),
    reviewer: base + `CODER OUTPUT (last):\n${history.filter(h=>h.role==='coder'||h.role==='fixer').slice(-1)[0]?.raw.slice(0,8000) || '(none)'}\n\nReview it.`,
    tester: base + `CODER OUTPUT (last):\n${history.filter(h=>h.role==='coder'||h.role==='fixer').slice(-1)[0]?.raw.slice(0,8000) || '(none)'}\n\nWrite tests for it.`,
    fixer: base + `ALL PRIOR:\n${transcripts}\n\nNow produce the fixed final files addressing Reviewer+Tester.`,
  }
  return roleHelp[role] || base
}

export async function runTeam(
  task: string,
  projectCtx: string,
  opts: { maxRounds?: number; providerId?: ProviderId } = {},
  cb: Callbacks = {}
): Promise<Session> {
  const maxRounds = opts.maxRounds ?? 2
  const session: Session = { task, rounds: 0, maxRounds, turns: [], status: 'running', consensus: false, finalFiles: [] }

  let round = 1
  while (round <= maxRounds) {
    session.rounds = round
    cb.onLog?.(`▶ Round ${round}/${maxRounds}`)

    // Architect only on round 1
    const roles: Role[] = round === 1 ? (['architect', 'coder', 'reviewer', 'tester', 'fixer'] as Role[]) : (['coder', 'reviewer', 'tester', 'fixer'] as Role[])

    for (const role of roles) {
      cb.onTurnStart?.(role, round)
      const prompt = buildPrompt(role, task, projectCtx, session.turns)
      const start = Date.now()
      let raw = ''
      try {
        raw = await callAgent(role, prompt, session.turns.map(t => ({ role: t.role, content: t.raw })))
      } catch (e: any) {
        // If provider chain exhausted, try mock synthesizing once, then error
        cb.onLog?.(`⚠ ${role} failed: ${e.message}`)
        throw e
      }
      const parsed = extractJSON(raw)
      const turn: Turn = { role, round, raw, parsed, thinkingMs: Date.now() - start }

      // interpret approved / files
      if (role === 'reviewer' && parsed) turn.approved = !!parsed.approved
      if (role === 'tester' && parsed) turn.approved = !!parsed.passed
      if ((role === 'coder' || role === 'fixer') && parsed?.files) turn.files = parsed.files

      // fallback: if parsing failed but LLM gave files-like text, keep raw for UI
      session.turns.push(turn)
      cb.onTurnEnd?.(turn)

      // polite delay to respect OVH 2 RPM when on no-key provider (600ms between calls ≈ up to 100 RPM, but provider itself throttles to 2 RPM — we space 700ms and let retry)
      await new Promise(r => setTimeout(r, 650))
    }

    // consensus: reviewer approved && tester passed in this round
    const rev = session.turns.filter(t => t.round === round && t.role === 'reviewer').slice(-1)[0]
    const test = session.turns.filter(t => t.round === round && t.role === 'tester').slice(-1)[0]
    const consensus = !!(rev?.approved && test?.approved)
    session.consensus = consensus
    cb.onRoundEnd?.(round, consensus)
    if (consensus) break
    if (round >= maxRounds) break
    round++
  }

  session.finalFiles = collectFinalFiles(session.turns)
  session.status = 'done'
  cb.onDone?.(session)
  return session
}
