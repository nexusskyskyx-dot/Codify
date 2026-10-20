import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, FilePlus2, FolderPlus, MoreHorizontal, Trash2, Pencil, Copy as CopyIcon, Search as SearchIcon, GitBranch, BugPlay, Puzzle, Sparkles, Send, Copy, Download, FileCode2, FileText, FolderClosed } from 'lucide-react'
import { FileNode, Project } from '../lib/types'
import { collectAllFiles } from '../lib/storage'

type Props = {
  project: Project | null
  projects: Project[]
  activeFileId: string | null
  view: string
  onSelectFile: (id: string)=>void
  onCreateFile: (parentId: string|null)=>void
  onCreateFolder: (parentId: string|null)=>void
  onRename: (id: string)=>void
  onDelete: (id: string)=>void
  onDuplicate?: (id: string)=>void
  onSwitchProject: (id: string)=>void
  onNewProject: ()=>void
  onRun: ()=>void
  onToast: (msg:string, type?:'success'|'info'|'error')=>void
  onDeleteProject?: (id:string)=>void
  onDuplicateProject?: (id:string)=>void
  expanded: Set<string>
  setExpanded: (fn: (s:Set<string>)=>Set<string>)=>void
  onClose?: ()=>void
}

function FileIcon({ name, type, expanded }: { name: string, type: 'file'|'folder', expanded?: boolean }) {
  if (type==='folder') return expanded ? <span className="text-xs">📂</span> : <span className="text-xs">📁</span>
  const ext = name.split('.').pop()?.toLowerCase()||''
  const map: Record<string,string> = { ts:'TS', tsx:'TSX', js:'JS', jsx:'JSX', py:'PY', html:'HTML', css:'CSS', json:'JSON', md:'MD' }
  return <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-tokyo-bgHighlight text-tokyo-blue border border-tokyo-border">{map[ext]||'FILE'}</span>
}

function TreeNode({ node, depth, activeId, expanded, toggle, onSelect, onCtx, onMenu }: any) {
  const isFolder = node.type==='folder'
  const isOpen = expanded.has(node.id)
  return (
    <div>
      <div
        onClick={()=> isFolder ? toggle(node.id) : onSelect(node.id)}
        onContextMenu={(e)=>{ e.preventDefault(); onCtx(node.id, e) }}
        className={`group flex items-center gap-1.5 px-2 py-[5px] cursor-pointer hover:bg-tokyo-bgHighlight/70 text-[13px] select-none
          ${activeId===node.id ? 'bg-[#2a2f4a] text-tokyo-fg border-l-2 border-tokyo-blue' : 'text-tokyo-fgDark border-l-2 border-transparent'}`}
        style={{ paddingLeft: 8 + depth*12 }}
        title={`${node.type}: ${node.name} — right-click for actions`}
      >
        {isFolder ? (isOpen ? <ChevronDown size={12} className="shrink-0 opacity-60" /> : <ChevronRight size={12} className="shrink-0 opacity-60" />) : <span className="w-3" />}
        <FileIcon name={node.name} type={node.type} expanded={isOpen} />
        <span className="truncate flex-1">{node.name}</span>
        <span className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button onClick={(e)=>{e.stopPropagation(); onMenu(node.id, e)}} className="p-1 hover:bg-tokyo-bgDark rounded"><MoreHorizontal size={12}/></button>
        </span>
      </div>
      {isFolder && isOpen && node.children?.map((c: FileNode)=>(
        <TreeNode key={c.id} node={c} depth={depth+1} activeId={activeId} expanded={expanded} toggle={toggle} onSelect={onSelect} onCtx={onCtx} onMenu={onMenu} />
      ))}
    </div>
  )
}

