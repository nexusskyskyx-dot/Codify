import { PROVIDERS, getProviderChain, getEnvKey, type ProviderId } from './providers'
import { AGENTS, type Role } from './team'

type ChatMsg = { role: 'system' | 'user' | 'assistant', content: string }

// Mock synthethizer for demo/no-key overflow — shows the team flow without any API
function mockForRole(role: Role, prompt: string): string {
  const task = prompt.slice(0, 120).replace(/\n/g, ' ')
  const mocks: Record<Role, string> = {
    architect: `\`\`\`json
{
  "plan": "Build ${task} as a single-page app with live preview.",
  "files": [
    { "path": "index.html", "purpose": "Shell with root div and Tailwind" },
    { "path": "src/App.tsx", "purpose": "Main UI — state + render" },
    { "path": "src/styles.css", "purpose": "Tokyo Night theme" }
  ],
  "steps": ["Create HTML shell", "Implement App.tsx with hooks", "Add styles", "Wire preview"],
  "stack": "React + Vite + Tailwind"
}
\`\`\``,
    coder: `\`\`\`json
{
  "files": [
    { "path": "index.html", "content": "<!doctype html><html><head><meta charset=\\"utf-8\\"/><meta name=\\"viewport\\" content=\\"width=device-width,initial-scale=1\\"/><script src=\\"https://cdn.tailwindcss.com\\"><\\/script><title>Codify App</title></head><body class=\\"bg-[#1a1b26] text-[#c0caf5]\\"><div id=\\"root\\"></div><script type=\\"module\\" src=\\"/src/main.tsx\\"><\\/script></body></html>" },
    { "path": "src/App.tsx", "content": "import { useState } from 'react'\\nexport default function App(){ const [count,setCount]=useState(0); return <div className=\\"min-h-screen bg-[#1a1b26] text-[#c0caf5] p-6\\"><h1 className=\\"text-2xl font-bold text-[#7aa2f7]\\">Codify — Demo Build</h1><p className=\\"text-[#565f89] mt-2\\">Task: ${task.replace(/\"/g,'\\"')}</p><button onClick={()=>setCount(c=>c+1)} className=\\"mt-4 px-4 py-2 bg-[#7aa2f7] text-white rounded-lg\\">Clicked {count} times</button><p className=\\"mt-4 text-sm text-[#9ece6a]\\">✓ Built by Coder (demo). Add a free key in .env for real AI.</p></div> }" },
    { "path": "src/styles.css", "content": "body{ background:#1a1b26; color:#c0caf5; font-family:Inter,system-ui; }" }
  ]
}
\`\`\``,
    reviewer: `\`\`\`json
{
  "approved": true,
  "summary": "Demo review: structure looks good, no blockers.",
  "issues": [{ "path": "src/App.tsx", "severity": "minor", "issue": "Demo build — real Reviewer would check edge cases", "suggestion": "Add empty-state and error boundary when using real AI" }]
}
\`\`\``,
    tester: `\`\`\`json
{
  "passed": true,
  "summary": "Demo tester: core checks would pass.",
  "tests": [{ "path": "src/tests/demo.test.ts", "content": "import { describe, it, expect } from 'vitest'\\ndescribe('demo',()=>{ it('renders',()=> expect(1).toBe(1)) })" }],
  "checks": [{ "desc": "Button increments", "expect": "count+1 on click", "critical": true }]
}
\`\`\``,
    fixer: `\`\`\`json
{
  "summary": "No changes needed — Reviewer & Tester approved.",
  "files": []
}
\`\`\``,
  }
  return mocks[role]
}

async function postOpenAI(base: string, apiKey: string | undefined, model: string, msgs: ChatMsg[]): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  if (base.includes('openrouter')) { headers['HTTP-Referer'] = typeof location !== 'undefined' ? location.origin : 'https://codify.app'; headers['X-Title'] = 'Codify' }
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages: msgs, temperature: 0.35, max_tokens: 6000 })
  })
  if (!r.ok) throw new Error(`${base} ${r.status} ${await r.text().catch(() => r.statusText)}`)
  const j = await r.json()
  const content = j.choices?.[0]?.message?.content
  if (!content) throw new Error(`Empty response from ${base}`)
  return content as string
}

export async function callAgent(role: Role, prompt: string, history: { role: string, content: string }[] = []): Promise<string> {
  const def = AGENTS[role]
  const chain = getProviderChain()

  const sys: ChatMsg = { role: 'system', content: def.system }
  const msgs: ChatMsg[] = [sys, ...history.map(h => ({ role: 'assistant' as const, content: `[${h.role.toUpperCase()}]: ${h.content.slice(0, 6000)}` })), { role: 'user', content: prompt }]

  let lastErr: any = null
  for (const pid of chain) {
    const cfg = PROVIDERS[pid]
    if (pid === 'mock') {
      // simulate latency so UI feels real
      await new Promise(r => setTimeout(r, 700))
      return mockForRole(role, prompt)
    }
    const key = cfg.requiresKey ? getEnvKey(cfg) : undefined
    if (cfg.requiresKey && !key) continue // skip if no key
    const model = cfg.models[role] || cfg.models.coder
    try {
      return await postOpenAI(cfg.baseURL, key, model, msgs)
    } catch (e) {
      lastErr = e
      console.warn(`[Codify ${role}@${pid}] failed`, e)
      // small backoff before trying next provider in chain
      await new Promise(r => setTimeout(r, 400))
      continue
    }
  }
  // if chain exhausted, fall back to mock so user always sees team flow (per free no-key promise, but via demo)
  console.warn(`[Codify ${role}] all providers failed, using mock`, lastErr)
  return mockForRole(role, prompt)
}

// Back-compat: old SidebarAgents imported callFreeAgent/runCollaborative
export async function callFreeAgent(agent: any, prompt: string) {
  // map old 7-agent keys to new 5-role keys
  const map: Record<string, Role> = { reviser: 'reviewer', coder: 'coder', debugger: 'fixer', fileMgr: 'coder', orchestrator: 'architect', tester: 'tester', docs: 'coder', architect: 'architect', reviewer: 'reviewer', fixer: 'fixer' }
  const role = (map[agent] || 'coder') as Role
  return callAgent(role, prompt)
}
export async function runCollaborative(task: string, projectContext: string, onChunk: (agent: any, chunk: string) => void) {
  const { runTeam } = await import('./orchestrator')
  await runTeam(task, projectContext, {}, {
    onTurnEnd: (t) => onChunk(t.role, t.raw),
    onTurnStart: (r) => onChunk(r, '…thinking…'),
  })
}
