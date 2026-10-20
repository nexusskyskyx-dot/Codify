import { FREE_MODELS, NO_KEY_FALLBACKS, type AgentKey } from './freeModels'

type ChatMsg = { role: 'system'|'user'|'assistant', content: string }

function getKeyForBase(base: string): string | undefined {
  if (base.includes('openrouter')) return (import.meta as any).env?.VITE_OPENROUTER_KEY
  if (base.includes('kilo')) return (import.meta as any).env?.VITE_KILO_KEY
  if (base.includes('groq')) return (import.meta as any).env?.VITE_GROQ_KEY
  return undefined
}

async function postChat(base: string, apiKey: string | undefined, model: string, msgs: ChatMsg[]) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  // OpenRouter routing header
  if (base.includes('openrouter')) { headers['HTTP-Referer'] = location.origin; headers['X-Title'] = 'Codify' }
  const r = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages: msgs, temperature: 0.2 })
  })
  if (!r.ok) throw new Error(`${base} ${r.status} ${await r.text().catch(()=>r.statusText)}`)
  const j = await r.json()
  return j.choices?.[0]?.message?.content as string
}

// Primary → Fallback → No-key chain (OVH 2 RPM, LLM7, Ollama)
export async function callFreeAgent(agent: AgentKey, prompt: string, history: ChatMsg[] = []): Promise<string> {
  const cfg = FREE_MODELS[agent]
  const sys = `You are ${cfg.label}: ${cfg.role}. Keep answers concise, code-first.`
  const msgs: ChatMsg[] = [{ role:'system', content: sys }, ...history, { role:'user', content: prompt }]
  const keys = (history||[]).length ? history : []

  // 1. Primary
  try { return await postChat(cfg.baseURL, getKeyForBase(cfg.baseURL), cfg.id, msgs) } catch (e) { console.warn(`[Codify ${agent}] primary failed`, e)}
  // 2. Fallback (different base)
  if (cfg.fallback && cfg.fallback !== cfg.baseURL) {
    try { return await postChat(cfg.fallback, getKeyForBase(cfg.fallback), cfg.id, msgs) } catch (e) { console.warn(`[Codify ${agent}] fallback failed`, e)}
  }
  // 3. OVH anonymous (no key, 2 RPM — always works, rate-limited to ~30 calls/min/IP across agents)
  try { return await postChat(NO_KEY_FALLBACKS.ovh.baseURL, undefined, NO_KEY_FALLBACKS.ovh.model, msgs) } catch (e) { console.warn(`[Codify ${agent}] OVH fail`, e)}
  // 4. LLM7 anonymous (no key)
  try { return await postChat(NO_KEY_FALLBACKS.llm7.baseURL, undefined, NO_KEY_FALLBACKS.llm7.model, msgs) } catch (e) { console.warn(`[Codify ${agent}] LLM7 fail`, e)}
  throw new Error(`All free endpoints failed for ${agent}. Add VITE_OPENROUTER_KEY or run Ollama local.`)
}

export async function runCollaborative(
  task: string,
  projectContext: string,
  onChunk: (agent: AgentKey, chunk: string)=>void
) {
  const agents: AgentKey[] = ['orchestrator','reviser','coder','debugger','fileMgr','tester','docs']
  let shared = `Task: ${task}\n\nProject:\n${projectContext.slice(0, 50000)}\n`
  for (const a of agents) {
    onChunk(a, '…thinking (up to ~30s on free tier)…')
    const res = await callFreeAgent(a, shared.slice(-60000), [])
    onChunk(a, res)
    shared = `${shared}\n\n[${a}]: ${res.slice(0, 8000)}`
    // respect 2 RPM anonymous fallback — ~1 call / 30s would be ideal but for keyed it's fine
    await new Promise(r=> setTimeout(r, 700))
  }
}
