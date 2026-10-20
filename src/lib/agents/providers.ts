/**
 * Codify Providers — plug-in model layer.
 * Foundation is multi-agent team, free/no-key is just one plug-in (kept as default).
 * All providers are OpenAI-compatible /chat/completions so they are interchangeable.
 * Wired 2026-10-20: Puter.js + Pollinations Legacy + OVH as top 3 live free no-key plug-ins.
 */

export type ProviderId = 'pollinations' | 'puter' | 'ovh' | 'llm7' | 'openrouter' | 'groq' | 'kilo' | 'gemini' | 'ollama' | 'mock'

export type ProviderConfig = {
  id: ProviderId
  label: string
  baseURL: string
  requiresKey: boolean
  envKey?: string // Vite env var name
  docsUrl: string
  // model per role — each role can use best free model for that provider
  models: Record<string, string>
  rpm?: number
  note?: string
  kind?: 'openai' | 'puter'
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  // ── TOP 3 live free no-key (wired per user request) ──
  pollinations: {
    id: 'pollinations',
    label: 'Pollinations Legacy • no key • 1 req/IP',
    baseURL: 'https://text.pollinations.ai/openai',
    requiresKey: false,
    docsUrl: 'https://pollinations.ai',
    models: {
      architect: 'openai',
      coder: 'openai',
      reviewer: 'openai',
      tester: 'openai',
      fixer: 'openai',
    },
    rpm: 4, // ~1 per 15s = 4 RPM — pollinations classic anonymous tier
    note: 'Legacy open text API, no signup. 1 req/IP at a time. Pollen credits for higher limits. New gen.pollinations.ai requires sk_/pk_.',
    kind: 'openai',
  },
  puter: {
    id: 'puter',
    label: 'Puter.js • no dev key • User-Pays',
    baseURL: 'https://js.puter.com/v2/',
    requiresKey: false,
    docsUrl: 'https://docs.puter.com/',
    models: {
      architect: 'openai/gpt-oss-20b',
      coder: 'openai/gpt-oss-20b',
      reviewer: 'openai/gpt-oss-20b',
      tester: 'openai/gpt-oss-20b',
      fixer: 'openai/gpt-oss-20b',
    },
    rpm: 100, // per-user, effectively unlimited for dev
    note: 'Load https://js.puter.com/v2/ → puter.ai.chat(). No dev key; users cover via free Puter account (User-Pays).',
    kind: 'puter',
  },
  ovh: {
    id: 'ovh',
    label: 'OVH — no key • 2 RPM',
    baseURL: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
    requiresKey: false,
    docsUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net',
    models: {
      architect: 'Qwen3.5-397B-A17B',
      coder: 'Qwen3.5-397B-A17B',
      reviewer: 'Qwen3.5-397B-A17B',
      tester: 'Qwen3.5-397B-A17B',
      fixer: 'Qwen3.5-397B-A17B',
    },
    rpm: 2,
    note: 'Anonymous, no signup. 262K context. Best free no-key default.',
    kind: 'openai',
  },
  llm7: {
    id: 'llm7',
    label: 'LLM7 — no key • turbo',
    baseURL: 'https://api.llm7.io/v1',
    requiresKey: false,
    docsUrl: 'https://llm7.io',
    models: {
      architect: 'gpt-oss:20b',
      coder: 'gpt-oss:20b',
      reviewer: 'gpt-oss:20b',
      tester: 'gpt-oss:20b',
      fixer: 'gpt-oss:20b',
    },
    rpm: 60,
    note: 'Anonymous fallback, fast.',
    kind: 'openai',
  },
  // Free with key (still $0, no card for basic tier) — plug-in upgrade, same API, more RPM
  openrouter: {
    id: 'openrouter',
    label: 'OpenRouter — 17 free models • 20 RPM',
    baseURL: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    envKey: 'VITE_OPENROUTER_KEY',
    docsUrl: 'https://openrouter.ai/keys',
    models: {
      architect: 'thinkingmachines/inkling:free', // 1M
      coder: 'qwen/qwen3.8-27b:free', // 262K, 88% coding
      reviewer: 'nvidia/nemotron-3-ultra-550b-a55b:free', // 1M auditor
      tester: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', // reasoning
      fixer: 'cohere/north-mini-code:free', // 0.88s patcher
    },
    rpm: 20,
    note: '50 RPD free → 1000 RPD after $10 once (still free usage). Each :free ID = separate bucket.',
    kind: 'openai',
  },
  groq: {
    id: 'groq',
    label: 'Groq — 30 RPM LPU',
    baseURL: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    envKey: 'VITE_GROQ_KEY',
    docsUrl: 'https://console.groq.com/keys',
    models: {
      architect: 'llama-3.3-70b-versatile',
      coder: 'qwen-2.5-coder-32b',
      reviewer: 'llama-3.3-70b-versatile',
      tester: 'llama-3.3-70b-versatile',
      fixer: 'qwen-2.5-coder-32b',
    },
    rpm: 30,
    kind: 'openai',
  },
  kilo: {
    id: 'kilo',
    label: 'Kilo Code — 200 req/hr',
    baseURL: 'https://api.kilo.ai/api/gateway',
    requiresKey: true,
    envKey: 'VITE_KILO_KEY',
    docsUrl: 'https://app.kilo.ai/profile',
    models: {
      architect: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      coder: 'qwen/qwen3.8-27b:free',
      reviewer: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      tester: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      fixer: 'cohere/north-mini-code:free',
    },
    rpm: 200,
    kind: 'openai',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini — free 1M ctx',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    requiresKey: true,
    envKey: 'VITE_GEMINI_KEY',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    models: {
      architect: 'gemini-2.0-flash',
      coder: 'gemini-2.0-flash',
      reviewer: 'gemini-2.0-flash',
      tester: 'gemini-2.0-flash',
      fixer: 'gemini-2.0-flash',
    },
    rpm: 15,
    kind: 'openai',
  },
  ollama: {
    id: 'ollama',
    label: 'Ollama local — unlimited',
    baseURL: 'http://localhost:11434/v1',
    requiresKey: false,
    docsUrl: 'https://ollama.com',
    models: {
      architect: 'qwen2.5-coder:7b',
      coder: 'qwen2.5-coder:7b',
      reviewer: 'qwen2.5-coder:7b',
      tester: 'qwen2.5-coder:7b',
      fixer: 'qwen2.5-coder:7b',
    },
    note: 'Run ollama pull qwen2.5-coder:7b',
    kind: 'openai',
  },
  mock: {
    id: 'mock',
    label: 'Demo — no API, local simulation',
    baseURL: '',
    requiresKey: false,
    docsUrl: '',
    models: {
      architect: 'mock',
      coder: 'mock',
      reviewer: 'mock',
      tester: 'mock',
      fixer: 'mock',
    },
    note: 'No network — shows team flow with realistic fake output.',
    kind: 'openai',
  },
}

