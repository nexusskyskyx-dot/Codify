import { useMemo, useState, useRef, useEffect } from 'react'
import { AGENTS, type Role, type Turn, type Session } from '../lib/agents/team'
import { PROVIDERS, getActiveProviderId, setActiveProviderId, getProviderChain, isProviderReady, type ProviderId } from '../lib/agents/providers'
import { runTeam } from '../lib/agents/orchestrator'
import { projectContextForPrompt } from '../lib/storage'
import { probeProvider } from '../lib/agents/client'
import type { Project } from '../lib/types'

type Props = {
  project: Project | null
  onToast: (m: string, t?: 'success' | 'info' | 'error') => void
  onClose?: () => void
  onCreateFile: (p: string | null) => void
  onApplyTeamFiles?: (ops: { path: string, content: string }[]) => void
  onRun?: () => void
}

const ROLE_STYLE: Record<Role, string> = {
  architect: 'border-tokyo-blue bg-tokyo-bgHighlight',
  coder: 'border-tokyo-green bg-tokyo-bgHighlight',
  reviewer: 'border-tokyo-yellow bg-tokyo-bgHighlight',
  tester: 'border-tokyo-cyan bg-tokyo-bgHighlight',
  fixer: 'border-tokyo-magenta bg-tokyo-bgHighlight',
}

const EXAMPLES = [
  'Todo app with categories, search + localStorage',
  'Fix bug: preview shows blank after deleting file',
  'Add dark/light theme toggle, persist choice',
  'Kanban board — drag cards between columns',
  'Make all buttons functional + add tests',
]

