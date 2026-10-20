import { useState } from 'react'
import { ChevronDown, ChevronRight, FilePlus2, FolderPlus, MoreHorizontal, Trash2, Pencil, Search as SearchIcon, GitBranch, BugPlay, Puzzle, Sparkles, Send, Copy, Download, FileCode2 } from 'lucide-react'
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
  onSwitchProject: (id: string)=>void
  onNewProject: ()=>void
  onRun: ()=>void
}

function FileIcon({ name, type }: { name: string, type: 'file'|'folder' }) {
  if (type==='folder') return <span className="text-xs">📁</span>
  const ext = name.split('.').pop()||''
  const map: Record<string,string> = { ts:'TS', tsx:'TSX', js:'JS', jsx:'JSX', py:'PY', html:'HTML', css:'CSS', json:'JSON', md:'MD' }
  return <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-tokyo-bgHighlight text-tokyo-blue border border-tokyo-border">{map[ext]||'FILE'}</span>
}

function TreeNode({ node, depth, activeId, expanded, toggle, onSelect, onCtx }: any) {
  const isFolder = node.type==='folder'
  const isOpen = expanded.has(node.id)
  return (
    <div>
      <div
        onClick={()=> isFolder ? toggle(node.id) : onSelect(node.id)}
        onContextMenu={(e)=>{ e.preventDefault(); onCtx(node.id, e) }}
        className={`group flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-tokyo-bgHighlight/70 text-[13px]
          ${activeId===node.id ? 'bg-[#2a2f4a] text-tokyo-fg border-l-2 border-tokyo-blue' : 'text-tokyo-fgDark border-l-2 border-transparent'}`}
        style={{ paddingLeft: 8 + depth*12 }}
      >
        {isFolder ? (isOpen ? <ChevronDown size={12} className="shrink-0 opacity-60" /> : <ChevronRight size={12} className="shrink-0 opacity-60" />) : <span className="w-3" />}
        <FileIcon name={node.name} type={node.type} />
        <span className="truncate flex-1">{node.name}</span>
        <span className="hidden group-hover:flex items-center gap-0.5">
          <button onClick={(e)=>{e.stopPropagation(); onCtx(node.id, e)}} className="p-1 hover:bg-tokyo-bgDark rounded"><MoreHorizontal size={12}/></button>
        </span>
      </div>
      {isFolder && isOpen && node.children?.map((c: FileNode)=>(
        <TreeNode key={c.id} node={c} depth={depth+1} activeId={activeId} expanded={expanded} toggle={toggle} onSelect={onSelect} onCtx={onCtx} />
      ))}
    </div>
  )
}

