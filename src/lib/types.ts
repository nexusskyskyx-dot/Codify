export type FileNode = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  parentId?: string | null;
}

export type Project = {
  id: string;
  name: string;
  description?: string;
  template: string;
  createdAt: number;
  files: FileNode[];
}

export type Tab = {
  id: string;
  fileId: string;
  name: string;
  language: string;
  dirty?: boolean;
}

export type ProjectTemplate = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  rs: 'rust',
  go: 'go',
  sh: 'shell',
}
