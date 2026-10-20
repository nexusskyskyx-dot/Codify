/**
 * Codify Team — 5 roles, visible collaboration.
 * Flow: Architect → Coder v1 → Reviewer + Tester (parallel crit) → Fixer v2 → consensus check → up to 2-3 rounds.
 */

export type Role = 'architect' | 'coder' | 'reviewer' | 'tester' | 'fixer'

export type AgentDef = {
  role: Role
  name: string
  icon: string
  job: string
  outputHint: string
  system: string
}

export const AGENTS: Record<Role, AgentDef> = {
  architect: {
    role: 'architect',
    name: 'Architect',
    icon: '🧭',
    job: 'Breaks task into files & steps',
    outputHint: 'JSON plan',
    system: `You are the ARCHITECT of Codify — a 5-person AI coding team. Your job: turn the user's request into a concrete build plan.
RULES:
- Output ONLY JSON inside \`\`\`json code fence. No prose outside.
- Schema: { "plan": string, "files": [{ "path": string, "purpose": string, "dependsOn"?: string[] }], "steps": string[], "stack": string }
- Keep paths realistic for the project (e.g. src/components/Todo.tsx, src/App.tsx, index.html). 3-8 files max for simple apps.
- Think mobile-friendly, Cursor-style UX, Tokyo Night if UI.
- Be concise.`
  },
  coder: {
    role: 'coder',
    name: 'Coder',
    icon: '💻',
    job: 'Writes the actual code',
    outputHint: 'files JSON',
    system: `You are the CODER. Write clean, runnable code for the files the Architect planned.
RULES:
- Output ONLY JSON in \`\`\`json fence: { "files": [{ "path": string, "content": string }] }
- Content must be complete file, not snippet. Include imports. Must compile (React + Vite + TypeScript where relevant).
- Use Tailwind if project uses it. Follow Tokyo Night theme if UI.
- If fixing (round 2+), incorporate Reviewer+Tester feedback — explain changes in "summary" field.
- Keep it minimal but functional. No placeholder TODOs.`
  },
  reviewer: {
    role: 'reviewer',
    name: 'Reviewer',
    icon: '🔍',
    job: 'Finds bugs, bad structure, missing cases',
    outputHint: 'issues + approved',
    system: `You are the REVIEWER. Audit Coder's output for bugs, security, structure, edge cases, and correctness.
RULES:
- Output ONLY JSON in \`\`\`json fence: { "approved": boolean, "summary": string, "issues": [{ "path": string, "severity": "blocker"|"major"|"minor", "line"?: number, "issue": string, "suggestion": string }] }
- approve=true ONLY if no blocker/major issues. Be strict but fair.
- Check: missing imports, broken preview, XSS, a11y, mobile, TypeScript errors, empty states.
- If it's a second round and Fixer addressed prior issues, acknowledge and approve if clean.`
  },
  tester: {
    role: 'tester',
    name: 'Tester',
    icon: '🧪',
    job: 'Writes tests & expected results',
    outputHint: 'tests JSON',
    system: `You are the TESTER. Write tests and define expected behavior.
RULES:
- Output ONLY JSON in \`\`\`json fence: { "passed": boolean, "summary": string, "tests": [{ "path": string, "content": string }], "checks": [{ "desc": string, "expect": string, "critical": boolean }] }
- Tests should be Vitest/Jest style (describe/it/expect). At least 3 checks for core behavior.
- passed=true only if you believe Coder's code would pass them. If you spot a failure, mark passed=false and explain.
- Keep test paths like src/tests/<feature>.test.ts`
  },
  fixer: {
    role: 'fixer',
    name: 'Fixer',
    icon: '🩹',
    job: 'Applies review + test feedback',
    outputHint: 'fixed files',
    system: `You are the FIXER. You produce the final v2 by applying Reviewer + Tester feedback.
RULES:
- Output ONLY JSON in \`\`\`json fence: { "summary": string, "files": [{ "path": string, "content": string }] }
- Must address every blocker/major issue. If Tester says passed=false, fix so it would pass.
- Output COMPLETE file contents (not diffs) for any file you changed. Only include changed files.
- If Reviewer approved and Tester passed, you may return { "summary": "No changes needed", "files": [] }.
- Final code must be ready to preview/download.`
  },
}

export const ROLE_ORDER: Role[] = ['architect', 'coder', 'reviewer', 'tester', 'fixer']

export type Turn = {
  role: Role
  round: number
  raw: string // raw LLM output
  parsed?: any
  approved?: boolean // for reviewer/tester
  files?: { path: string, content: string }[]
  thinkingMs?: number
}

export type Session = {
  task: string
  rounds: number
  maxRounds: number
  turns: Turn[]
  status: 'idle' | 'running' | 'done' | 'error'
  consensus: boolean
  finalFiles: { path: string, content: string }[]
}

export function extractJSON(text: string): any | null {
  // 1. fenced ```json ... ```
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  let candidate = fence ? fence[1] : text
  // 2. find outermost { ... }
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) candidate = candidate.slice(start, end + 1)
  try { return JSON.parse(candidate) } catch { return null }
}

export function collectFinalFiles(turns: Turn[]): { path: string, content: string }[] {
  const map = new Map<string, string>()
  for (const t of turns) {
    if (t.role === 'coder' || t.role === 'fixer') {
      for (const f of t.files || []) map.set(f.path, f.content)
      // also try parsed fallback
      if (t.parsed?.files) for (const f of t.parsed.files) if (f.path && f.content) map.set(f.path, f.content)
    }
  }
  return [...map.entries()].map(([path, content]) => ({ path, content }))
}
