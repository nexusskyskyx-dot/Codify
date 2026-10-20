/**
 * Codify Free Agents — verified Oct 2026 from mnfst/awesome-free-llm-apis
 * Each agent = separate free model ID = separate 20 RPM / 50 RPD bucket (→ 1000 RPD after $10 once)
 * No user key required by default: OVH + LLM7 anonymous + Ollama local are keyless.
 */

// Primary free pool (OpenAI-compatible)
export const FREE_MODELS = {
  // 1M context orchestration king — OpenRouter :free + Kilo Code 200 req/hr
  reviser: {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "Reviser • Nemotron 3 Ultra",
    role: "Auditor — finds bugs, security, perf, reviews files/folders",
    context: "1M",
    baseURL: "https://openrouter.ai/api/v1",
    fallback: "https://api.kilo.ai/api/gateway",
  },
  // 88% coding tasks — best coding free — OpenRouter :free
  coder: {
    id: "qwen/qwen3.8-27b:free",
    label: "Coder • Qwen 3.8 27B",
    role: "Builder — generates features, FIM, multi-file",
    context: "262K",
    baseURL: "https://openrouter.ai/api/v1",
    fallback: "https://api.kilo.ai/api/gateway",
  },
  // 0.88s fastest — perfect for tight patch loops
  debugger: {
    id: "cohere/north-mini-code:free",
    label: "Debugger • North Mini Code",
    role: "Patcher — fixes errors, writes diffs",
    context: "256K",
    baseURL: "https://openrouter.ai/api/v1",
    fallback: "https://api.kilo.ai/api/gateway",
  },
  // Stable tool-use, JSON
  fileMgr: {
    id: "google/gemma-4-31b-it:free",
    label: "FileMgr • Gemma 4 31B",
    role: "Filesystem — create/delete/rename files & folders",
    context: "262K",
    baseURL: "https://openrouter.ai/api/v1",
    fallback: "https://api.kilo.ai/api/gateway",
  },
  orchestrator: {
    id: "thinkingmachines/inkling:free",
    label: "Orchestrator • Inkling",
    role: "Planner — delegates, merges, long-horizon",
    context: "1M",
    baseURL: "https://openrouter.ai/api/v1",
    fallback: "https://api.kilo.ai/api/gateway",
  },
  tester: {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    label: "Tester • Nemotron Nano Omni",
    role: "QA — writes Vitest/Jest, runs via terminal",
    context: "256K",
    baseURL: "https://api.kilo.ai/api/gateway",
    fallback: "https://openrouter.ai/api/v1",
  },
  docs: {
    id: "qwen/qwen3.8-27b:free",
    label: "Docs • Qwen 3.8 27B",
    role: "Documenter — Markdown, JSDoc, README",
    context: "262K",
    baseURL: "https://openrouter.ai/api/v1",
    fallback: "https://openrouter.ai/api/v1",
  },
} as const

// NO-KEY fallbacks (mnfst/awesome-free-llm-apis — no signup, no key)
export const NO_KEY_FALLBACKS = {
  ovh: {
    label: "OVH Anonymous — no key, no signup",
    baseURL: "https://oai.endpoints.kepler.ai.cloud.ovh.net/v1",
    model: "Qwen3.5-397B-A17B", // 262K, text+vision, 2 RPM/IP
    rpm: 2,
  },
  llm7: {
    label: "LLM7 Anonymous — no key",
    baseURL: "https://api.llm7.io/v1",
    model: "gpt-oss:20b", // turbo, 60 RPM with free token
    rpm: 60,
  },
  ollama: {
    label: "Ollama Local — unlimited offline",
    baseURL: "http://localhost:11434/v1",
    model: "qwen2.5-coder:7b",
  },
}

export type AgentKey = keyof typeof FREE_MODELS

export const AGENT_LIST: { key: AgentKey; prompt: string }[] = [
  { key: "reviser", prompt: "You are Codify Reviser. Scan the full project file tree, find bugs, security issues, perf problems, and suggest folder structure improvements. Output concise bullet list with file:line." },
  { key: "coder", prompt: "You are Codify Coder. Given the Reviser's findings and the file context, write clean TypeScript/React code. Use FIM where needed, keep imports correct, never break builds." },
  { key: "debugger", prompt: "You are Codify Debugger. You get terminal errors + preview errors. Output ONLY a unified diff (*** Begin Patch) that fixes it. No chatter." },
  { key: "fileMgr", prompt: "You are Codify FileMgr. You manage the filesystem. Create, delete, rename files/folders as requested. Output JSON: {action:'create'|'delete'|'rename', target, content?}. Never orphan imports." },
  { key: "tester", prompt: "You are Codify Tester. Write Vitest tests for the changed files. Output test files only." },
  { key: "docs", prompt: "You are Codify Docs. Write Markdown docs, JSDoc, and update README for changes. Be concise." },
  { key: "orchestrator", prompt: "You are Codify Orchestrator. You plan multi-file tasks, delegate to Reviser→Coder→Debugger→FileMgr→Tester→Docs, then merge outputs. Keep 1M context in mind." },
]
