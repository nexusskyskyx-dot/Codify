import { useState } from 'react'
import { FREE_MODELS, NO_KEY_FALLBACKS, AGENT_LIST, type AgentKey } from '../lib/agents/freeModels'
import { callFreeAgent, runCollaborative } from '../lib/agents/client'
import { collectAllFiles } from '../lib/storage'
import type { Project } from '../lib/types'

const AGENT_ICON: Record<AgentKey, string> = {
  reviser: '🔍', coder: '💻', debugger: '🩹', fileMgr: '📁', orchestrator: '🧠', tester: '🧪', docs: '📝',
}

export default function SidebarAgents({ project, onToast, onClose, onCreateFile, onUpdateFile }:{ project: Project|null, onToast:(m:string,t?:'success'|'info'|'error')=>void, onClose?: ()=>void, onCreateFile: (p:string|null)=>void, onUpdateFile?:(id:string, content:string)=>void }) {
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState<AgentKey | null>(null)
  const [selected, setSelected] = useState<AgentKey>('coder')
  const [chat, setChat] = useState<{agent:AgentKey, text:string}[]>([])
  const [status, setStatus] = useState<Record<string, 'idle'|'running'|'done'|'error'>>({})

  const projectCtx = project ? JSON.stringify({ name: project.name, files: collectAllFiles(project.files).map(f=> ({ name:f.name, content:(f.content||'').slice(0,4000)})) }, null, 2) : 'No project open. Create a file first.'

  async function runOne(agent: AgentKey) {
    if (!prompt.trim()) { onToast('Type a task first', 'info'); return }
    setRunning(agent); setStatus(s=> ({...s, [agent]:'running'}))
    try {
      const res = await callFreeAgent(agent, `${prompt}\n\nProject:\n${projectCtx.slice(0,50000)}`)
      setChat(c=> [...c, {agent, text: res}])
      setStatus(s=> ({...s, [agent]:'done'}))
      onToast(`${FREE_MODELS[agent].label} ✓`, 'success')
    } catch(e:any){ setStatus(s=> ({...s, [agent]:'error'})); onToast(e.message, 'error') }
    setRunning(null)
  }

  async function runSwarm() {
    if (!prompt.trim()) { onToast('Type a task first — e.g. \"Add a todo list component\"', 'info'); return }
    setStatus({})
    await runCollaborative(prompt, projectCtx, (agent, chunk)=>{
      setChat(c=> [...c, {agent, text: chunk}])
      setStatus(s=> ({...s, [agent]: 'running'}))
    })
    onToast('Swarm done — 7 agents replied', 'success')
  }

  return (
    <div className="w-[340px] sm:w-[380px] bg-tokyo-bgFloat border-r border-tokyo-border flex flex-col shrink-0 h-full">
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-tokyo-border">
        <span className="text-xs font-bold tracking-widest text-tokyo-fg">CODIFY AI • FREE SWARM</span>
        <span className="text-[10px] bg-tokyo-blue text-white px-1.5 py-0.5 rounded-full">7 agents</span>
        {onClose && <button onClick={onClose} className="ml-auto p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-comment">✕</button>}
      </div>

      <div className="px-3 py-2 grid grid-cols-2 gap-1.5">
        {AGENT_LIST.map(a=>{
          const m = FREE_MODELS[a.key]
          const st = status[a.key] || 'idle'
          return (
            <button key={a.key} onClick={()=> setSelected(a.key)}
              className={`text-left rounded-lg border p-2 flex flex-col gap-0.5 hover:bg-tokyo-bgHighlight ${selected===a.key ? 'border-tokyo-blue bg-tokyo-bgHighlight' : 'border-tokyo-border bg-tokyo-bgDark'} ${st==='running' ? 'animate-pulse border-tokyo-green' : ''} ${st==='error' ? 'border-tokyo-red' : ''}`}>
              <span className="text-xs font-semibold flex items-center gap-1">{AGENT_ICON[a.key]} {m.label.split(' • ')[0]} <span className={`ml-auto w-2 h-2 rounded-full ${st==='running' ? 'bg-tokyo-yellow animate-ping' : st==='done' ? 'bg-tokyo-green' : st==='error' ? 'bg-tokyo-red' : 'bg-tokyo-comment/40'}`} /></span>
              <span className="text-[10px] text-tokyo-comment leading-tight line-clamp-2">{m.role}</span>
              <span className="text-[10px] text-tokyo-blue">{m.context} • {m.id.slice(0,18)}</span>
            </button>
          )
        })}
      </div>

      <div className="px-3 py-2 flex gap-1.5">
        <button onClick={runSwarm} disabled={!!running} className="flex-1 bg-tokyo-blue hover:bg-[#6b92f0] disabled:opacity-50 text-white rounded-lg py-2 text-xs font-semibold">▶ Run Swarm (all 7)</button>
        <button onClick={()=> runOne(selected)} disabled={!!running} className="px-3 bg-tokyo-bgDark border border-tokyo-border hover:bg-tokyo-bgHighlight rounded-lg text-xs">Run {selected}</button>
      </div>
      <div className="px-3 pb-1 flex gap-1 flex-wrap">
        <button onClick={()=> onCreateFile(null)} className="text-[11px] px-2 py-1 rounded-full bg-tokyo-bgDark border border-tokyo-border hover:bg-tokyo-bgHighlight">+ New File</button>
        <button onClick={()=> onToast('Keys: .env VITE_OPENROUTER_KEY (openrouter.ai/keys) or leave empty → OVH anonymous 2 RPM works','info')} className="text-[11px] px-2 py-1 rounded-full bg-tokyo-bgDark border border-tokyo-border">Free key help</button>
        <span className="text-[10px] text-tokyo-comment ml-auto">Fallback: OVH 2 RPM + LLM7 + Ollama</span>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2 border-t border-tokyo-border">
        {chat.length===0 ? <p className="text-xs text-tokyo-comment leading-5">Pick agents above, type a task, then <b>Run Swarm</b>. All 7 agents run in order (orchestrator→reviser→coder→debugger→fileMgr→tester→docs) and cross-reference each other's output. No key needed — OVH anonymous works by default (2 RPM). Add a free OpenRouter key for 20 RPM / 1000 RPD.</p>
          : chat.map((m,i)=> (
          <div key={i} className="rounded-xl border border-tokyo-border bg-tokyo-bgDark px-3 py-2.5">
            <div className="text-[11px] font-semibold text-tokyo-blue flex items-center gap-1">{AGENT_ICON[m.agent]} {FREE_MODELS[m.agent].label}</div>
            <pre className="text-[12px] leading-5 whitespace-pre-wrap break-words text-tokyo-fg mt-1 font-sans">{m.text.slice(0,6000)}</pre>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-tokyo-border flex gap-2">
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={2}
          placeholder="Task for the swarm — e.g. 'Add dark-mode toggle, update App.tsx, and add tests'"
          className="flex-1 bg-tokyo-bgDark border border-tokyo-border rounded-lg px-3 py-2 text-sm outline-none focus:border-tokyo-blue resize-none" />
        <button onClick={runSwarm} className="bg-tokyo-blue hover:bg-[#6b92f0] text-white px-4 rounded-lg text-sm font-semibold">Send</button>
      </div>
      <div className="px-2 pb-2 text-[11px] text-tokyo-comment">Selected: <b className="text-tokyo-fg">{FREE_MODELS[selected].label}</b> — {AGENT_LIST.find(a=>a.key===selected)?.prompt.slice(0,80)}</div>
    </div>
  )
}
