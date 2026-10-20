import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { Trash2, Plus, Maximize2, Minimize2, Copy, RotateCcw } from 'lucide-react'

export default function Terminal({ collapsed, onToggle, onRun, onToast }: { collapsed: boolean, onToggle: ()=>void, onRun?: ()=>void, onToast?: (m:string, t?:any)=>void }) {
  const ref = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm|null>(null)
  const fitRef = useRef<FitAddon|null>(null)

  useEffect(()=>{
    if (!ref.current || collapsed) return
    if (termRef.current) return // already initialized
    const term = new XTerm({ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, theme: { background: '#16161e', foreground: '#c0caf5', cursor: '#c0caf5', selectionBackground: '#33467c88' }, cursorBlink: true, convertEol: true })
    const fit = new FitAddon(); term.loadAddon(fit)
    term.open(ref.current); 
    // delay fit to ensure container has size
    requestAnimationFrame(()=> { try{ fit.fit() } catch{} })
    term.writeln('\x1b[34mcodify@workspace\x1b[0m \x1b[90m~\x1b[0m \x1b[32m%\x1b[0m  Welcome to Codify Terminal — try \x1b[1mhelp\x1b[0m')
    term.writeln('Commands: help | ls | run | clear | echo <text> | pwd | date | whoami')
    term.write('\r\n$ ')
    let cmd = ''
    const history: string[] = []
    let hIdx = -1
    term.onKey(({ key, domEvent })=>{
      // handle arrow up/down for history
      if (domEvent.key==='ArrowUp') {
        if (history.length && hIdx < history.length-1) {
          hIdx++
          // clear current line
          term.write('\r\x1b[K$ ' + history[history.length-1-hIdx])
          cmd = history[history.length-1-hIdx]
        }
        domEvent.preventDefault()
      } else if (domEvent.key==='ArrowDown') {
        if (hIdx>0) {
          hIdx--
          term.write('\r\x1b[K$ ' + history[history.length-1-hIdx])
          cmd = history[history.length-1-hIdx]
        } else if (hIdx===0) {
          hIdx=-1; cmd=''; term.write('\r\x1b[K$ ')
        }
        domEvent.preventDefault()
      }
    })
    term.onData(d=>{
      if (d === '\r') {
        term.writeln('')
        const c = cmd.trim(); if(c) history.push(c); hIdx=-1; cmd=''
        if (c==='clear' || c==='cls') { term.clear(); term.writeln('codify@workspace ~ %  cleared'); }
        else if (c==='help') term.writeln('  help      Show this help\r\n  ls        List files (try `ls` in sidebar too)\r\n  run       Run project preview\r\n  clear     Clear terminal\r\n  echo X    Print X\r\n  pwd       Show path\r\n  date      Current date\r\n  whoami    Show user')
        else if (c==='ls') term.writeln('  src/  index.html  style.css  app.js  package.json  README.md')
        else if (c==='run') { term.writeln('  ▶ Running current project — opening Preview…'); onRun && onRun(); onToast && onToast('▶ Running'); }
        else if (c==='pwd') term.writeln('  /workspace/codify')
        else if (c==='date') term.writeln('  ' + new Date().toString())
        else if (c==='whoami') term.writeln('  codify')
        else if (c.startsWith('echo ')) term.writeln('  ' + c.slice(5))
        else if (c==='') {}
        else term.writeln(`  zsh: command not found: ${c}`)
        term.write('$ ')
      } else if (d==='\x7f') {
        if (cmd.length>0){ cmd=cmd.slice(0,-1); term.write('\b \b') }
      } else if (d==='\x03') { // ctrl+c
        cmd=''; term.writeln('^C'); term.write('$ ')
      } else { cmd+=d; term.write(d) }
    })
    termRef.current = term
    fitRef.current = fit
    const ro = new ResizeObserver(()=> { try{ fit.fit() } catch{} })
    ro.observe(ref.current)
    const onResize = ()=> { try{ fit.fit() } catch{} }
    window.addEventListener('resize', onResize)
    return ()=> { ro.disconnect(); window.removeEventListener('resize', onResize) }
  }, [collapsed])

  // when expanding again after collapse, re-fit
  useEffect(()=>{
    if (!collapsed && termRef.current && fitRef.current) {
      setTimeout(()=> { try{ fitRef.current!.fit(); termRef.current!.focus() } catch{} }, 80)
    }
  }, [collapsed])

  if (collapsed) {
    return (
      <div className="h-8 bg-tokyo-bgDark border-t border-tokyo-border flex items-center px-3 gap-2 shrink-0">
        <span className="text-xs tracking-widest font-semibold">TERMINAL</span>
        <span className="text-xs text-tokyo-comment hidden sm:inline">0 problems · zsh — Codify</span>
        <button onClick={onToggle} className="ml-auto text-xs bg-tokyo-bgHighlight border border-tokyo-border px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-tokyo-bgHighlight/80"><Maximize2 size={12}/> Expand</button>
      </div>
    )
  }

  return (
    <div className="h-[200px] sm:h-[220px] bg-[#16161e] border-t border-tokyo-border flex flex-col shrink-0">
      <div className="h-8 flex items-center px-3 gap-2 border-b border-tokyo-border bg-tokyo-bgDark shrink-0">
        <span className="text-xs font-semibold tracking-widest">TERMINAL</span>
        <span className="text-xs text-tokyo-comment hidden sm:inline">zsh — Codify</span>
        <span className="hidden sm:inline text-[10px] bg-tokyo-green/20 text-tokyo-green border border-tokyo-green/30 rounded px-1.5 py-0.5">connected</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={async()=>{ const sel = termRef.current?.getSelection(); if(sel){ await navigator.clipboard.writeText(sel); onToast && onToast('Copied selection')}}} title="Copy selection" className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><Copy size={14}/></button>
          <button onClick={()=> { termRef.current?.clear(); termRef.current?.writeln('codify@workspace ~ %  cleared'); termRef.current?.write('$ '); onToast && onToast('Terminal cleared','info')}} title="Clear" className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><Trash2 size={14}/></button>
          <button onClick={()=> { termRef.current?.writeln('codify@workspace ~ %  new session'); termRef.current?.write('$ '); onToast && onToast('New terminal line')}} title="New line" className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><Plus size={14}/></button>
          <button onClick={()=> { try{ fitRef.current?.fit()} catch{}; onToast && onToast('Terminal fitted','info')}} title="Fit" className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark hidden sm:block"><RotateCcw size={14}/></button>
          <button onClick={onToggle} className="ml-1 text-xs border border-tokyo-border px-2 py-0.5 rounded hover:bg-tokyo-bgHighlight flex items-center gap-1"><Minimize2 size={12}/> Collapse</button>
        </div>
      </div>
      <div ref={ref} className="flex-1 overflow-hidden" />
    </div>
  )
}
