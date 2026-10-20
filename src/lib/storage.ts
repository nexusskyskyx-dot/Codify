import { Project, FileNode, LANGUAGE_MAP } from './types'
import { TEMPLATES } from './templates'

function cloneFiles(files: FileNode[]): FileNode[] {
  return JSON.parse(JSON.stringify(files))
}

export function makeProject(name: string, templateId: string): Project {
  const tpl = TEMPLATES[templateId] ?? TEMPLATES.vanilla
  return {
    id: Math.random().toString(36).slice(2, 9),
    name: name || 'Untitled',
    template: templateId,
    createdAt: Date.now(),
    files: cloneFiles(tpl.files),
  }
}

const KEY = 'codify_projects_v2'
const ACTIVE_KEY = 'codify_active_v2'

export function loadProjects(): Project[] {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
export function saveProjects(p: Project[]) {
  localStorage.setItem(KEY, JSON.stringify(p))
}
export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}
export function saveActiveId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id)
}

export function findFile(files: FileNode[], id: string): FileNode | null {
  for (const f of files) {
    if (f.id === id) return f
    if (f.children) { const r = findFile(f.children, id); if (r) return r }
  }
  return null
}

export function findParentId(files: FileNode[], targetId: string, parentId: string | null = null): string | null {
  for (const f of files) {
    if (f.id === targetId) return parentId
    if (f.children) {
      const r = findParentId(f.children, targetId, f.id)
      if (r !== null || f.children.some(c => c.id === targetId)) {
        if (f.children.some(c => c.id === targetId)) return f.id
        if (r !== null) return r
      }
    }
  }
  return null
}

export function resolveFolderForCreate(files: FileNode[], requestedId: string | null): string | null {
  if (requestedId === null) return null
  const node = findFile(files, requestedId)
  if (!node) return null
  if (node.type === 'folder') return node.id
  return findParentId(files, requestedId)
}

export function updateFileContent(files: FileNode[], id: string, content: string): FileNode[] {
  return files.map(f => {
    if (f.id === id) return { ...f, content }
    if (f.children) return { ...f, children: updateFileContent(f.children, id, content) }
    return f
  })
}

export function addNode(files: FileNode[], parentId: string | null, node: FileNode): FileNode[] {
  if (parentId === null) return [...files, node]
  return files.map(f => {
    if (f.id === parentId && f.type === 'folder') return { ...f, children: [...(f.children || []), node] }
    if (f.children) return { ...f, children: addNode(f.children, parentId, node) }
    return f
  })
}

export function deleteNode(files: FileNode[], id: string): FileNode[] {
  return files.filter(f => f.id !== id).map(f => f.children ? { ...f, children: deleteNode(f.children, id) } : f)
}

export function renameNode(files: FileNode[], id: string, name: string): FileNode[] {
  return files.map(f => {
    if (f.id === id) return { ...f, name }
    if (f.children) return { ...f, children: renameNode(f.children, id, name) }
    return f
  })
}

export function collectAllFiles(files: FileNode[], out: FileNode[] = []) {
  for (const f of files) {
    if (f.type === 'file') out.push(f)
    if (f.children) collectAllFiles(f.children, out)
  }
  return out
}

export function flattenIds(files: FileNode[]): string[] {
  const out: string[] = []
  function walk(nodes: FileNode[]) {
    for (const n of nodes) {
      out.push(n.id)
      if (n.children) walk(n.children)
    }
  }
  walk(files)
  return out
}

// --- Team file ops helpers (auto-apply) ---
export type FileOp = { path: string; content: string }

export function extToLang(ext: string): string {
  return (LANGUAGE_MAP as any)[ext.toLowerCase()] || 'plaintext'
}

function findByPath(files: FileNode[], pathParts: string[]): FileNode | null {
  let cur: FileNode[] = files
  let node: FileNode | null = null
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i]
    node = cur.find(n => n.name === part) || null
    if (!node) return null
    if (i < pathParts.length - 1) {
      if (node.type !== 'folder' || !node.children) return null
      cur = node.children
    }
  }
  return node
}

function ensureFolderPath(files: FileNode[], folderParts: string[]): FileNode[] {
  if (folderParts.length === 0) return files
  let out = [...files]
  let curLevel = out
  let parentStack: FileNode[][] = []
  for (const part of folderParts) {
    let existing = curLevel.find(n => n.name === part && n.type === 'folder')
    if (!existing) {
      const created: FileNode = { id: Math.random().toString(36).slice(2, 8), name: part, type: 'folder', children: [] }
      curLevel.push(created)
      existing = created
    }
    parentStack.push(curLevel)
    curLevel = existing.children!
  }
  return out
}

export function applyOpsToFiles(files: FileNode[], ops: FileOp[]): FileNode[] {
  let out = JSON.parse(JSON.stringify(files)) as FileNode[]
  for (const op of ops) {
    const clean = op.path.replace(/^\//, '').trim()
    if (!clean) continue
    const parts = clean.split('/').filter(Boolean)
    const fileName = parts.pop()!
    const folderParts = parts
    out = ensureFolderPath(out, folderParts)
    const existing = findByPath(out, [...folderParts, fileName])
    const ext = fileName.split('.').pop() || ''
    if (existing && existing.type === 'file') {
      out = updateFileContent(out, existing.id, op.content)
    } else {
      // create under folder
      let cur: FileNode[] = out
      for (const p of folderParts) {
        const f = cur.find(n => n.name === p && n.type === 'folder')!
        cur = f.children!
      }
      const node: FileNode = { id: Math.random().toString(36).slice(2, 8), name: fileName, type: 'file', language: extToLang(ext), content: op.content }
      cur.push(node)
    }
  }
  return out
}

export function projectContextForPrompt(project: Project): string {
  const all = collectAllFiles(project.files)
  const summary = all.map(f => `--- ${f.name} (${f.language}) ---\n${(f.content || '').slice(0, 4000)}`).join('\n\n')
  return `Project: ${project.name} (${project.template})\nFiles: ${all.length}\n\n${summary}`
}
