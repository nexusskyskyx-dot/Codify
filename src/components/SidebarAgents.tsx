import { useMemo, useState, useRef, useEffect } from 'react'
import { AGENTS, type Role, type Turn, type Session } from '../lib/agents/team'
import { PROVIDERS, getActiveProviderId, setActiveProviderId, isProviderReady, type ProviderId } from '../lib/agents/providers'
import { runTeam } from '../lib/agents/orchestrator'
import { projectContextForPrompt } from '../lib/storage'
import { probeProvider } from '../lib/agents/client'
import type { Project } from '../lib/types'
import { Sparkles, Settings2, X, ArrowUp, Beaker, Check, AlertCircle, FileCode, ChevronDown, ChevronUp } from 'lucide-react'

type Props = {
  project: Project | null
  onToast: (m: string, t?: 'success' | 'info' | 'error') => void
  onClose?: () => void
  onCreateFile: (p: string | null) => void
  onApplyTeamFiles?: (ops: { path: string, content: string }[]) => void
  onRun?: () => void
}

const EXAMPLES = [
  'Todo with categories + search',
  'Fix preview blank bug',
  'Kanban with drag & drop',
]

const ROLE_SHORT: Record<Role, string> = {
  architect: 'Plan',
  coder: 'Code',
  reviewer: 'Review',
  tester: 'Test',
  fixer: 'Fix',
}

