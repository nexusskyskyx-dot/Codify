import { GitBranch, Bell, Check, Sparkles } from 'lucide-react'

export default function StatusBar({ fileName, language, lines }: { fileName?: string, language?: string, lines?: number }) {
  return (
    <div className="h-6 bg-[#0e5fe6] flex items-center px-2 gap-3 text-[11px] text-white shrink-0 overflow-x-auto">
      <span className="flex items-center gap-1.5 whitespace-nowrap"><GitBranch size={12}/> main</span>
      <span className="hidden sm:flex items-center gap-1.5 whitespace-nowrap"><Check size={12}/> No issues</span>
      <span className="hidden sm:inline opacity-80 whitespace-nowrap">{fileName || 'Welcome'} {language ? `• ${language}` : ''} {lines ? `• ${lines} lines` : ''}</span>
      <span className="flex-1" />
      <span className="hidden sm:flex items-center gap-1.5 bg-white/15 rounded px-1.5 py-0.5"><Sparkles size={10}/> Codify AI ready</span>
      <span className="whitespace-nowrap">UTF-8</span>
      <span className="whitespace-nowrap">{language || 'Plain Text'}</span>
      <Bell size={12} className="opacity-80" />
    </div>
  )
}
