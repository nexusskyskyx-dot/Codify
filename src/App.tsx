import { useEffect, useMemo, useState } from 'react'
import ActivityBar from './components/ActivityBar'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import EditorArea from './components/EditorArea'
import Terminal from './components/Terminal'
import StatusBar from './components/StatusBar'
import CommandPalette from './components/CommandPalette'
import NewProjectModal from './components/NewProjectModal'
import { FileNode, Project, Tab } from './lib/types'
import { loadProjects, saveProjects, loadActiveId, saveActiveId, makeProject, findFile, updateFileContent, addNode, deleteNode, renameNode, collectAllFiles } from './lib/storage'
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

  const project = useMemo(()=> projects.find(p=>p.id===activeId) || projects[0] || null, [projects, activeId])
  const activeTab = useMemo(()=> tabs.find(t=>t.id===activeTabId) || null, [tabs, activeTabId])
  const activeFile: FileNode | null = useMemo(()=> project && activeTab ? findFile(project.files, activeTab.fileId) : null, [project, activeTab])

  useEffect(()=>{ if (!projects.length) return; if (!activeId) setActiveId(projects[0].id); }, [projects, activeId])
  useEffect(()=>{ if (activeId) saveActiveId(activeId) }, [activeId])
  useEffect(()=>{ saveProjects(projects) }, [projects])

  // responsive default: collapse sidebar on small screens initially
  useEffect(()=>{
    if (window.innerWidth < 768) setSidebarOpen(false)
    const onResize = ()=> { /* no-op */ }
    window.addEventListener('resize', onResize)
    return ()=> window.removeEventListener('resize', onResize)
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
    const ext = f.name.split('.').pop() || ''
    const tab: Tab = { id: Math.random().toString(36).slice(2,8), fileId, name: f.name, language: f.language || LANGUAGE_MAP[ext] || 'plaintext' }
    setTabs(t=> [...t, tab]); setActiveTabId(tab.id)
  }

  function handleChange(content: string) {
    if (!project || !activeTab) return
    persistProject(p=> ({ ...p, files: updateFileContent(p.files, activeTab.fileId, content)}))
    // mark dirty briefly then clear
    setTabs(ts=> ts.map(t=> t.id===activeTab.id ? { ...t, dirty: true } : t))
    setTimeout(()=> setTabs(ts=> ts.map(t=> t.id===activeTab.id ? { ...t, dirty: false } : t)), 800)
  }

  function createFile(parentId: string|null) {
    const name = prompt('New file name (with extension, e.g. app.ts, index.html):','untitled.txt')
    if (!name) return
    const ext = name.split('.').pop()||''
    const node: FileNode = { id: Math.random().toString(36).slice(2,8), name, type:'file', language: LANGUAGE_MAP[ext]||'plaintext', content: '' }
    persistProject(p=> ({...p, files: addNode(p.files, parentId, node)}))
    setTimeout(()=> openFile(node.id), 100)
  }
  function createFolder(parentId: string|null) {
    const name = prompt('New folder name:','components')
    if (!name) return
    const node: FileNode = { id: Math.random().toString(36).slice(2,8), name, type:'folder', children: [] }
    persistProject(p=> ({...p, files: addNode(p.files, parentId, node)}))
  }
  function doRename(id: string) {
    const cur = project ? findFile(project.files, id) : null
    const name = prompt('Rename to:', cur?.name||'')
    if (!name) return
    persistProject(p=> ({...p, files: renameNode(p.files, id, name)}))
    setTabs(ts=> ts.map(t=> t.fileId===id ? { ...t, name } : t))
  }
  function doDelete(id: string) {
    persistProject(p=> ({...p, files: deleteNode(p.files, id)}))
    setTabs(ts=> { const nt=ts.filter(t=> t.fileId!==id); if (activeTabId && ts.find(t=>t.id===activeTabId)?.fileId===id) setActiveTabId(nt[0]?.id||null); return nt })
  }

  function handleNewProject(name: string, tpl: string) {
    const pr = makeProject(name, tpl)
    setProjects(p=> [...p, pr]); setActiveId(pr.id); setTabs([]); setActiveTabId(null)
  }

  function runAction(id: string) {
    if (id==='__toggle__') { setPaletteOpen(o=>!o); return }
    if (id==='new-file') createFile(null)
    else if (id==='new-folder') createFolder(null)
    else if (id==='new-project') setNewOpen(true)
    else if (id==='run') setPreviewOpen(true)
    else if (id==='palette-preview') setPreviewOpen(o=>!o)
  }

  const previewHtml = useMemo(()=>{
    if (!project) return ''
    const files = collectAllFiles(project.files)
    const html = files.find(f=> f.name.endsWith('.html'))
    const css = files.filter(f=> f.name.endsWith('.css')).map(f=> f.content||'').join('\n')
    const js = files.filter(f=> f.name.endsWith('.js')).map(f=> f.content||'').join('\n;\n')
    if (html?.content) {
      let doc = html.content
      if (css && !doc.includes('<style>')) doc = doc.replace('</head>', `<style>${css}</style></head>`)
      if (js) doc = doc.replace('</body>', `<script>${js}<\/script></body>`)
      return doc
    }
    // fallback for non-html projects: show rendered markdown-ish
    const main = files[0]?.content || ''
    return `<!doctype html><html><head><style>body{background:#1a1b26;color:#c0caf5;font-family:Inter,system-ui;padding:24px}pre{background:#24283b;padding:16px;border-radius:12px;overflow:auto;border:1px solid #292e42}</style></head><body><h2 style="color:#7aa2f7">Preview</h2><p>This project has no HTML entry. Open an <code>.html</code> file to see live preview.</p><pre>${(main||'').slice(0,8000).replace(/</g,'&lt;')}</pre></body></html>`
  }, [project, activeFile])

  return (
    <div className="h-[100dvh] flex flex-col bg-tokyo-bg text-tokyo-fg overflow-hidden">
      <TopBar
        onPalette={()=> setPaletteOpen(true)}
        onRun={()=> setPreviewOpen(true)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        previewOpen={previewOpen}
        setPreviewOpen={setPreviewOpen}
      />
      <div className="flex-1 flex min-h-0 relative">
        <ActivityBar view={view} setView={setView} />

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
            onSwitchProject={(id)=>{ setActiveId(id); setTabs([]); setActiveTabId(null) }}
            onNewProject={()=> setNewOpen(true)}
            onRun={()=> setPreviewOpen(true)}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <EditorArea
            activeFile={activeFile}
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={(id)=> {
              setTabs(t=> t.filter(x=>x.id!==id))
              if (activeTabId===id) setActiveTabId(tabs.filter(t=>t.id!==id)[0]?.id || null)
            }}
            onChange={handleChange}
            showPreview={previewOpen}
            previewHtml={previewHtml}
          />
          <Terminal collapsed={termCollapsed} onToggle={()=> setTermCollapsed(v=>!v)} />
        </div>
      </div>
      <StatusBar fileName={activeFile?.name} language={activeFile?.language} lines={activeFile?.content?.split('\n').length} />

      <CommandPalette open={paletteOpen} onClose={()=> setPaletteOpen(false)} onAction={runAction} />
      <NewProjectModal open={newOpen} onClose={()=> setNewOpen(false)} onCreate={handleNewProject} />

      {/* Floating mobile action */}
      <button onClick={()=> setNewOpen(true)} className="sm:hidden fixed bottom-10 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-tokyo-logoLight to-tokyo-logoDeep text-white shadow-xl flex items-center justify-center text-2xl z-40">+</button>
    </div>
  )
}
