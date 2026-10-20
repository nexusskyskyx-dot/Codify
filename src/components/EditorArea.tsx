import Editor from '@monaco-editor/react'
import { FileNode, Tab } from '../lib/types'
import { X, Circle, Eye, RefreshCw, Copy, Maximize2 } from 'lucide-react'

export default function EditorArea({ activeFile, tabs, activeTabId, onTabSelect, onTabClose, onChange, showPreview, previewHtml, onToast }: {
  activeFile: FileNode | null
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (id: string)=>void
  onTabClose: (id: string)=>void
  onChange: (val: string)=>void
  showPreview: boolean
  previewHtml: string
  onToast?: (m:string, t?:any)=>void
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-tokyo-bg min-h-0">
      {/* tabs */}
      <div className="h-9 bg-tokyo-bgDark border-b border-tokyo-border flex items-center overflow-x-auto shrink-0 scrollbar-thin">
        {tabs.length===0 && <span className="text-xs text-tokyo-comment px-3 whitespace-nowrap">No open files — open from Explorer</span>}
        {tabs.map(t=>(
          <button
            key={t.id}
            onClick={()=>onTabSelect(t.id)}
            className={`h-full flex items-center gap-2 px-3 border-r border-tokyo-border text-xs whitespace-nowrap transition-colors
              ${activeTabId===t.id ? 'bg-tokyo-bg text-tokyo-fg border-t-2 border-t-tokyo-blue' : 'bg-tokyo-bgDark text-tokyo-comment hover:text-tokyo-fg hover:bg-tokyo-bgHighlight/60'}`}
          >
            <span className={`w-2 h-2 rounded-full ${t.language==='typescript' ? 'bg-[#3178c6]' : t.language==='python' ? 'bg-tokyo-green' : t.language==='css' ? 'bg-tokyo-magenta' : 'bg-tokyo-yellow'}`} />
            <span className="max-w-[140px] truncate">{t.name}</span>
            {t.dirty && <Circle size={8} className="fill-tokyo-blue text-tokyo-blue animate-pulse" />}
            <span onClick={(e)=>{e.stopPropagation(); onTabClose(t.id)}} className="p-0.5 hover:bg-tokyo-bgHighlight rounded ml-1"><X size={12}/></span>
          </button>
        ))}
        <div className="flex-1 bg-tokyo-bgDark min-w-[40px]" />
        {showPreview && tabs.length>0 && (
          <div className="hidden sm:flex items-center gap-1 px-2 border-l border-tokyo-border bg-tokyo-bgDark">
            <button onClick={async()=>{
              try { await navigator.clipboard.writeText(activeFile?.content||''); onToast && onToast('Copied file content')}
              catch { onToast && onToast('Copy failed','error')}
            }} className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-comment hover:text-tokyo-fg" title="Copy file"><Copy size={12}/></button>
          </div>
        )}
      </div>

      <div className="flex-1 flex min-h-0">
        {/* editor */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {activeFile ? (
            <>
              <div className="h-6 bg-tokyo-bg border-b border-tokyo-border flex items-center px-3 gap-2 text-[11px] text-tokyo-comment shrink-0">
                <span className="truncate">{activeFile.name}</span>
                <span className="hidden sm:inline">• {activeFile.language}</span>
                <span className="hidden sm:inline">• {activeFile.content?.split('\n').length || 1} lines</span>
                <span className="flex-1" />
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tokyo-green"/> Autosave</span>
              </div>
              <Editor
                height="100%"
                language={activeFile.language || 'plaintext'}
                value={activeFile.content || ''}
                onChange={(v)=> onChange(v||'')}
                theme="vs-dark"
                options={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  padding: { top: 12, bottom: 12 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorSmoothCaretAnimation: 'on',
                  fontLigatures: true,
                  lineNumbersMinChars: 3,
                  renderLineHighlight: 'line',
                  bracketPairColorization: { enabled: true } as any,
                }}
                onMount={(_, monaco)=>{
                  monaco.editor.defineTheme('tokyo-night', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                      { token: 'comment', foreground: '565f89', fontStyle: 'italic' },
                      { token: 'keyword', foreground: 'bb9af7' },
                      { token: 'string', foreground: '9ece6a' },
                      { token: 'number', foreground: 'ff9e64' },
                      { token: 'type', foreground: '7aa2f7' },
                    ],
                    colors: {
                      'editor.background': '#1a1b26',
                      'editor.foreground': '#c0caf5',
                      'editorLineNumber.foreground': '#3b4261',
                      'editorLineNumber.activeForeground': '#c0caf5',
                      'editorCursor.foreground': '#c0caf5',
                      'editor.selectionBackground': '#33467c88',
                      'editor.inactiveSelectionBackground': '#33467c55',
                      'editorGutter.background': '#1a1b26',
                      'editor.lineHighlightBackground': '#292e4280',
                      'editorIndentGuide.background': '#292e42',
                      'editorIndentGuide.activeBackground': '#3b4261',
                    }
                  })
                  monaco.editor.setTheme('tokyo-night')
                }}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center overflow-auto">
              <div className="max-w-[520px] w-full">
                <img src="/logo.png" alt="" className="w-16 h-16 mx-auto rounded-2xl opacity-90 shadow-lg" />
                <h2 className="text-lg font-semibold mt-4">Welcome to Codify</h2>
                <p className="text-sm text-tokyo-comment mt-2">Monaco editor • Tokyo Night • Mobile ready. Open a file, create a project, or press <span className="px-1.5 py-0.5 bg-tokyo-bgHighlight border border-tokyo-border rounded text-xs">⌘ K</span> to command.</p>
                <div className="grid grid-cols-2 gap-2 mt-5 text-left">
                  {[
                    {k:'New File', v:'Explorer → ＋ File'},
                    {k:'Run', v:'Preview HTML instantly'},
                    {k:'AI Chat', v:'Ask Codify AI left bar'},
                    {k:'Mobile', v:'Sidebar collapses, FAB +'},
                  ].map(c=>(
                    <div key={c.k} className="bg-tokyo-bgFloat border border-tokyo-border rounded-lg p-3 hover:border-tokyo-blue/30 transition-colors">
                      <div className="text-xs font-semibold">{c.k}</div>
                      <div className="text-xs text-tokyo-comment mt-0.5">{c.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button onClick={()=> onToast && onToast('Open a file from Explorer to start','info')} className="px-3 py-1.5 bg-tokyo-blue hover:bg-[#6b92f0] text-white rounded-lg text-sm">Get Started</button>
                  <button onClick={()=> onToast && onToast('Press ⌘K for commands','info')} className="px-3 py-1.5 bg-tokyo-bgFloat border border-tokyo-border rounded-lg text-sm">Command Palette</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* preview pane desktop */}
        {showPreview && (
          <div className="w-[42%] max-w-[560px] hidden lg:flex flex-col border-l border-tokyo-border bg-white shrink-0">
            <div className="h-7 bg-tokyo-bgDark border-b border-tokyo-border flex items-center px-2 gap-2 text-xs text-tokyo-fg shrink-0">
              <span className="w-3 h-3 rounded-full bg-tokyo-red" /><span className="w-3 h-3 rounded-full bg-tokyo-yellow" /><span className="w-3 h-3 rounded-full bg-tokyo-green" />
              <span className="ml-2 text-tokyo-comment flex items-center gap-1"><Eye size={12}/> Preview — live</span>
              <span className="flex-1" />
              <button onClick={()=> onToast && onToast('Preview refreshed')} className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><RefreshCw size={12}/></button>
              <button onClick={async()=> { try{ await navigator.clipboard.writeText(previewHtml); onToast && onToast('Preview HTML copied')} catch{}}} className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"><Copy size={12}/></button>
            </div>
            <iframe title="preview" srcDoc={previewHtml} className="flex-1 w-full border-0 bg-white" sandbox="allow-scripts allow-same-origin" />
          </div>
        )}
      </div>

      {/* mobile preview drawer */}
      {showPreview && (
        <div className="lg:hidden border-t border-tokyo-border bg-white h-[36vh] shrink-0 flex flex-col">
          <div className="h-7 bg-tokyo-bgDark flex items-center px-3 text-xs text-tokyo-comment shrink-0 gap-2"><Eye size={12}/> Preview — live <span className="ml-auto text-[10px]">drag to expand on desktop</span></div>
          <iframe title="preview-mobile" srcDoc={previewHtml} className="w-full flex-1 border-0 bg-white" sandbox="allow-scripts allow-same-origin" />
        </div>
      )}
    </div>
  )
}