export const DEFAULT_PROVIDER: ProviderId = 'ovh' // keep OVH as stable default; pollinations/puter are top plug-ins in chain
export const FALLBACK_CHAIN: ProviderId[] = ['ovh', 'pollinations', 'puter', 'llm7', 'openrouter', 'groq', 'kilo', 'ollama', 'mock']

export function getActiveProviderId(): ProviderId {
  try {
    const saved = localStorage.getItem('codify_provider') as ProviderId | null
    if (saved && PROVIDERS[saved]) return saved
  } catch {}
  return DEFAULT_PROVIDER
}
export function setActiveProviderId(id: ProviderId) {
  localStorage.setItem('codify_provider', id)
}

export function getEnvKey(cfg: ProviderConfig): string | undefined {
  if (!cfg.envKey) return undefined
  return (import.meta as any).env?.[cfg.envKey] as string | undefined
}

export function isProviderReady(id: ProviderId): boolean {
  const cfg = PROVIDERS[id]
  if (!cfg.requiresKey) return true
  const key = getEnvKey(cfg)
  return !!key
}

// Chain to try: active first, then free no-key fallbacks, then mock
export function getProviderChain(): ProviderId[] {
  const active = getActiveProviderId()
  const chain = [active]
  for (const id of FALLBACK_CHAIN) if (!chain.includes(id)) chain.push(id)
  return chain
}
