import { Project, FileNode } from './types'
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
