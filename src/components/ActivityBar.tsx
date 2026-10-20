import { Files, Search, GitBranch, Bug, Puzzle, MessageCircle, Settings, User, LayoutGrid } from 'lucide-react'

type View = 'explorer'|'search'|'git'|'debug'|'extensions'|'ai'

export default function ActivityBar({ view, setView, onToast, drawerOpen }: { view: View, setView: (v: View)=>void, onToast?: (m:string,t?:any)=>void, activeView?: View, drawerOpen?: boolean }) {
  const items: { id: View, icon: any, label: string }[] = [
    { id: 'explorer', icon: Files, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'git', icon: GitBranch, label: 'Source Control' },
    { id: 'debug', icon: Bug, label: 'Run & Debug' },
    { id: 'extensions', icon: Puzzle, label: 'Extensions' },
    { id: 'ai', icon: MessageCircle, label: 'Codify AI' },
  ]
  return (
    <div className="w-[48px] sm:w-[52px] bg-tokyo-bgDark border-r border-tokyo-border flex flex-col items-center py-2 gap-1 shrink-0 z-10">
      <img src="/logo.png" alt="Codify" className="w-7 h-7 rounded-lg mb-1 object-cover" />
      <div className="h-px w-6 bg-tokyo-border my-1" />
      {items.map(it => {
        const active = view===it.id && drawerOpen
        return (
          <button
            key={it.id}
            onClick={()=> setView(it.id)}
            title={`${it.label} — click to ${active ? 'close' : 'open'} drawer`}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative
              ${active ? 'bg-tokyo-bgHighlight text-tokyo-blue' : 'text-tokyo-comment hover:text-tokyo-fg hover:bg-tokyo-bgHighlight/60'}`}
          >
            <it.icon size={18} strokeWidth={active ? 2.2 : 1.8} />
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-tokyo-blue rounded-r" />}
          </button>
        )
      })}
      <div className="flex-1" />
      <button onClick={()=> onToast && onToast('Layout: coming soon','info')} title="Layout" className="w-9 h-9 rounded-lg flex items-center justify-center text-tokyo-comment hover:text-tokyo-fg hover:bg-tokyo-bgHighlight/60">
        <LayoutGrid size={18} />
      </button>
      <button onClick={()=> onToast && onToast('Settings: theme is Tokyo Night','info')} title="Settings" className="w-9 h-9 rounded-lg flex items-center justify-center text-tokyo-comment hover:text-tokyo-fg hover:bg-tokyo-bgHighlight/60">
        <Settings size={18} />
      </button>
      <button onClick={()=> onToast && onToast('Codify — Code anywhere, fast.','info')} title="Account" className="w-8 h-8 rounded-full bg-gradient-to-br from-tokyo-logoLight to-tokyo-logoDeep flex items-center justify-center text-white mt-1 hover:scale-105 transition-transform">
        <User size={16} />
      </button>
    </div>
  )
}
