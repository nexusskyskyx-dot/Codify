import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Trash2, Plus, Maximize2 } from 'lucide-react'

export default function Terminal({ collapsed, onToggle }: { collapsed: boolean, onToggle: ()=>void }) {
  const ref = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm|null>(null)
  const [lines, setLines] = useState<string[]>([
    'codify@workspace ~ %  Welcome to Codify Terminal',
    'Type help for commands. This is a simulated shell (browser).',
  ])

  useEffect(()=>{
    if (!ref.current || termRef.current || collapsed) return
    const term = new XTerm({ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, theme: { background: '#16161e', foreground: '#c0caf5', cursor: '#c0caf5' }, cursorBlink: true })
    const fit = new FitAddon(); term.loadAddon(fit)
    term.open(ref.current); fit.fit()
    term.writeln('codify@workspace ~ %  Welcome to Codify Terminal')
    term.writeln('Try: help | ls | run | clear | echo hello')
    term.write('\r\n$ ')
    let cmd = ''
    term.onData(d=>{
      if (d === '\r') {
        term.writeln('')
        const c = cmd.trim(); cmd=''
        if (c==='clear') term.clear()
        else if (c==='help') term.writeln('Commands: help, ls, run, clear, echo <text>, pwd')
        else if (c==='ls') term.writeln('src/  index.html  style.css  app.js  package.json')
        else if (c==='run') term.writeln('▶ Running current project... (see Preview pane)')
        else if (c==='pwd') term.writeln('/workspace/codify')
        else if (c.startsWith('echo ')) term.writeln(c.slice(5))
        else if (c) term.writeln(`zsh: command not found: ${c}`)
        term.write('$ ')
      } else if (d==='\x7f') {
        if (cmd.length>0){ cmd=cmd.slice(0,-1); term.write('\b \b') }
      } else { cmd+=d; term.write(d) }
      setLines(l=>[...l, d])
    })
    termRef.current = term
    const ro = new ResizeObserver(()=> fit.fit())
    ro.observe(ref.current)
    return ()=> ro.disconnect()
  }, [collapsed])

  if (collapsed) {
    return (
      <div className="h-8 bg-tokyo-bgDark border-t border-tokyo-border flex items-center px-3 gap-2 shrink-0">
        <span className="text-xs tracking-widest font-semibold">TERMINAL</span>
        <span className="text-xs text-tokyo-comment">0 problems</span>
        <button onClick={onToggle} className="ml-auto text-xs bg-tokyo-bgHighlight border border-tokyo-border px-2.5 py-1 rounded-md flex items-center gap-1"><Maximize2 size={12}/> Expand</button>
      </div>
    )
  }

  return (
    <div className="h-[200px] sm:h-[220px] bg-[#16161e] border-t border-tokyo-border flex flex-col shrink-0">
      <div className="h-8 flex items-center px-3 gap-2 border-b border-tokyo-border bg-tokyo-bgDark shrink-0">
        <span className="text-xs font-semibold tracking-widest">TERMINAL</span>
        <span className="text-xs text-tokyo-comment hidden sm:inline">zsh — Codify</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={()=> termRef.current?.clear()} className="p-1 hover:bg-tokyo-bgHighlight rounded"><Trash2 size={14}/></button>
          <button className="p-1 hover:bg-tokyo-bgHighlight rounded"><Plus size={14}/></button>
          <button onClick={onToggle} className="text-xs border border-tokyo-border px-2 py-0.5 rounded hover:bg-tokyo-bgHighlight">Collapse</button>
        </div>
      </div>
      <div ref={ref} className="flex-1 overflow-hidden" />
    </div>
  )
}
