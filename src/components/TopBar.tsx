import { Search, Command, Play, Share2, MoreHorizontal } from 'lucide-react'

export default function TopBar({ onPalette, onRun, previewOpen, setPreviewOpen, onToast }: any) {
  return (
    <div className="h-9 bg-tokyo-bgDark border-b border-tokyo-border flex items-center gap-2 px-2 sm:px-3 shrink-0">
      <img src="/logo.png" alt="Codify" className="w-6 h-6 rounded-md hidden sm:block object-cover" />
      <span className="font-semibold tracking-tight text-sm hidden sm:block">Codify</span>
      <span className="hidden sm:block text-tokyo-comment text-xs">— Code anywhere, fast.</span>

      <button onClick={onPalette} className="flex-1 sm:flex-none sm:mx-auto sm:w-[420px] flex items-center gap-2 bg-tokyo-bgHighlight border border-tokyo-border rounded-md px-2.5 py-1 text-sm text-tokyo-comment hover:border-tokyo-fgGutter">
        <Search size={14} className="shrink-0" />
        <span className="hidden sm:inline flex-1 text-left">Search, ask AI, or run command…</span>
        <span className="sm:hidden flex-1 text-left">Search…</span>
        <span className="hidden sm:flex items-center gap-1 text-[11px] bg-tokyo-bgDark border border-tokyo-border rounded px-1.5 py-0.5"><Command size={10}/> K</span>
      </button>

      <div className="flex items-center gap-1">
        <button onClick={()=>{ onRun(); onToast && onToast('▶ Running — check Preview'); }} className="hidden sm:flex items-center gap-1.5 bg-tokyo-blue hover:bg-[#6b92f0] text-white px-3 py-1 rounded-md text-xs font-semibold transition-colors">
          <Play size={12} fill="white" /> Run
        </button>
        <button onClick={()=>{ setPreviewOpen((v:boolean)=>!v); onToast && onToast(previewOpen ? 'Preview hidden' : 'Preview shown','info')}} className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${previewOpen ? 'bg-tokyo-blue text-white border-tokyo-blue' : 'bg-tokyo-bgHighlight border-tokyo-border text-tokyo-fgDark hover:text-tokyo-fg'}`}>{previewOpen ? 'Hide Preview' : 'Preview'}</button>
        <button onClick={async()=>{ try{ await navigator.clipboard.writeText(window.location.href); onToast && onToast('Link copied'); } catch{ onToast && onToast('Link: '+window.location.href,'info')} }} className="p-1.5 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark hidden sm:flex" title="Share link"><Share2 size={16}/></button>
        <button onClick={()=> onPalette()} className="p-1.5 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark hidden sm:flex" title="Command palette (⌘K)"><MoreHorizontal size={16}/></button>
      </div>
    </div>
  )
}