export default function Sidebar(props: Props) {
  const { project, projects, activeFileId, view, onSelectFile, onCreateFile, onCreateFolder, onRename, onDelete, onSwitchProject, onNewProject, onRun } = props
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1']))
  const [ctxId, setCtxId] = useState<string|null>(null)
  const [search, setSearch] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chat, setChat] = useState<{role:'user'|'ai', text:string}[]>([
    { role:'ai', text: 'Hi! I’m Codify AI. Ask me to explain code, generate functions, or debug — I’ll edit your files in place.'}
  ])

  const toggle = (id:string)=> setExpanded(s=>{ const n=new Set(s); if(n.has(id)) n.delete(id); else n.add(id); return n })

  if (view==='search') {
    const all = project ? collectAllFiles(project.files) : []
    const filtered = all.filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || (f.content||'').toLowerCase().includes(search.toLowerCase()))
    return (
      <div className="w-[260px] sm:w-[280px] bg-tokyo-bgSidebar border-r border-tokyo-border flex flex-col shrink-0">
        <div className="px-3 py-3 text-xs font-semibold tracking-widest text-tokyo-fg">SEARCH</div>
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 bg-tokyo-bgDark border border-tokyo-border rounded-md px-2 py-1.5">
            <SearchIcon size={14} className="text-tokyo-comment" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search files & content…" className="bg-transparent outline-none text-sm flex-1 placeholder:text-tokyo-comment" />
          </div>
        </div>
        <div className="flex-1 overflow-auto px-2 pb-2">
          {search ? filtered.map(f=>(
            <div key={f.id} onClick={()=>onSelectFile(f.id)} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-tokyo-bgHighlight cursor-pointer text-sm">
              <FileCode2 size={14} className="text-tokyo-blue" /> <span className="truncate">{f.name}</span>
            </div>
          )) : <p className="text-xs text-tokyo-comment px-2">Type to search across files.</p>}
        </div>
      </div>
    )
  }

  if (view==='ai') {
    return (
      <div className="w-[280px] sm:w-[320px] bg-tokyo-bgFloat border-r border-tokyo-border flex flex-col shrink-0">
        <div className="px-3 py-3 flex items-center gap-2 border-b border-tokyo-border">
          <Sparkles size={16} className="text-tokyo-magenta" />
          <span className="text-xs font-semibold tracking-widest">CODIFY AI</span>
          <span className="ml-auto text-[10px] bg-tokyo-blue text-white px-1.5 py-0.5 rounded">GPT-4o</span>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-3">
          {chat.map((m,i)=>(
            <div key={i} className={`rounded-xl px-3 py-2.5 text-[13px] leading-5 ${m.role==='user' ? 'bg-tokyo-blue text-white ml-6' : 'bg-tokyo-bgHighlight text-tokyo-fg mr-6 border border-tokyo-border'}`}>{m.text}</div>
          ))}
          <div className="flex flex-wrap gap-1.5">
            {['Explain this file','Add tests','Fix bugs','Make responsive'].map(q=>(
              <button key={q} onClick={()=> setChat(c=>[...c, {role:'user', text:q}, {role:'ai', text:`Sure! I’d ${q.toLowerCase()} by refactoring the active file — try opening a file and clicking “Ask AI”.`}])} className="text-xs px-2.5 py-1 rounded-full bg-tokyo-bgHighlight border border-tokyo-border hover:bg-tokyo-bgHighlight/80">{q}</button>
            ))}
          </div>
        </div>
        <div className="p-2 border-t border-tokyo-border flex gap-2">
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && chatInput.trim()){ setChat(c=>[...c, {role:'user', text:chatInput}, {role:'ai', text: 'Got it — I’ll apply that change. In Codify cloud this would edit your files directly and run tests.'}]); setChatInput('')}}} placeholder="Ask AI to edit, explain…" className="flex-1 bg-tokyo-bgDark border border-tokyo-border rounded-lg px-3 py-2 text-sm outline-none focus:border-tokyo-blue" />
          <button onClick={()=>{ if(!chatInput.trim()) return; setChat(c=>[...c, {role:'user', text:chatInput}, {role:'ai', text: 'Done — I’d patch the file and show a diff. Wire Codify AI to your LLM to make this live.'}]); setChatInput('')}} className="bg-tokyo-blue text-white p-2 rounded-lg"><Send size={16} /></button>
        </div>
      </div>
    )
  }

  if (view==='git' || view==='debug' || view==='extensions') {
    const info = {
      git: { icon: GitBranch, title:'SOURCE CONTROL', desc:'No changes — commit history and branches appear here. Connect GitHub to enable push/pull.' },
      debug: { icon: BugPlay, title:'RUN & DEBUG', desc:'Start debugging with a launch config. Codify supports Node, Python, and browser.' },
      extensions: { icon: Puzzle, title:'EXTENSIONS', desc:'Browse themes, linters, and AI packs. Preinstalled: Tokyo Night, Prettier, ESLint.' },
    }[view]!
    return (
      <div className="w-[260px] sm:w-[280px] bg-tokyo-bgSidebar border-r border-tokyo-border p-4 shrink-0">
        <div className="text-xs font-semibold tracking-widest flex items-center gap-2"> <info.icon size={14}/> {info.title}</div>
        <p className="text-sm text-tokyo-comment mt-3 leading-5">{info.desc}</p>
        <button onClick={onRun} className="mt-4 w-full bg-tokyo-blue hover:bg-[#6b92f0] text-white rounded-lg py-2 text-sm font-medium">Run Project</button>
      </div>
    )
  }

  // explorer
  return (
    <div className="w-[260px] sm:w-[280px] bg-tokyo-bgSidebar border-r border-tokyo-border flex flex-col shrink-0 min-h-0">
      {/* project switcher */}
      <div className="px-3 py-2.5 border-b border-tokyo-border flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] tracking-widest text-tokyo-comment font-semibold">PROJECT</div>
          <select value={project?.id||''} onChange={e=>onSwitchProject(e.target.value)} className="w-full bg-tokyo-bgDark border border-tokyo-border rounded-md px-2 py-1 text-sm text-tokyo-fg outline-none mt-1">
            {projects.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <button onClick={onNewProject} className="mt-4 bg-tokyo-blue hover:bg-[#6b92f0] text-white rounded-md px-2.5 py-1.5 text-xs font-semibold">New</button>
      </div>

      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-tokyo-fg">EXPLORER</span>
        <div className="flex items-center gap-1">
          <button onClick={()=>onCreateFile(null)} title="New File" className="p-1.5 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><FilePlus2 size={14} /></button>
          <button onClick={()=>onCreateFolder(null)} title="New Folder" className="p-1.5 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><FolderPlus size={14} /></button>
          <button onClick={()=>onRun} title="Run" className="hidden sm:flex items-center gap-1 bg-tokyo-blue text-white px-2.5 py-1 rounded-md text-xs font-medium ml-1">▶ Run</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        {!project ? <p className="text-sm text-tokyo-comment px-3 py-4">No project. Create one.</p> :
          project.files.map(n=> <TreeNode key={n.id} node={n} depth={0} activeId={activeFileId} expanded={expanded} toggle={toggle} onSelect={onSelectFile} onCtx={(id:string)=> setCtxId(id)} />)
        }
      </div>

      {ctxId && (
        <div className="absolute left-[60px] sm:left-[72px] mt-32 bg-tokyo-bgFloat border border-tokyo-border rounded-lg shadow-xl py-1 w-48 z-50 text-sm">
          <button onClick={()=>{onCreateFile(ctxId); setCtxId(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight flex items-center gap-2"><FilePlus2 size={14}/> New File</button>
          <button onClick={()=>{onCreateFolder(ctxId); setCtxId(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight flex items-center gap-2"><FolderPlus size={14}/> New Folder</button>
          <div className="h-px bg-tokyo-border my-1" />
          <button onClick={()=>{onRename(ctxId); setCtxId(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight flex items-center gap-2"><Pencil size={14}/> Rename</button>
          <button onClick={()=>{if(confirm('Delete?')) onDelete(ctxId); setCtxId(null)}} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight text-tokyo-red flex items-center gap-2"><Trash2 size={14}/> Delete</button>
          <button onClick={()=> setCtxId(null)} className="w-full text-left px-3 py-1.5 hover:bg-tokyo-bgHighlight opacity-60">Close</button>
        </div>
      )}

      <div className="p-3 border-t border-tokyo-border space-y-2">
        <div className="flex gap-2">
          <button onClick={()=>{ if(!project) return; const blob=new Blob([JSON.stringify(project.files,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${project.name}.json`; a.click()}} className="flex-1 flex items-center justify-center gap-1.5 bg-tokyo-bgDark border border-tokyo-border rounded-md py-1.5 text-xs hover:bg-tokyo-bgHighlight"><Download size={12}/> Export</button>
          <button onClick={()=>navigator.clipboard.writeText(window.location.href)} className="flex-1 flex items-center justify-center gap-1.5 bg-tokyo-bgDark border border-tokyo-border rounded-md py-1.5 text-xs hover:bg-tokyo-bgHighlight"><Copy size={12}/> Share</button>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-tokyo-comment">
          <span className="w-2 h-2 rounded-full bg-tokyo-green animate-pulse" /> Codify autosaves to this browser
        </div>
      </div>
    </div>
  )
}