export default function SidebarAgents({ project, onToast, onClose, onCreateFile, onApplyTeamFiles, onRun }: Props) {
  const [prompt, setPrompt] = useState('')
  const [providerId, setProviderId] = useState<ProviderId>(() => getActiveProviderId())
  const [session, setSession] = useState<Session | null>(null)
  const [running, setRunning] = useState(false)
  const [openTurn, setOpenTurn] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [liveTest, setLiveTest] = useState<Record<string, { ok: boolean; ms: number; msg: string } | null>>({})
  const [testing, setTesting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const provider = PROVIDERS[providerId]
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
    if (!prompt.trim()) { onToast('Describe what to build', 'info'); return }
    setRunning(true)
    setSession({ task: prompt, rounds: 0, maxRounds: 2, turns: [], status: 'running', consensus: false, finalFiles: [] })
    setOpenTurn(null)
    try {
      const s = await runTeam(prompt, projectCtx, { maxRounds: 2, providerId }, {
        onTurnEnd: (turn) => {
          setSession(prev => prev ? { ...prev, turns: [...prev.turns, turn] as Turn[], rounds: turn.round } : prev)
          if (turn.files?.length) onToast(`${AGENTS[turn.role].icon} ${turn.role} · ${turn.files.length} files`, 'info')
        },
        onRoundEnd: (round, consensus) => {
          setSession(prev => prev ? { ...prev, consensus, rounds: round } : prev)
          if (consensus) onToast(`✓ Round ${round} approved`, 'success')
        },
        onDone: (s) => {
          setSession(s)
          if (s.finalFiles.length && onApplyTeamFiles) onApplyTeamFiles(s.finalFiles)
        }
      })
      onToast(s.consensus ? '✓ Consensus — files applied' : `Done ${s.rounds} rounds`, s.consensus ? 'success' : 'info')
    } catch (e: any) {
      onToast(e.message || 'Team failed', 'error')
      setSession(prev => prev ? { ...prev, status: 'error' } : prev)
    } finally { setRunning(false) }
  }

  async function runLiveTest() {
    setTesting(true); setLiveTest({})
    for (const id of (['pollinations','puter','ovh','llm7'] as ProviderId[])) {
      setLiveTest(p => ({ ...p, [id]: null }))
      const r = await probeProvider(id)
      setLiveTest(p => ({ ...p, [id]: r }))
      await new Promise(r => setTimeout(r, 350))
    }
    setTesting(false)
    onToast('Live check done', 'info')
  }

  const statusOf = (role: Role) => {
    if (!session) return 'idle'
    const last = [...session.turns].reverse().find(t => t.role === role)
    if (!last) return 'idle'
    if (role === 'reviewer' && last.parsed) return last.approved ? 'done' : 'needs'
    if (role === 'tester' && last.parsed) return last.approved ? 'done' : 'needs'
    return last ? 'done' : 'idle'
  }

  return (
    <div className="w-[380px] sm:w-[420px] bg-[#151621] border-r border-white/[0.06] flex flex-col shrink-0 h-full overflow-hidden selection:bg-[#7aa2f7]/30">
      {/* ─── Minimal header ─── */}
      <div className="h-[52px] px-4 flex items-center gap-3 shrink-0 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-full bg-white text-[#151621] grid place-items-center">
          <Sparkles size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium tracking-tight leading-none text-white">Codify</div>
          <div className="text-[11px] leading-none mt-0.5 text-white/40">5 agents · {provider.label.split('•')[0].trim()} · auto-apply</div>
        </div>
        <button onClick={() => setShowSettings(v => !v)} className={`w-8 h-8 grid place-items-center rounded-full border transition ${showSettings ? 'bg-white text-black border-white' : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'}`}>
          <Settings2 size={14} />
        </button>
        {onClose && (
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-full hover:bg-white/5 text-white/40 hover:text-white transition">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Settings sheet — minimal */}
      {showSettings && (
        <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-[11px] tracking-widest font-medium text-white/30">PROVIDER</div>
            <div className="flex-1" />
            <button onClick={runLiveTest} disabled={testing} className="text-[11px] px-2.5 py-1 rounded-full bg-white text-black disabled:opacity-50 font-medium hover:bg-white/90">
              {testing ? 'Checking…' : 'Test live'}
            </button>
          </div>
          <div className="relative">
            <select value={providerId} onChange={e => switchProvider(e.target.value as ProviderId)} className="w-full h-9 bg-[#1c1d2a] border border-white/10 rounded-full px-3.5 pr-8 text-[13px] text-white outline-none focus:border-white/20 appearance-none">
              {Object.values(PROVIDERS).map(p => (
                <option key={p.id} value={p.id}>{p.label}{!isProviderReady(p.id as ProviderId) && p.requiresKey ? ' · needs key' : ''}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
          {Object.keys(liveTest).length > 0 && (
            <div className="rounded-2xl bg-black/20 border border-white/5 p-2.5 grid gap-1.5">
              {( ['pollinations','puter','ovh','llm7'] as ProviderId[]).map(id => {
                const r = liveTest[id]; const p = PROVIDERS[id]
                return (
                  <div key={id} className="flex items-center gap-2 text-[12px]">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!r ? 'bg-amber-400 animate-pulse' : r.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className="flex-1 truncate text-white/70">{p.label}</span>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${!r ? 'bg-white/5 text-white/40' : r.ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{!r ? '…' : r.ok ? `${r.ms}ms` : 'fail'}</span>
                  </div>
                )
              })}
              <div className="text-[11px] text-white/30 pt-1">Puter needs 1 sign-in · Pollinations 1 req / 15s</div>
            </div>
          )}
          <div className="text-[11px] leading-4 text-white/30">Free no-key wired: Pollinations Legacy → Puter.js → OVH 2 RPM → LLM7. Add OpenRouter for 20 RPM.</div>
        </div>
      )}

      {/* ─── Minimal stepper ─── */}
      <div className="px-4 py-4 shrink-0">
        <div className="relative flex items-center justify-between">
          {/* track */}
          <div className="absolute left-[16px] right-[16px] top-[18px] h-px bg-white/10" />
          {(Object.keys(AGENTS) as Role[]).map(role => {
            const ag = AGENTS[role]; const st = statusOf(role)
            const active = running && session?.turns.slice(-1)[0]?.role === role
            return (
              <div key={role} className="relative z-10 flex flex-col items-center gap-1.5 w-[64px]">
                <div className={`w-9 h-9 rounded-full grid place-items-center text-[14px] border backdrop-blur transition
                  ${st === 'done' ? 'bg-emerald-500 text-white border-emerald-500' : st === 'needs' ? 'bg-amber-500 text-white border-amber-500' : active ? 'bg-white text-black border-white' : 'bg-[#1c1d2a] border-white/10 text-white/50'}`}>
                  {st === 'done' ? <Check size={14} /> : st === 'needs' ? <AlertCircle size={14} /> : <span>{ag.icon}</span>}
                </div>
                <div className="text-[11px] font-medium leading-none text-white/70">{ROLE_SHORT[role]}</div>
                <div className="text-[10px] leading-none text-white/30 hidden sm:block">{ag.job}</div>
              </div>
            )
          })}
        </div>
        {session && (
          <div className="mt-3 flex justify-center">
            <div className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/5 text-white/50">
              Round {session.rounds}/{session.maxRounds} · {session.consensus ? 'consensus' : running ? 'running' : 'needs review'}
            </div>
          </div>
        )}
      </div>

      {/* ─── Chat ─── */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 pb-4 space-y-3">
        {!session || session.turns.length === 0 ? (
          <div className="pt-6 space-y-4">
            <div className="mx-auto max-w-[320px] text-center">
              <div className="w-10 h-10 rounded-2xl bg-white text-black grid place-items-center mx-auto">
                <Sparkles size={16} />
              </div>
              <h2 className="mt-3 text-[15px] font-medium text-white">What should the team build?</h2>
              <p className="mt-1 text-[13px] leading-5 text-white/40">Describe an app or bug. Architect plans, Coder builds, Reviewer + Tester critique, Fixer ships. Auto-applied to Preview.</p>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setPrompt(ex)} className="shrink-0 text-[13px] px-3.5 py-2 rounded-full bg-white text-black hover:bg-white/90 transition">{ex}</button>
              ))}
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <div className="text-[11px] tracking-widest font-medium text-white/30">FLOW</div>
              <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[11px] text-white/50">
                <span>Plan</span><span>Code</span><span>Review</span><span>Test</span><span>Fix</span>
              </div>
              <div className="mt-1 flex gap-2 justify-center">
                <button onClick={() => onCreateFile(null)} className="text-[12px] px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white">+ New File</button>
                <button onClick={() => onRun?.()} className="text-[12px] px-3 py-1.5 rounded-full bg-white text-black">Preview</button>
              </div>
            </div>
          </div>
        ) : (
          session.turns.map((t, i) => {
            const ag = AGENTS[t.role]
            const isOpen = openTurn === `${t.role}-${t.round}-${i}`
            const parsed = t.parsed
            const isReviewer = t.role === 'reviewer'
            const isTester = t.role === 'tester'
            const badge = (isReviewer || isTester) ? (t.approved ? 'approved' : 'needs work') : (t.files?.length ? `${t.files.length} files` : 'done')
            const badgeTone = (isReviewer || isTester) ? (t.approved ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' : 'bg-amber-500/15 text-amber-300 border-amber-500/20') : 'bg-white/5 text-white/50 border-white/10'
            return (
              <div key={i} className="group">
                <div className="flex items-center gap-2 text-[11px] text-white/30">
                  <span className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/5 grid place-items-center text-[12px]">{ag.icon}</span>
                  <span className="font-medium text-white/70">{ag.name}</span>
                  <span>· R{t.round}</span>
                  <span className="flex-1" />
                  <span className={`px-2 py-0.5 rounded-full border text-[11px] ${badgeTone}`}>{badge}</span>
                </div>
                <div className="mt-2 ml-8 rounded-2xl border border-white/5 bg-white/[0.04] overflow-hidden">
                  <button onClick={() => setOpenTurn(isOpen ? null : `${t.role}-${t.round}-${i}`)} className="w-full text-left px-3.5 py-3 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {parsed?.summary ? (
                        <div className="text-[13px] leading-5 text-white/85 line-clamp-3">{parsed.summary}</div>
                      ) : (
                        <div className="text-[13px] leading-5 text-white/60 line-clamp-3 whitespace-pre-wrap break-words">{t.raw.slice(0, 220)}</div>
                      )}
                      {parsed?.files && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {parsed.files.slice(0, 3).map((f: any, idx: number) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-white text-black">
                              <FileCode size={12} /> {f.path || f.name}
                            </span>
                          ))}
                          {parsed.files.length > 3 && <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/50">+{parsed.files.length - 3}</span>}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 w-6 h-6 rounded-full bg-white/5 border border-white/5 grid place-items-center text-white/30 group-hover:text-white/60 transition">
                      {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 space-y-3 border-t border-white/5">
                      {parsed?.plan && <div className="text-[13px] leading-5 text-white/60"><span className="text-white/40">Plan:</span> {parsed.plan}</div>}
                      {parsed?.issues && (
                        <div className="space-y-1.5">
                          {parsed.issues.map((iss: any, idx: number) => (
                            <div key={idx} className="rounded-xl bg-amber-500/10 border border-amber-500/15 p-2.5">
                              <div className="text-[12px] font-medium text-amber-200">{iss.severity} · {iss.issue}</div>
                              <div className="text-[12px] text-white/50">→ {iss.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {parsed?.tests && (
                        <div className="rounded-xl bg-sky-500/10 border border-sky-500/15 p-2.5 text-[12px] leading-5 text-sky-200">
                          <div className="font-medium flex items-center gap-1.5"><Beaker size={12} /> Tests</div>
                          {parsed.tests.map((tt: any, idx: number) => <div key={idx} className="text-sky-200/80 truncate">{tt.path}</div>)}
                          {parsed.checks && <div className="text-white/40 mt-1">{parsed.checks.length} checks</div>}
                        </div>
                      )}
                      {parsed?.files && parsed.files.length > 0 && (
                        <div className="text-[12px] text-white/40">Files: {parsed.files.map((f: any) => f.path).join(', ')}</div>
                      )}
                      <details className="rounded-xl bg-black/20 border border-white/5 p-2.5">
                        <summary className="text-[11px] text-white/40 cursor-pointer list-none flex items-center gap-1">Raw output <ChevronDown size={12} /></summary>
                        <pre className="mt-2 text-[11px] leading-4 whitespace-pre-wrap break-words text-white/50 max-h-64 overflow-auto">{t.raw.slice(0, 8000)}</pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {session?.status === 'done' && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/15 p-3.5">
            <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-300">
              <Check size={14} /> Team finished — {session.consensus ? 'consensus' : `max ${session.maxRounds} rounds`}
              <span className="ml-auto text-[12px] px-2 py-0.5 rounded-full bg-white text-black">{session.finalFiles.length} files · auto-applied</span>
            </div>
            {session.finalFiles.length > 0 && (
              <div className="mt-3 grid gap-1.5">
                {session.finalFiles.map(f => (
                  <div key={f.path} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white text-black text-[12px]">
                    <FileCode size={12} className="opacity-50" /> <span className="truncate flex-1">{f.path}</span> <Check size={12} className="text-emerald-600" />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 text-[12px] text-white/40">Check Explorer + Preview. Export from Explorer.</div>
          </div>
        )}
      </div>

      {/* ─── Minimal composer ─── */}
      <div className="p-3 border-t border-white/[0.06] bg-[#151621]">
        <div className="relative flex items-end gap-2 rounded-[22px] bg-white border border-white/10 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleRun() } }}
            rows={1}
            placeholder="Ask the team to build or fix…"
            className="flex-1 min-h-[42px] max-h-[96px] bg-transparent px-3.5 py-2.5 text-[14px] placeholder:text-black/30 outline-none resize-none text-black"
            disabled={running}
          />
          <button
            onClick={handleRun}
            disabled={running || !prompt.trim()}
            className="w-9 h-9 shrink-0 rounded-full bg-black text-white grid place-items-center disabled:opacity-30 hover:bg-black/90 transition"
            aria-label="Run team"
          >
            {running ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowUp size={16} />}
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-white/30 px-1">
          <span>↩ Enter to run · Shift+Enter for newline</span>
          <span className="hidden sm:inline">Auto-apply · 2 rounds max</span>
        </div>
      </div>
    </div>
  )
}
