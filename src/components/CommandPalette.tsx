import { useEffect, useState } from 'react'
import { Search, FilePlus2, FolderPlus, Play, Palette, Command } from 'lucide-react'

export default function CommandPalette({ open, onClose, onAction }: {
  open: boolean, onClose: ()=>void, onAction: (a:string)=>void
}) {
  const [q, setQ] = useState('')
  useEffect(()=>{
    if (!open) setQ('')
    const h = (e: KeyboardEvent)=>{ if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); onAction('__toggle__') } if(e.key==='Escape') onClose() }
    window.addEventListener('keydown', h); return ()=> window.removeEventListener('keydown', h)
  }, [open])

  if (!open) return null
  const cmds = [
    { id:'new-file', label:'New File', desc:'Create a new file', icon: FilePlus2 },
    { id:'new-folder', label:'New Folder', desc:'Create a new folder', icon: FolderPlus },
    { id:'new-project', label:'New Project…', desc:'Start from a template', icon: FilePlus2 },
    { id:'run', label:'Run Project', desc:'Build & preview', icon: Play },
    { id:'palette-theme', label:'Toggle Theme', desc:'Tokyo Night ↔ Light', icon: Palette },
    { id:'palette-preview', label:'Toggle Preview', desc:'Show/hide live preview', icon: Search },
  ].filter(c=> !q || c.label.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[560px] bg-tokyo-bgFloat border border-tokyo-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-tokyo-border">
          <Search size={16} className="text-tokyo-comment" />
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Type a command or search…" className="flex-1 bg-transparent outline-none text-sm placeholder:text-tokyo-comment" />
          <span className="hidden sm:flex items-center gap-1 text-[11px] bg-tokyo-bgDark border border-tokyo-border rounded px-1.5 py-1"><Command size={10}/>K</span>
        </div>
        <div className="max-h-[320px] overflow-auto p-2">
          {cmds.map(c=>(
            <button key={c.id} onClick={()=>{ onAction(c.id); onClose() }} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-tokyo-bgHighlight">
              <c.icon size={16} className="text-tokyo-blue" />
              <span className="flex-1"><span className="text-sm">{c.label}</span><span className="text-xs text-tokyo-comment ml-2">{c.desc}</span></span>
            </button>
          ))}
          {cmds.length===0 && <p className="text-sm text-tokyo-comment px-3 py-6 text-center">No commands found.</p>}
        </div>
        <div className="px-3 py-2 border-t border-tokyo-border text-xs text-tokyo-comment flex gap-3">
          <span><span className="border border-tokyo-border rounded px-1">↑↓</span> navigate</span>
          <span><span className="border border-tokyo-border rounded px-1">↵</span> select</span>
          <span><span className="border border-tokyo-border rounded px-1">ESC</span> close</span>
        </div>
      </div>
    </div>
  )
}
