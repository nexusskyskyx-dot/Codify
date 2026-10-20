import { useEffect, useState } from 'react'
import { CheckCircle, X, Info } from 'lucide-react'

export type ToastMsg = { id: string, text: string, type?: 'success'|'info'|'error' }

export function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const push = (text: string, type: ToastMsg['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2,7)
    setToasts(t=> [...t, { id, text, type }])
    setTimeout(()=> setToasts(t=> t.filter(x=> x.id!==id)), 2500)
  }
  const dismiss = (id: string) => setToasts(t=> t.filter(x=> x.id!==id))
  return { toasts, push, dismiss }
}

export default function ToastContainer({ toasts, dismiss }: { toasts: ToastMsg[], dismiss: (id:string)=>void }) {
  if (!toasts.length) return null
  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t=>(
        <div key={t.id} className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl border text-sm backdrop-blur
          ${t.type==='error' ? 'bg-tokyo-red text-white border-tokyo-red' : t.type==='info' ? 'bg-tokyo-bgFloat border-tokyo-border text-tokyo-fg' : 'bg-tokyo-bgFloat border-tokyo-border text-tokyo-fg'}`}>
          {t.type==='error' ? <X size={14} className="text-white" /> : t.type==='info' ? <Info size={14} className="text-tokyo-blue"/> : <CheckCircle size={14} className="text-tokyo-green"/>}
          <span className="max-w-[320px]">{t.text}</span>
          <button onClick={()=> dismiss(t.id)} className="ml-2 p-1 hover:bg-tokyo-bgHighlight rounded"><X size={12}/></button>
        </div>
      ))}
    </div>
  )
}