export default function Sidebar(props: Props) {
  const { project, projects, activeFileId, view, onSelectFile, onCreateFile, onCreateFolder, onRename, onDelete, onSwitchProject, onNewProject, onRun, onToast, onDeleteProject, onDuplicateProject, expanded, setExpanded, onClose } = props
  const [ctx, setCtx] = useState<{ id: string, x: number, y: number } | null>(null)
  const [search, setSearch] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chat, setChat] = useState<{role:'user'|'ai', text:string}[]>([
    { role:'ai', text: 'Hi! I’m Codify AI. Ask me to explain code, generate functions, or debug — I’ll edit your files in place. Try “Explain this file”.'}
  ])
  const menuRef = useRef<HTMLDivElement>(null)

  const toggle = (id:string)=> setExpanded(s=>{ const n=new Set(s); if(n.has(id)) n.delete(id); else n.add(id); return n })

  // close menu on click outside / escape
  useEffect(()=>{
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setCtx(null) }
    const k = (e: KeyboardEvent) => { if (e.key==='Escape') setCtx(null) }
    window.addEventListener('mousedown', h)
    window.addEventListener('keydown', k)
    return ()=> { window.removeEventListener('mousedown', h); window.removeEventListener('keydown', k) }
  }, [])

  const handleCtx = (id:string, e: React.MouseEvent) => {
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    // position near cursor, clamp to viewport
    let x = e.clientX
    let y = e.clientY
    // prefer menu to the right of explorer, but if near edge shift left
    if (x + 220 > window.innerWidth) x = window.innerWidth - 230
    if (y + 260 > window.innerHeight) y = window.innerHeight - 270
    // fallback to element position if clientX/Y are 0 (from button click)
    if (e.clientX === 0 && e.clientY === 0) { x = rect.right + 8; y = rect.top }
    setCtx({ id, x, y })
  }

  if (view==='search') {
    const all = project ? collectAllFiles(project.files) : []
    const filtered = search.trim()
      ? all.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || (f.content||'').toLowerCase().includes(search.toLowerCase()))
      : []
    return (
      <div className="w-[280px] sm:w-[300px] bg-tokyo-bgSidebar border-r border-tokyo-border flex flex-col shrink-0 relative h-full">
        <div className="px-3 py-3 text-xs font-semibold tracking-widest text-tokyo-fg flex items-center gap-2"><SearchIcon size={12}/> SEARCH
          {onClose && <button onClick={onClose} className="ml-auto p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-comment">✕</button>}
        </div>
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 bg-tokyo-bgDark border border-tokyo-border rounded-md px-2 py-1.5 focus-within:border-tokyo-blue">
            <SearchIcon size={14} className="text-tokyo-comment" />
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search files & content…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-tokyo-comment" />
            {search && <button onClick={()=>setSearch('')} className="text-xs text-tokyo-comment hover:text-tokyo-fg">Clear</button>}
          </div>
        </div>
        <div className="flex-1 overflow-auto px-2 pb-2">
          {!search.trim() ? <p className="text-xs text-tokyo-comment px-2 py-2">Type to search across {all.length} files. Supports filename + content.</p> :
            filtered.length ? filtered.map(f=>(
              <div key={f.id} onClick={()=>{ onSelectFile(f.id); onToast(`Opened ${f.name}`)}} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-tokyo-bgHighlight cursor-pointer text-sm border border-transparent hover:border-tokyo-border">
                <FileCode2 size={14} className="text-tokyo-blue" /> <span className="truncate">{f.name}</span>
                <span className="ml-auto text-[10px] text-tokyo-comment">{f.language}</span>
              </div>
            )) : <p className="text-xs text-tokyo-comment px-2 py-4 text-center">No results for “{search}”</p>
          }
        </div>
      </div>
    )
  }

  if (view==='ai') {
    return (
      <div className="w-[300px] sm:w-[320px] bg-tokyo-bgFloat border-r border-tokyo-border flex flex-col shrink-0 h-full">
        <div className="px-3 py-3 flex items-center gap-2 border-b border-tokyo-border">
          <Sparkles size={16} className="text-tokyo-magenta" />
          <span className="text-xs font-semibold tracking-widest">CODIFY AI</span>
          <span className="ml-auto text-[10px] bg-tokyo-blue text-white px-1.5 py-0.5 rounded">GPT-4o</span>
          {onClose && <button onClick={onClose} className="ml-2 p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-comment">✕</button>}
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-3">
          {chat.map((m,i)=>(
            <div key={i} className={`rounded-xl px-3 py-2.5 text-[13px] leading-5 ${m.role==='user' ? 'bg-tokyo-blue text-white ml-6' : 'bg-tokyo-bgHighlight text-tokyo-fg mr-6 border border-tokyo-border'}`}>{m.text}</div>
          ))}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {['Explain this file','Add tests','Fix bugs','Make responsive'].map(q=>(
              <button key={q} onClick={()=> { setChat(c=>[...c, {role:'user', text:q}, {role:'ai', text:`Sure! I’d ${q.toLowerCase()} — for the active file I’d generate a diff. In production this calls your LLM and patches the file.`}]); onToast(`AI: ${q}`,'info')}} className="text-xs px-2.5 py-1 rounded-full bg-tokyo-bgHighlight border border-tokyo-border hover:bg-tokyo-bgDark">{q}</button>
            ))}
          </div>
        </div>
        <div className="p-2 border-t border-tokyo-border flex gap-2">
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && chatInput.trim()){ setChat(c=>[...c, {role:'user', text:chatInput}, {role:'ai', text: 'Got it — in Codify cloud I’d apply that edit live and show a diff. Connect an LLM key to make this real.'}]); onToast('Sent to Codify AI','info'); setChatInput('')}}} placeholder="Ask AI to edit, explain…" className="flex-1 bg-tokyo-bgDark border border-tokyo-border rounded-lg px-3 py-2 text-sm outline-none focus:border-tokyo-blue" />
          <button onClick={()=>{ if(!chatInput.trim()) return; setChat(c=>[...c, {role:'user', text:chatInput}, {role:'ai', text: 'Done — I’d patch the file and show a diff. Wire Codify AI to your LLM to make this live.'}]); onToast('Sent to Codify AI','info'); setChatInput('')}} className="bg-tokyo-blue hover:bg-[#6b92f0] text-white p-2 rounded-lg transition-colors"><Send size={16} /></button>
        </div>
      </div>
    )
  }

  if (view==='git' || view==='debug' || view==='extensions') {
    const info = {
      git: { icon: GitBranch, title:'SOURCE CONTROL', desc:'No changes — commit history and branches appear here. Connect GitHub to enable push/pull. Your repo is Codify — try committing via terminal git.' },
      debug: { icon: BugPlay, title:'RUN & DEBUG', desc:'Start debugging with a launch config. Codify supports Node, Python, and browser. Press Run to preview; breakpoints work in Monaco.' },
      extensions: { icon: Puzzle, title:'EXTENSIONS', desc:'Browse themes, linters, and AI packs. Preinstalled: Tokyo Night, Prettier, ESLint. Install more via marketplace (coming soon).' },
    }[view]!
    return (
      <div className="w-[280px] sm:w-[300px] bg-tokyo-bgSidebar border-r border-tokyo-border p-4 shrink-0 flex flex-col h-full">
        <div className="text-xs font-semibold tracking-widest flex items-center gap-2"> <info.icon size={14}/> {info.title}
          {onClose && <button onClick={onClose} className="ml-auto p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-comment">✕</button>}
        </div>
        <p className="text-sm text-tokyo-comment mt-3 leading-5">{info.desc}</p>
        <button onClick={()=>{ onRun(); onToast('▶ Running project — see Preview');}} className="mt-4 w-full bg-tokyo-blue hover:bg-[#6b92f0] text-white rounded-lg py-2 text-sm font-medium">Run Project</button>
        <button onClick={()=> onToast('Coming soon','info')} className="mt-2 w-full bg-tokyo-bgDark border border-tokyo-border rounded-lg py-2 text-sm">Learn more</button>
      </div>
    )
  }

  // explorer
  return (
    <div className="w-[280px] sm:w-[300px] bg-tokyo-bgSidebar border-r border-tokyo-border flex flex-col shrink-0 min-h-0 relative h-full">
      {/* drawer header with close */}
      <div className="h-7 flex items-center justify-between px-3 border-b border-tokyo-border bg-tokyo-bgDark/50">
        <span className="text-[11px] tracking-widest font-semibold text-tokyo-comment">EXPLORER DRAWER</span>
        {onClose && <button onClick={onClose} className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-comment hover:text-tokyo-fg" title="Close drawer (Esc)">✕</button>}
      </div>
      {/* project switcher */}
      <div className="px-3 py-2.5 border-b border-tokyo-border flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] tracking-widest text-tokyo-comment font-semibold">PROJECT</div>
          <select value={project?.id||''} onChange={e=>{ onSwitchProject(e.target.value); onToast(`Switched to ${projects.find(p=>p.id===e.target.value)?.name}`)}} className="w-full bg-tokyo-bgDark border border-tokyo-border rounded-md px-2 py-1 text-sm text-tokyo-fg outline-none mt-1">
            {projects.map(p=> <option key={p.id} value={p.id}>{p.name} — {p.template}</option>)}
          </select>
        </div>
        <button onClick={()=>{ onNewProject(); onToast('New project → choose template','info')}} className="mt-4 bg-tokyo-blue hover:bg-[#6b92f0] text-white rounded-md px-2.5 py-1.5 text-xs font-semibold">New</button>
      </div>

      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-tokyo-fg flex items-center gap-1.5"><FolderClosed size={12}/> EXPLORER</span>
        <div className="flex items-center gap-1">
          <button onClick={()=>onCreateFile(null)} title="New File (root)" className="p-1.5 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><FilePlus2 size={14} /></button>
          <button onClick={()=>onCreateFolder(null)} title="New Folder (root)" className="p-1.5 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><FolderPlus size={14} /></button>
          <button onClick={()=>{ onRun(); onToast('▶ Preview refreshed')}} title="Run" className="hidden sm:flex items-center gap-1 bg-tokyo-blue hover:bg-[#6b92f0] text-white px-2.5 py-1 rounded-md text-xs font-medium ml-1">▶ Run</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 pb-2">
        {!project ? <p className="text-sm text-tokyo-comment px-3 py-4">No project. Create one.</p> :
          project.files.length === 0 ? <p className="text-xs text-tokyo-comment px-3 py-4">Empty project — add a file.</p> :
          project.files.map(n=> <TreeNode key={n.id} node={n} depth={0} activeId={activeFileId} expanded={expanded} toggle={toggle} onSelect={(id:string)=>{ onSelectFile(id); }} onCtx={handleCtx} onMenu={handleCtx} />)
        }
      </div>

      {ctx && (
        <div
          ref={menuRef}
          style={{ position: 'fixed', left: ctx.x, top: ctx.y }}
          className="bg-tokyo-bgFloat border border-tokyo-border rounded-lg shadow-xl py-1 w-52 z-[60] text-sm"
        >
          <div className="px-3 py-1 text-[11px] tracking-widest text-tokyo-comment">ACTIONS</div>
          <button onClick={()=>{ onCreateFile(ctx.id); setCtx(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight flex items-center gap-2"><FilePlus2 size={14}/> New File inside</button>
          <button onClick={()=>{ onCreateFolder(ctx.id); setCtx(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight flex items-center gap-2"><FolderPlus size={14}/> New Folder inside</button>
          <button onClick={()=>{ const f = project ? project.files : null; if(!f) return; const n = collectAllFiles(project!.files).find(x=>x.id===ctx.id); if(n) { navigator.clipboard.writeText(n.content||''); onToast('Copied content');} setCtx(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight flex items-center gap-2"><CopyIcon size={14}/> Copy content</button>
          <div className="h-px bg-tokyo-border my-1" />
          <button onClick={()=>{ onRename(ctx.id); setCtx(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight flex items-center gap-2"><Pencil size={14}/> Rename</button>
          <button onClick={()=>{ if(confirm(`Delete "${project ? (function find(files:any,id:string):any{for(const f of files){if(f.id===id) return f; if(f.children){const r=find(f.children,id); if(r) return r}} return null})(project.files, ctx.id)?.name : ctx.id}"? This cannot be undone.`)){ onDelete(ctx.id); onToast('Deleted');} setCtx(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight text-tokyo-red flex items-center gap-2"><Trash2 size={14}/> Delete</button>
          <button onClick={()=> setCtx(null)} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight opacity-60 text-xs justify-center flex">Close (Esc)</button>
        </div>
      )}

      <div className="p-3 border-t border-tokyo-border space-y-2">
        <div className="flex gap-2">
          <button onClick={()=>{
            if(!project) return;
            const blob=new Blob([JSON.stringify({ name: project.name, template: project.template, files: project.files },null,2)],{type:'application/json'});
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a'); a.href=url; a.download=`${project.name.replace(/\s+/g,'-')}.json`; a.click();
            setTimeout(()=> URL.revokeObjectURL(url), 1000);
            onToast(`Exported ${project.name}.json`);
          }} className="flex-1 flex items-center justify-center gap-1.5 bg-tokyo-bgDark border border-tokyo-border rounded-md py-1.5 text-xs hover:bg-tokyo-bgHighlight hover:text-tokyo-fg"><Download size={12}/> Export</button>
          <button onClick={async()=>{
            try { await navigator.clipboard.writeText(window.location.href); onToast('Link copied — share anywhere')} catch { const el=document.createElement('textarea'); el.value=window.location.href; document.body.appendChild(el); el.select(); document.execCommand('copy'); el.remove(); onToast('Link copied');}
          }} className="flex-1 flex items-center justify-center gap-1.5 bg-tokyo-bgDark border border-tokyo-border rounded-md py-1.5 text-xs hover:bg-tokyo-bgHighlight"><Copy size={12}/> Share</button>
        </div>
        {projects.length>1 && (
          <div className="flex gap-2">
            <button onClick={()=> onDuplicateProject && project && onDuplicateProject(project.id)} className="flex-1 flex items-center justify-center gap-1 bg-tokyo-bgDark border border-tokyo-border rounded-md py-1.5 text-xs hover:bg-tokyo-bgHighlight"><CopyIcon size={11}/> Duplicate</button>
            <button onClick={()=> { if(!project) return; if(projects.length<=1){ onToast('Cannot delete last project','error'); return;} if(confirm(`Delete project "${project.name}"?`)){ onDeleteProject && onDeleteProject(project.id); onToast(`Deleted project ${project.name}`)}}} className="flex-1 flex items-center justify-center gap-1 bg-tokyo-bgDark border border-tokyo-border rounded-md py-1.5 text-xs hover:bg-tokyo-red/20 hover:text-tokyo-red hover:border-tokyo-red/30"><Trash2 size={11}/> Delete project</button>
          </div>
        )}
        <div className="flex items-center gap-2 text-[11px] text-tokyo-comment">
          <span className="w-2 h-2 rounded-full bg-tokyo-green animate-pulse" /> Codify autosaves to this browser
        </div>
      </div>
    </div>
  )
}
