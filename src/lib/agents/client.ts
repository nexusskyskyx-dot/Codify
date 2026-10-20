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
  // Pollinations legacy docs: no auth header needed; if you send Authorization it is ignored
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

// ── Puter.js SDK loader + caller ──
let puterLoadPromise: Promise<any> | null = null
function loadPuter(): Promise<any> {
  if ((window as any).puter?.ai?.chat) return Promise.resolve((window as any).puter)
  if (puterLoadPromise) return puterLoadPromise
  puterLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js.puter.com/v2/'
    script.async = true
    script.onload = () => {
      // Puter loads async; give it a tick
      setTimeout(() => {
        const p = (window as any).puter
        if (p?.ai?.chat) resolve(p)
        else reject(new Error('Puter SDK loaded but puter.ai.chat not found'))
      }, 300)
    }
    script.onerror = () => reject(new Error('Failed to load https://js.puter.com/v2/'))
    document.head.appendChild(script)
  })
  return puterLoadPromise
}

async function callPuter(model: string, msgs: ChatMsg[]): Promise<string> {
  const puter = await loadPuter()
  // Convert OpenAI messages to single prompt string for Puter (handles system+history)
  const system = msgs.filter(m => m.role === 'system').map(m => m.content).join('\n')
  const convo = msgs.filter(m => m.role !== 'system').map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
  const combined = system ? `${system}\n\n${convo}` : convo

  // Puter API: puter.ai.chat(prompt, { model, stream:false }) → string or object
  // We wrap in timeout to handle popup-blocking on mobile (per zen guide)
  const timeoutMs = 25000
  const res = await Promise.race([
    puter.ai.chat(combined, { model, stream: false }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Puter timeout (popup blocked? try again)')), timeoutMs))
  ])

  // Normalize response shapes
  if (typeof res === 'string') return res
  if (res?.message?.content) return res.message.content
  if (res?.content) return res.content
  if (res?.choices?.[0]?.message?.content) return res.choices[0].message.content
  return String(res)
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
      await new Promise(r => setTimeout(r, 700))
      return mockForRole(role, prompt)
    }
    const key = cfg.requiresKey ? getEnvKey(cfg) : undefined
    if (cfg.requiresKey && !key) continue
    const model = cfg.models[role] || cfg.models.coder
    try {
      if (cfg.kind === 'puter' || pid === 'puter') {
        return await callPuter(model, msgs)
      }
      // Pollinations legacy is OpenAI-compat, just use postOpenAI (no key)
      return await postOpenAI(cfg.baseURL, key, model, msgs)
    } catch (e) {
      lastErr = e
      console.warn(`[Codify ${role}@${pid}] failed`, e)
      await new Promise(r => setTimeout(r, 400))
      continue
    }
  }
  console.warn(`[Codify ${role}] all providers failed, using mock`, lastErr)
  return mockForRole(role, prompt)
}

// Health check helper for UI live-test button
export async function probeProvider(pid: ProviderId): Promise<{ ok: boolean; ms: number; msg: string }> {
  const start = Date.now()
  try {
    const txt = await callAgent('coder', 'Say exactly: OK', [] as any)
    // Note: callAgent above uses chain, so we force direct probe for this pid to avoid chain fallback
    // For quick health we still rely on callAgent fallback chain but report which pid actually answered is in PROVIDERS[pid] check
    // To force single pid we do direct call here:
    const cfg = PROVIDERS[pid]
    if (pid === 'mock') return { ok: true, ms: Date.now() - start, msg: 'mock always OK' }
    if (cfg.kind === 'puter') {
      const puter = await loadPuter()
      const r = await puter.ai.chat('Say exactly: OK', { model: cfg.models.coder })
      const s = typeof r === 'string' ? r : (r?.message?.content || String(r))
      return { ok: /ok/i.test(s), ms: Date.now() - start, msg: s.slice(0, 80) }
    }
    const sys: ChatMsg = { role: 'system', content: 'You are a health check.' }
    const msg: ChatMsg = { role: 'user', content: 'Say exactly: OK' }
    const out = await postOpenAI(cfg.baseURL, cfg.requiresKey ? getEnvKey(cfg) : undefined, cfg.models.coder, [sys, msg])
    return { ok: /ok/i.test(out), ms: Date.now() - start, msg: out.slice(0, 80) }
  } catch (e: any) {
    return { ok: false, ms: Date.now() - start, msg: e.message?.slice(0, 120) || String(e) }
  }
}

// Back-compat
export async function callFreeAgent(agent: any, prompt: string) {
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
