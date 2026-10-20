/**
 * Codify Providers — plug-in model layer.
 * Foundation is multi-agent team, free/no-key is just one plug-in (but kept as default).
 * All providers are OpenAI-compatible /chat/completions so they are interchangeable.
 */

export type ProviderId = 'openrouter' | 'groq' | 'kilo' | 'gemini' | 'ovh' | 'llm7' | 'ollama' | 'mock'

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
}

export const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  // Default free no-key plug-ins (stable, per mnfst/awesome-free-llm-apis)
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
    note: 'Anonymous, no signup. 262K context. Best free no-key default.'
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
    note: 'Anonymous fallback, fast.'
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
    note: '50 RPD free → 1000 RPD after $10 once (still free usage). Each :free ID = separate bucket.'
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
    note: 'Run ollama pull qwen2.5-coder:7b'
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
    note: 'No network — shows team flow with realistic fake output.'
  },
}

export const DEFAULT_PROVIDER: ProviderId = 'ovh' // free no-key default per user request
export const FALLBACK_CHAIN: ProviderId[] = ['ovh', 'llm7', 'openrouter', 'groq', 'kilo', 'ollama', 'mock']

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
