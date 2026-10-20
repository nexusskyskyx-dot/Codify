import { useEffect, useMemo, useState } from 'react'
import ActivityBar from './components/ActivityBar'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import EditorArea from './components/EditorArea'
import Terminal from './components/Terminal'
import StatusBar from './components/StatusBar'
import CommandPalette from './components/CommandPalette'
import NewProjectModal from './components/NewProjectModal'
import ToastContainer, { useToast } from './components/Toast'
import { FileNode, Project, Tab } from './lib/types'
import { loadProjects, saveProjects, loadActiveId, saveActiveId, makeProject, findFile, updateFileContent, addNode, deleteNode, renameNode, collectAllFiles, resolveFolderForCreate, findParentId } from './lib/storage'
import { LANGUAGE_MAP } from './lib/types'

type View = 'explorer'|'search'|'git'|'debug'|'extensions'|'ai'

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const p = loadProjects()
    if (p.length) return p
    const def = makeProject('my-codify-app', 'vanilla')
    return [def]
  })
  const [activeId, setActiveId] = useState<string>(()=> loadActiveId() || '')
  const [view, setView] = useState<View>('explorer')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [termCollapsed, setTermCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1']))
  const { toasts, push: toast, dismiss } = useToast()

  const project = useMemo(()=> projects.find(p=>p.id===activeId) || projects[0] || null, [projects, activeId])
  const activeTab = useMemo(()=> tabs.find(t=>t.id===activeTabId) || null, [tabs, activeTabId])
  const activeFile: FileNode | null = useMemo(()=> project && activeTab ? findFile(project.files, activeTab.fileId) : null, [project, activeTab])

  useEffect(()=>{ if (!projects.length) return; if (!activeId) setActiveId(projects[0].id); }, [projects, activeId])
  useEffect(()=>{ if (activeId) saveActiveId(activeId) }, [activeId])
  useEffect(()=>{ saveProjects(projects) }, [projects])

  useEffect(()=>{
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [])

  // keyboard: cmd+k palette
  useEffect(()=>{
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k') { e.preventDefault(); setPaletteOpen(o=>!o) }
    }
    window.addEventListener('keydown', h)
    return ()=> window.removeEventListener('keydown', h)
  }, [])

  function persistProject(upd: (p: Project)=>Project) {
    setProjects(ps => ps.map(pr => pr.id===project?.id ? upd(pr) : pr))
  }

  function openFile(fileId: string) {
    if (!project) return
    const f = findFile(project.files, fileId)
    if (!f || f.type!=='file') return
    const existing = tabs.find(t=> t.fileId===fileId)
    if (existing) { setActiveTabId(existing.id); return }
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    const tab: Tab = { id: Math.random().toString(36).slice(2,8), fileId, name: f.name, language: f.language || LANGUAGE_MAP[ext] || 'plaintext' }
    setTabs(t=> [...t, tab]); setActiveTabId(tab.id)
  }

  function handleChange(content: string) {
    if (!project || !activeTab) return
    persistProject(p=> ({ ...p, files: updateFileContent(p.files, activeTab.fileId, content)}))
    setTabs(ts=> ts.map(t=> t.id===activeTab.id ? { ...t, dirty: true } : t))
    setTimeout(()=> setTabs(ts=> ts.map(t=> t.id===activeTab.id ? { ...t, dirty: false } : t)), 700)
  }

  function createFile(parentId: string|null) {
    if (!project) { toast('No project','error'); return }
    const effectiveParent = parentId ? resolveFolderForCreate(project.files, parentId) : null
    const name = prompt('New file name (with extension, e.g. app.ts, index.html):','untitled.txt')
    if (name === null) return
    const trimmed = name.trim()
    if (!trimmed) { toast('Name cannot be empty','error'); return }
    const ext = trimmed.split('.').pop()?.toLowerCase()||''
    const node: FileNode = { id: Math.random().toString(36).slice(2,8), name: trimmed, type:'file', language: LANGUAGE_MAP[ext]||'plaintext', content: trimmed.endsWith('.html') ? '<!-- New file -->\n<div>Hello Codify</div>' : '' }
    persistProject(p=> ({...p, files: addNode(p.files, effectiveParent, node)}))
    if (effectiveParent) setExpanded(s=> { const n=new Set(s); n.add(effectiveParent); return n })
    toast(`Created ${trimmed}`)
    setTimeout(()=> openFile(node.id), 120)
  }
  function createFolder(parentId: string|null) {
    if (!project) { toast('No project','error'); return }
    const effectiveParent = parentId ? resolveFolderForCreate(project.files, parentId) : null
    const name = prompt('New folder name:','components')
    if (name === null) return
    const trimmed = name.trim()
    if (!trimmed) { toast('Name cannot be empty','error'); return }
    const node: FileNode = { id: Math.random().toString(36).slice(2,8), name: trimmed, type:'folder', children: [] }
    persistProject(p=> ({...p, files: addNode(p.files, effectiveParent, node)}))
    if (effectiveParent) setExpanded(s=> { const n=new Set(s); n.add(effectiveParent); return n })
    // also expand new folder so user sees it's there
    setExpanded(s=> { const n=new Set(s); n.add(node.id); return n })
    toast(`Created folder ${trimmed}`)
  }
  function doRename(id: string) {
    if (!project) return
    const cur = findFile(project.files, id)
    const name = prompt('Rename to:', cur?.name||'')
    if (name === null) return
    const trimmed = name.trim()
    if (!trimmed) { toast('Name cannot be empty','error'); return }
    if (trimmed === cur?.name) return
    persistProject(p=> ({...p, files: renameNode(p.files, id, trimmed)}))
    setTabs(ts=> ts.map(t=> t.fileId===id ? { ...t, name: trimmed } : t))
    toast(`Renamed to ${trimmed}`)
  }
  function doDelete(id: string) {
    if (!project) return
    const cur = findFile(project.files, id)
    const name = cur?.name || id
    // collect all fileIds to close tabs (if folder, delete all child file tabs)
    const toDeleteIds = new Set<string>()
    function collect(targetFiles: FileNode[]) {
      for (const f of targetFiles) {
        if (f.id === id) {
          // found target, collect its file descendants + itself if file
          function gather(n: FileNode) {
            if (n.type==='file') toDeleteIds.add(n.id)
            if (n.children) n.children.forEach(gather)
          }
          gather(f)
        } else if (f.children) collect(f.children)
      }
    }
    collect(project.files)
    // if target is file itself
    if (toDeleteIds.size===0) {
      // fallback: maybe it's a file not found via folder path (root)
      if (cur?.type==='file') toDeleteIds.add(id)
    }
    persistProject(p=> ({...p, files: deleteNode(p.files, id)}))
    // close tabs that correspond to deleted fileIds
    setTabs(prev=>{
      const remaining = prev.filter(t=> !toDeleteIds.has(t.fileId))
      // if active tab was deleted, select next available
      if (activeTabId && prev.find(t=> t.id===activeTabId && toDeleteIds.has(t.fileId))) {
        const next = remaining[0]?.id || null
        // need to defer setActiveTabId to avoid double set? we can set directly here via microtask
        queueMicrotask(()=> setActiveTabId(next))
      }
      return remaining
    })
    toast(`Deleted ${name}`)
  }

  function handleNewProject(name: string, tpl: string) {
    const pr = makeProject(name, tpl)
    setProjects(p=> [...p, pr]); setActiveId(pr.id); setTabs([]); setActiveTabId(null)
    setExpanded(new Set(['1']))
    toast(`Created project ${name} (${tpl})`)
  }
  function handleDeleteProject(id: string) {
    if (projects.length<=1) { toast('Cannot delete last project','error'); return }
    const removed = projects.find(p=> p.id===id)
    const next = projects.filter(p=> p.id!==id)
    setProjects(next)
    if (activeId===id) {
      setActiveId(next[0].id); setTabs([]); setActiveTabId(null)
    }
    toast(`Deleted project ${removed?.name}`)
  }
  function handleDuplicateProject(id: string) {
    const src = projects.find(p=> p.id===id)
    if (!src) return
    const clone: Project = {
      ...src,
      id: Math.random().toString(36).slice(2,9),
      name: src.name + ' copy',
      createdAt: Date.now(),
      files: JSON.parse(JSON.stringify(src.files))
    }
    setProjects(p=> [...p, clone]); setActiveId(clone.id); setTabs([]); setActiveTabId(null)
    toast(`Duplicated ${src.name}`)
  }

  function closeTab(id: string) {
    setTabs(prev=>{
      const next = prev.filter(t=> t.id!==id)
      if (activeTabId===id) {
        // pick nearest neighbor
        const idx = prev.findIndex(t=> t.id===id)
        const fallback = next[Math.min(idx, next.length-1)]?.id || next[0]?.id || null
        queueMicrotask(()=> setActiveTabId(fallback))
      }
      return next
    })
    toast('Closed tab','info')
  }

  function runAction(id: string) {
    if (id==='__toggle__') { setPaletteOpen(o=>!o); return }
    if (id==='new-file') createFile(null)
    else if (id==='new-folder') createFolder(null)
    else if (id==='new-project') setNewOpen(true)
    else if (id==='run') { setPreviewOpen(true); toast('▶ Running — preview refreshed') }
    else if (id==='palette-preview') { setPreviewOpen(o=>!o); toast(previewOpen ? 'Preview hidden' : 'Preview shown','info') }
    else if (id==='palette-theme') { toast('Theme: Tokyo Night (light coming soon)','info') }
    else if (id==='copy-link') { navigator.clipboard.writeText(window.location.href).then(()=> toast('Link copied')).catch(()=> toast(window.location.href,'info')) }
    else if (id==='ask-ai') { setView('ai'); setSidebarOpen(true); toast('Opened Codify AI','info') }
  }

  const previewHtml = useMemo(()=>{
    if (!project) return ''
    const files = collectAllFiles(project.files)
    const htmlFile = files.find(f=> f.name.toLowerCase().endsWith('.html'))
    const css = files.filter(f=> f.name.toLowerCase().endsWith('.css')).map(f=> f.content||'').join('\n')
    const js = files.filter(f=> f.name.toLowerCase().endsWith('.js')).map(f=> f.content||'').join('\n;\n')
    if (htmlFile?.content) {
      let doc = htmlFile.content
      // inject CSS
      if (css) {
        if (doc.includes('</head>')) doc = doc.replace('</head>', `<style>${css}</style></head>`)
        else if (doc.includes('<head>')) doc = doc.replace('<head>', `<head><style>${css}</style>`)
        else doc = `<style>${css}</style>` + doc
      }
      // inject JS
      if (js) {
        if (doc.includes('</body>')) doc = doc.replace('</body>', `<script>${js}<\/script></body>`)
        else doc = doc + `<script>${js}<\/script>`
      }
      return doc
    }
    const main = files[0]?.content || ''
    const name = htmlFile?.name || files[0]?.name || 'preview'
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#1a1b26;color:#c0caf5;font-family:Inter,system-ui;padding:24px;line-height:1.6}pre{background:#24283b;padding:16px;border-radius:12px;overflow:auto;border:1px solid #292e42;white-space:pre-wrap;word-break:break-word}code{background:#24283b;padding:2px 6px;border-radius:4px;border:1px solid #292e42}a{color:#7aa2f7}</style></head><body><h2 style="color:#7aa2f7;margin:0 0 8px">Preview</h2><p style="color:#565f89;margin:0 0 16px">No HTML file found — showing <code>${name}</code>. Add an <code>index.html</code> to see live HTML/CSS/JS.</p><pre>${(main||'(empty file)').slice(0,12000).replace(/</g,'&lt;')}</pre><p style="margin-top:16px;color:#565f89;font-size:12px">Codify preview • ${project.name} • ${files.length} files</p></body></html>`
  }, [project, activeFile])

  return (
    <div className="h-[100dvh] flex flex-col bg-tokyo-bg text-tokyo-fg overflow-hidden">
      <TopBar
        onPalette={()=> setPaletteOpen(true)}
        onRun={()=> { setPreviewOpen(true); toast('▶ Running — preview refreshed')}}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        previewOpen={previewOpen}
        setPreviewOpen={setPreviewOpen}
        onToast={toast}
      />
      <div className="flex-1 flex min-h-0 relative">
        <ActivityBar view={view} setView={setView} onToast={toast} />

        {/* mobile overlay */}
        {sidebarOpen && (
          <div onClick={()=> setSidebarOpen(false)} className="absolute inset-0 bg-black/40 z-20 sm:hidden" />
        )}

        <div className={`${sidebarOpen ? 'flex' : 'hidden sm:flex'} ${sidebarOpen ? 'absolute sm:static inset-y-0 left-[48px] sm:left-auto z-30 sm:z-auto' : ''} shrink-0`}>
          <Sidebar
            project={project}
            projects={projects}
            activeFileId={activeTab?.fileId || null}
            view={view}
            onSelectFile={openFile}
            onCreateFile={createFile}
            onCreateFolder={createFolder}
            onRename={doRename}
            onDelete={doDelete}
            onSwitchProject={(id)=>{ setActiveId(id); setTabs([]); setActiveTabId(null); setExpanded(new Set(['1'])); }}
            onNewProject={()=> setNewOpen(true)}
            onRun={()=> { setPreviewOpen(true); toast('▶ Running — preview refreshed')}}
            onToast={toast}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            expanded={expanded}
            setExpanded={setExpanded as any}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <EditorArea
            activeFile={activeFile}
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={closeTab}
            onChange={handleChange}
            showPreview={previewOpen}
            previewHtml={previewHtml}
            onToast={toast}
          />
          <Terminal collapsed={termCollapsed} onToggle={()=> setTermCollapsed(v=>!v)} onRun={()=>{ setPreviewOpen(true); toast('▶ Running from terminal')}} onToast={toast} />
        </div>
      </div>
      <StatusBar fileName={activeFile?.name} language={activeFile?.language} lines={activeFile?.content?.split('\n').length} />

      <CommandPalette open={paletteOpen} onClose={()=> setPaletteOpen(false)} onAction={runAction} />
      <NewProjectModal open={newOpen} onClose={()=> setNewOpen(false)} onCreate={handleNewProject} />
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      {/* Floating mobile action */}
      <button onClick={()=> setNewOpen(true)} className="sm:hidden fixed bottom-10 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-tokyo-logoLight to-tokyo-logoDeep text-white shadow-xl flex items-center justify-center text-2xl z-40 hover:scale-105 transition-transform">+</button>
    </div>
  )
}
