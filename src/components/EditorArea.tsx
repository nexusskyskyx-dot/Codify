import Editor from '@monaco-editor/react'
import { FileNode, Tab } from '../lib/types'
import { X, Circle } from 'lucide-react'

export default function EditorArea({ activeFile, tabs, activeTabId, onTabSelect, onTabClose, onChange, showPreview, previewHtml }: {
  activeFile: FileNode | null
  tabs: Tab[]
  activeTabId: string | null
  onTabSelect: (id: string)=>void
  onTabClose: (id: string)=>void
  onChange: (val: string)=>void
  showPreview: boolean
  previewHtml: string
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-tokyo-bg min-h-0">
      {/* tabs */}
      <div className="h-9 bg-tokyo-bgDark border-b border-tokyo-border flex items-center overflow-x-auto shrink-0">
        {tabs.length===0 && <span className="text-xs text-tokyo-comment px-3">No open files</span>}
        {tabs.map(t=>(
          <button
            key={t.id}
            onClick={()=>onTabSelect(t.id)}
            className={`h-full flex items-center gap-2 px-3 border-r border-tokyo-border text-xs whitespace-nowrap
              ${activeTabId===t.id ? 'bg-tokyo-bg text-tokyo-fg border-t-2 border-t-tokyo-blue' : 'bg-tokyo-bgDark text-tokyo-comment hover:text-tokyo-fg'}`}
          >
            <span className={`w-2 h-2 rounded-full ${t.language==='typescript' ? 'bg-[#3178c6]' : t.language==='python' ? 'bg-tokyo-green' : 'bg-tokyo-yellow'}`} />
            <span>{t.name}</span>
            {t.dirty && <Circle size={8} className="fill-tokyo-blue text-tokyo-blue" />}
            <span onClick={(e)=>{e.stopPropagation(); onTabClose(t.id)}} className="p-0.5 hover:bg-tokyo-bgHighlight rounded"><X size={12}/></span>
          </button>
        ))}
        <div className="flex-1 bg-tokyo-bgDark" />
      </div>

      <div className="flex-1 flex min-h-0">
        {/* editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeFile ? (
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
              }}
              onMount={(_, monaco)=>{
                monaco.editor.defineTheme('tokyo-night', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [
                    { token: 'comment', foreground: '565f89' },
                    { token: 'keyword', foreground: 'bb9af7' },
                    { token: 'string', foreground: '9ece6a' },
                    { token: 'number', foreground: 'ff9e64' },
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
                  }
                })
                monaco.editor.setTheme('tokyo-night')
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="max-w-md">
                <img src="/logo.png" alt="" className="w-16 h-16 mx-auto rounded-2xl opacity-90" />
                <h2 className="text-lg font-semibold mt-4">Welcome to Codify</h2>
                <p className="text-sm text-tokyo-comment mt-2">Open a file from the sidebar, create a new project, or press <span className="px-1.5 py-0.5 bg-tokyo-bgHighlight border border-tokyo-border rounded text-xs">⌘ K</span> to command.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 text-left">
                  {[
                    {k:'New File', v:'Create a file in the explorer'},
                    {k:'Run', v:'Preview HTML or run Python'},
                    {k:'AI Chat', v:'Ask Codify AI in the left bar'},
                    {k:'Mobile', v:'This UI is fully responsive'},
                  ].map(c=>(
                    <div key={c.k} className="bg-tokyo-bgFloat border border-tokyo-border rounded-lg p-3">
                      <div className="text-xs font-semibold">{c.k}</div>
                      <div className="text-xs text-tokyo-comment">{c.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* preview pane */}
        {showPreview && (
          <div className="w-[42%] max-w-[560px] hidden lg:flex flex-col border-l border-tokyo-border bg-white shrink-0">
            <div className="h-8 bg-tokyo-bgDark border-b border-tokyo-border flex items-center px-2 gap-2 text-xs text-tokyo-fg shrink-0">
              <span className="w-3 h-3 rounded-full bg-tokyo-red" /><span className="w-3 h-3 rounded-full bg-tokyo-yellow" /><span className="w-3 h-3 rounded-full bg-tokyo-green" />
              <span className="ml-2 text-tokyo-comment">Preview — live</span>
            </div>
            <iframe title="preview" srcDoc={previewHtml} className="flex-1 w-full border-0 bg-white" sandbox="allow-scripts" />
          </div>
        )}
      </div>

      {/* mobile preview drawer */}
      {showPreview && (
        <div className="lg:hidden border-t border-tokyo-border bg-white h-[36vh] shrink-0">
          <div className="h-7 bg-tokyo-bgDark flex items-center px-3 text-xs text-tokyo-comment">Preview — live</div>
          <iframe title="preview-mobile" srcDoc={previewHtml} className="w-full h-[calc(36vh-28px)] border-0 bg-white" sandbox="allow-scripts" />
        </div>
      )}
    </div>
  )
}