export default function SidebarAgents({ project, onToast, onClose, onCreateFile, onApplyTeamFiles, onRun }: Props) {
  const [prompt, setPrompt] = useState('')
  const [providerId, setProviderId] = useState<ProviderId>(() => getActiveProviderId())
  const [session, setSession] = useState<Session | null>(null)
  const [running, setRunning] = useState(false)
  const [expandedTurn, setExpandedTurn] = useState<string | null>(null)
  const [showProviderHelp, setShowProviderHelp] = useState(false)
  const [liveTest, setLiveTest] = useState<Record<string, { ok: boolean; ms: number; msg: string } | null>>({})
  const [testing, setTesting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const provider = PROVIDERS[providerId]
  const chain = getProviderChain()
  const projectCtx = useMemo(() => project ? projectContextForPrompt(project) : 'No project — will create fresh files.', [project])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [session?.turns.length])

  function switchProvider(id: ProviderId) {
    setProviderId(id)
    setActiveProviderId(id)
    onToast(`Provider → ${PROVIDERS[id].label}`)
  }

  async function handleRun() {
    if (!prompt.trim()) { onToast('Describe the app or bug first', 'info'); return }
    setRunning(true)
    setSession({ task: prompt, rounds: 0, maxRounds: 2, turns: [], status: 'running', consensus: false, finalFiles: [] })
    setExpandedTurn(null)
    try {
      const s = await runTeam(prompt, projectCtx, { maxRounds: 2, providerId }, {
        onTurnStart: (role, round) => {
          setSession(prev => prev ? { ...prev, turns: [...prev.turns], rounds: round } : prev)
          // we rely on onTurnEnd to push
        },
        onTurnEnd: (turn) => {
          setSession(prev => prev ? { ...prev, turns: [...prev.turns, turn] as Turn[], rounds: turn.round } : prev)
          if (turn.files?.length) onToast(`${AGENTS[turn.role].icon} ${turn.role} produced ${turn.files.length} file(s)`, 'info')
        },
        onRoundEnd: (round, consensus) => {
          setSession(prev => prev ? { ...prev, consensus, rounds: round } : prev)
          if (consensus) onToast(`✓ Round ${round} — Reviewer + Tester approved`, 'success')
        },
        onDone: (s) => {
          setSession(s)
          if (s.finalFiles.length && onApplyTeamFiles) {
            onApplyTeamFiles(s.finalFiles)
          }
        }
      })
      if (!s.consensus) onToast(`Team finished ${s.rounds} round(s) — check Reviewer notes`, 'info')
      else onToast('✓ Team consensus — files applied', 'success')
    } catch (e: any) {
      onToast(e.message || 'Team failed', 'error')
      setSession(prev => prev ? { ...prev, status: 'error' } : prev)
    } finally {
      setRunning(false)
    }
  }

  const statusOf = (role: Role): 'idle' | 'running' | 'done' | 'needs' | 'error' => {
    if (!session) return 'idle'
    const last = [...session.turns].reverse().find(t => t.role === role)
    if (!last) return running ? 'idle' : 'idle'
    if (running && session.turns[session.turns.length - 1]?.role === role && session.status === 'running') {
    }
    if (role === 'reviewer' && last.parsed) return last.approved ? 'done' : 'needs'
    if (role === 'tester' && last.parsed) return last.approved ? 'done' : 'needs'
    return last ? 'done' : 'idle'
  }

  async function runLiveTest() {
    setTesting(true)
    setLiveTest({})
    const ids: ProviderId[] = ['pollinations', 'puter', 'ovh', 'llm7'] // top 3 + fallback
    for (const id of ids) {
      setLiveTest(prev => ({ ...prev, [id]: null }))
      const res = await probeProvider(id)
      setLiveTest(prev => ({ ...prev, [id]: res }))
      await new Promise(r => setTimeout(r, 350)) // respect pollinations 1 req per IP spacing
    }
    setTesting(false)
    onToast('Live test done — green = OK', 'info')
  }

  return (
    <div className="w-[360px] sm:w-[400px] bg-tokyo-bgFloat border-r border-tokyo-border flex flex-col shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-tokyo-border bg-tokyo-bgDark/50">
        <span className="text-[11px] font-black tracking-widest text-tokyo-fg">CODIFY TEAM</span>
        <span className="text-[10px] bg-tokyo-blue text-white px-1.5 py-0.5 rounded-full font-semibold">5 agents</span>
        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded border ${provider.requiresKey && !isProviderReady(providerId) ? 'bg-tokyo-red/20 border-tokyo-red/40 text-tokyo-red' : 'bg-tokyo-bgHighlight border-tokyo-border text-tokyo-comment'}`}>{provider.label.split('—')[0].trim()}</span>
        {onClose && <button onClick={onClose} className="ml-auto p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-comment">✕</button>}
      </div>

      {/* Free no-key banner — top 3 wired */}
      <div className="mx-3 mt-2 px-2.5 py-2 rounded-lg bg-[#1e2030] border border-tokyo-border flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-tokyo-green animate-pulse shrink-0" />
        <span className="text-[11px] text-tokyo-fgDark leading-tight flex-1">
          <b className="text-tokyo-fg">Free no-key wired</b> — Pollinations Legacy → Puter.js → OVH 2 RPM (all no key). Fallback to LLM7.
        </span>
        <button onClick={() => setShowProviderHelp(v => !v)} className="text-[11px] text-tokyo-blue hover:underline shrink-0">{showProviderHelp ? 'Hide' : 'Keys'}</button>
      </div>
      <div className="mx-3 mt-1.5 flex gap-1.5">
        <button onClick={runLiveTest} disabled={testing} className={`flex-1 text-[11px] px-2 py-1 rounded-full border font-medium ${testing ? 'bg-tokyo-bgDark border-tokyo-border text-tokyo-comment' : 'bg-tokyo-blue text-white border-tokyo-blue hover:bg-[#6b92f0]'}`}>{testing ? 'Testing…' : '▶ Test Live Providers'}</button>
        <span className="text-[10px] text-tokyo-comment self-center">Puter needs 1 sign-in • Pollinations 1 req/IP</span>
      </div>
      {Object.keys(liveTest).length > 0 && (
        <div className="mx-3 mt-1.5 p-2 rounded-lg bg-tokyo-bgDark border border-tokyo-border grid gap-1">
          {(['pollinations', 'puter', 'ovh', 'llm7'] as ProviderId[]).map(id => {
            const r = liveTest[id]
            return (
              <div key={id} className="flex items-center gap-2 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${!r ? 'bg-tokyo-yellow animate-pulse' : r.ok ? 'bg-tokyo-green' : 'bg-tokyo-red'}`} />
                <span className="text-tokyo-fgDark truncate flex-1">{PROVIDERS[id].label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${!r ? 'border-tokyo-border text-tokyo-comment' : r.ok ? 'bg-tokyo-green/20 border-tokyo-green/40 text-tokyo-green' : 'bg-tokyo-red/20 border-tokyo-red/40 text-tokyo-red'}`}>{!r ? '…' : r.ok ? `OK ${r.ms}ms` : `FAIL`}</span>
                {r && <span className="text-[10px] text-tokyo-comment hidden sm:block truncate max-w-[90px]">{r.msg}</span>}
              </div>
            )
          })}
        </div>
      )}

      {showProviderHelp && (
        <div className="mx-3 mt-2 p-2 rounded-lg bg-tokyo-bgDark border border-tokyo-border text-[11px] leading-4">
          <div className="font-semibold text-tokyo-fg mb-1">Plug-in providers (swap anytime)</div>
          <div className="text-tokyo-comment">Free no-key is a later plug-in, not the foundation. Team works via Mock even offline. Add a key to 10× RPM:</div>
          <div className="mt-2 grid gap-1">
            {Object.values(PROVIDERS).map(p => (
              <div key={p.id} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isProviderReady(p.id) ? 'bg-tokyo-green' : p.requiresKey ? 'bg-tokyo-yellow' : 'bg-tokyo-comment'}`} />
                <span className="text-tokyo-fgDark">{p.label}</span>
                {p.requiresKey && !isProviderReady(p.id) && <span className="text-tokyo-orange text-[10px]">needs key</span>}
              </div>
            ))}
          </div>
          <div className="mt-2 text-tokyo-comment">Set <code className="bg-tokyo-bgHighlight px-1 py-0.5 rounded border border-tokyo-border">VITE_OPENROUTER_KEY</code> + redeploy, or pick Groq/Kilo in dropdown.</div>
        </div>
      )}

      {/* Provider switcher */}
      <div className="px-3 py-2 flex items-center gap-2 border-b border-tokyo-border/50">
        <span className="text-[11px] tracking-widest font-semibold text-tokyo-comment">PROVIDER</span>
        <select value={providerId} onChange={e => switchProvider(e.target.value as ProviderId)} className="flex-1 bg-tokyo-bgDark border border-tokyo-border rounded-md px-2 py-1.5 text-xs text-tokyo-fg outline-none">
          {Object.values(PROVIDERS).map(p => (
            <option key={p.id} value={p.id}>{p.label}{!isProviderReady(p.id as ProviderId) && p.requiresKey ? ' — needs key' : ''}</option>
          ))}
        </select>
        <span className="text-[10px] text-tokyo-comment hidden sm:inline">{provider.rpm ? `${provider.rpm} RPM` : ''}</span>
      </div>

      {/* 5-agent pipeline */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-widest font-semibold text-tokyo-comment">TEAM • visible collaboration</span>
          {session && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-tokyo-bgHighlight border border-tokyo-border text-tokyo-comment">R{session.rounds}/{session.maxRounds} • {session.consensus ? '✓ consensus' : running ? '…running' : 'needs review'}</span>}
        </div>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {(Object.keys(AGENTS) as Role[]).map(role => {
            const ag = AGENTS[role]
            const st = statusOf(role)
            return (
              <div key={role} className={`rounded-lg border px-1.5 py-2 flex flex-col items-center gap-1 text-center ${ROLE_STYLE[role]} ${running ? 'opacity-80' : ''}`}>
                <span className="text-[14px]">{ag.icon}</span>
                <span className="text-[10px] font-bold leading-none text-tokyo-fg">{ag.name}</span>
                <span className={`w-2 h-2 rounded-full ${st === 'done' ? 'bg-tokyo-green' : st === 'needs' ? 'bg-tokyo-red' : st === 'error' ? 'bg-tokyo-red animate-pulse' : running && session?.turns.slice(-1)[0]?.role === role ? 'bg-tokyo-yellow animate-ping' : 'bg-tokyo-comment/40'}`} />
                <span className="text-[9px] text-tokyo-comment leading-none hidden sm:block">{ag.job}</span>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-tokyo-comment">
          <span>Flow:</span>
          <span className="px-1.5 py-0.5 rounded bg-tokyo-bgDark border border-tokyo-border">Architect → Coder → Reviewer+Tester → Fixer</span>
          <span className="hidden sm:inline">→ consensus?</span>
        </div>
      </div>

      {/* Quick examples */}
      <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
        {EXAMPLES.slice(0, 3).map(ex => (
          <button key={ex} onClick={() => setPrompt(ex)} className="text-[11px] px-2 py-1 rounded-full bg-tokyo-bgDark border border-tokyo-border hover:bg-tokyo-bgHighlight text-tokyo-fgDark">{ex}</button>
        ))}
      </div>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-2 space-y-2 border-t border-tokyo-border bg-tokyo-bgDark/30">
        {!session || session.turns.length === 0 ? (
          <div className="text-xs text-tokyo-comment leading-5 space-y-2">
            <p><b className="text-tokyo-fg">Describe an app or bug</b> — the 5 agents will talk through it visibly:</p>
            <ol className="list-decimal pl-4 space-y-1 text-tokyo-fgDark">
              <li><b>Architect</b> makes the plan (files + steps)</li>
              <li><b>Coder</b> writes v1</li>
              <li><b>Reviewer</b> + <b>Tester</b> critique v1 (bugs, tests)</li>
              <li><b>Fixer</b> produces v2</li>
              <li>Stop when both approve, or after 2–3 rounds</li>
            </ol>
            <p>Result is <b className="text-tokyo-green">auto-applied</b> to Explorer + Preview. Copy, download, or keep iterating.</p>
            <p className="text-[11px]">Try an example chip above, then <b>Run Team</b>.</p>
            <div className="pt-2 flex gap-2">
              <button onClick={() => onCreateFile(null)} className="text-[11px] px-2 py-1 rounded bg-tokyo-bgDark border border-tokyo-border">+ New File</button>
              <button onClick={() => onRun?.()} className="text-[11px] px-2 py-1 rounded bg-tokyo-blue text-white">▶ Preview</button>
            </div>
          </div>
        ) : (
          <>
            {session.turns.map((t, i) => {
              const ag = AGENTS[t.role]
              const isOpen = expandedTurn === `${t.role}-${t.round}-${i}`
              const parsed = t.parsed
              return (
                <div key={i} className="rounded-xl border border-tokyo-border bg-tokyo-bgDark overflow-hidden">
                  <button onClick={() => setExpandedTurn(isOpen ? null : `${t.role}-${t.round}-${i}`)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-tokyo-bgHighlight/50 text-left">
                    <span className="text-sm">{ag.icon}</span>
                    <span className="text-xs font-semibold text-tokyo-fg">{ag.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-tokyo-bgHighlight border border-tokyo-border text-tokyo-comment">R{t.round} • {ag.job}</span>
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full border ${t.role === 'reviewer' ? (t.approved ? 'bg-tokyo-green/20 border-tokyo-green/40 text-tokyo-green' : 'bg-tokyo-red/20 border-tokyo-red/40 text-tokyo-red') : t.role === 'tester' ? (t.approved ? 'bg-tokyo-green/20 border-tokyo-green/40 text-tokyo-green' : 'bg-tokyo-yellow/20 border-tokyo-yellow/40 text-tokyo-yellow') : 'bg-tokyo-bgHighlight border-tokyo-border text-tokyo-comment'}`}>
                      {t.role === 'reviewer' ? (t.approved ? '✓ approved' : '✎ needs changes') : t.role === 'tester' ? (t.approved ? '✓ passed' : '✗ failed') : t.files?.length ? `${t.files.length} file(s)` : 'done'}
                    </span>
                    <span className="text-tokyo-comment text-xs">{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-2 border-t border-tokyo-border bg-tokyo-bgFloat/50">
                      {/* Parsed summary */}
                      {parsed && (
                        <div className="mt-2 p-2 rounded-lg bg-tokyo-bgDark border border-tokyo-border text-[11px] leading-4">
                          {parsed.summary && <div className="text-tokyo-fg"><b>Summary:</b> {parsed.summary}</div>}
                          {parsed.plan && <div className="text-tokyo-fgDark mt-1"><b>Plan:</b> {parsed.plan}</div>}
                          {parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0 && (
                            <div className="mt-2">
                              <div className="font-semibold text-tokyo-blue">Files ({parsed.files.length}):</div>
                              <div className="mt-1 grid gap-1">
                                {parsed.files.map((f: any, idx: number) => (
                                  <div key={idx} className="px-2 py-1 rounded bg-tokyo-bgHighlight border border-tokyo-border flex items-center gap-2">
                                    <span className="text-tokyo-magenta text-[11px] truncate flex-1">{f.path || f.name}</span>
                                    <span className="text-[10px] text-tokyo-green">✓ {f.purpose ? f.purpose.slice(0, 60) : `${(f.content || '').length} chars`}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {parsed.issues && (
                            <div className="mt-2">
                              <div className="font-semibold text-tokyo-yellow">Issues ({parsed.issues.length}):</div>
                              {parsed.issues.map((iss: any, idx: number) => (
                                <div key={idx} className="mt-1 px-2 py-1 rounded bg-tokyo-bgHighlight border border-tokyo-border">
                                  <span className={`text-[10px] px-1 py-0.5 rounded ${iss.severity === 'blocker' ? 'bg-tokyo-red text-white' : iss.severity === 'major' ? 'bg-tokyo-orange text-white' : 'bg-tokyo-comment text-white'}`}>{iss.severity}</span>
                                  <span className="ml-1 text-tokyo-fg">{iss.issue}</span>
                                  <div className="text-tokyo-comment text-[11px] mt-0.5">→ {iss.suggestion}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {parsed.tests && (
                            <div className="mt-2">
                              <div className="font-semibold text-tokyo-cyan">Tests:</div>
                              {parsed.tests.map((tt: any, idx: number) => (
                                <div key={idx} className="text-tokyo-fgDark truncate">{tt.path}</div>
                              ))}
                              {parsed.checks && <div className="mt-1 text-tokyo-comment">{parsed.checks.length} checks</div>}
                            </div>
                          )}
                        </div>
                      )}
                      <details className="mt-2">
                        <summary className="text-[11px] text-tokyo-comment cursor-pointer">Raw output</summary>
                        <pre className="mt-1 text-[11px] leading-4 whitespace-pre-wrap break-words bg-tokyo-bgDark border border-tokyo-border rounded p-2 max-h-64 overflow-auto">{t.raw.slice(0, 8000)}</pre>
                      </details>
                    </div>
                  )}
                  {!isOpen && (
                    <div className="px-3 pb-2">
                      <pre className="text-[11px] leading-4 whitespace-pre-wrap break-words text-tokyo-fgDark line-clamp-3">{t.raw.slice(0, 260)}</pre>
                    </div>
                  )}
                </div>
              )
            })}
            {/* Final summary */}
            {session.status === 'done' && (
              <div className="rounded-xl border border-tokyo-green/40 bg-tokyo-green/10 p-3">
                <div className="text-xs font-semibold text-tokyo-green flex items-center gap-2">
                  <span>✓ Team finished — {session.consensus ? 'consensus reached' : `max rounds (${session.maxRounds})`} </span>
                  <span className="ml-auto text-[11px] bg-tokyo-bgDark border border-tokyo-border px-2 py-0.5 rounded-full text-tokyo-comment">{session.finalFiles.length} file(s) • auto-applied</span>
                </div>
                {session.finalFiles.length > 0 && (
                  <div className="mt-2 grid gap-1">
                    {session.finalFiles.map(f => (
                      <div key={f.path} className="flex items-center gap-2 px-2 py-1 rounded bg-tokyo-bgDark border border-tokyo-border">
                        <span className="text-[11px] text-tokyo-magenta truncate flex-1">{f.path}</span>
                        <span className="text-[10px] text-tokyo-green">✓ applied</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-[11px] text-tokyo-comment">Check Explorer (auto-expanded) and Preview. Download via Explorer → Export, or keep prompting the team.</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="p-2 border-t border-tokyo-border bg-tokyo-bgDark/20">
        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe app or bug — e.g. 'Build a markdown notes app with tags, search, and preview'"
            className="flex-1 bg-tokyo-bgDark border border-tokyo-border rounded-lg px-3 py-2 text-sm placeholder:text-tokyo-comment outline-none focus:border-tokyo-blue resize-none"
            disabled={running}
          />
          <button
            onClick={handleRun}
            disabled={running}
            className="self-stretch px-4 bg-tokyo-blue hover:bg-[#6b92f0] disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex flex-col items-center justify-center gap-0.5"
          >
            <span>{running ? '…' : '▶'}</span>
            <span className="text-[10px] leading-none">{running ? 'Running' : 'Run'}</span>
            <span className="text-[10px] leading-none">Team</span>
          </button>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-tokyo-comment">
          <span>5 agents talk visibly → produce files+tests+final → auto-apply</span>
          <span className="ml-auto hidden sm:inline">R2 max • stop on approval</span>
        </div>
      </div>
    </div>
  )
}
