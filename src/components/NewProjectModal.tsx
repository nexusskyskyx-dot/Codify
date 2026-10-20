import { useState } from 'react'
import { TEMPLATE_META } from '../lib/templates'
import { X } from 'lucide-react'

export default function NewProjectModal({ open, onClose, onCreate }: { open:boolean, onClose:()=>void, onCreate:(name:string, tpl:string)=>void }) {
  const [name, setName] = useState('my-codify-app')
  const [tpl, setTpl] = useState('react')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-[640px] bg-tokyo-bgFloat border border-tokyo-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-tokyo-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">New project</h3>
            <p className="text-xs text-tokyo-comment">Pick a template — you can add files later.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-tokyo-bgHighlight rounded-lg"><X size={16}/></button>
        </div>
        <div className="p-5">
          <label className="text-xs font-semibold tracking-widest text-tokyo-comment">PROJECT NAME</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="my-codify-app" className="mt-1 w-full bg-tokyo-bgDark border border-tokyo-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-tokyo-blue" />
          <div className="text-xs font-semibold tracking-widest text-tokyo-comment mt-4">TEMPLATE</div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {TEMPLATE_META.map(t=>(
              <button key={t.id} onClick={()=>setTpl(t.id)} className={`text-left p-3 rounded-xl border flex gap-3 ${tpl===t.id ? 'bg-tokyo-bgHighlight border-tokyo-blue' : 'bg-tokyo-bgDark border-tokyo-border hover:bg-tokyo-bgHighlight/60'}`}>
                <span className="text-xl">{t.icon}</span>
                <span>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-tokyo-comment">{t.description}</div>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 py-4 bg-tokyo-bgDark/50 border-t border-tokyo-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-tokyo-border text-sm">Cancel</button>
          <button onClick={()=>{ if(!name.trim()) return; onCreate(name.trim(), tpl); onClose() }} className="px-5 py-2 rounded-lg bg-tokyo-blue hover:bg-[#6b92f0] text-white text-sm font-semibold">Create project</button>
        </div>
      </div>
    </div>
  )
}
