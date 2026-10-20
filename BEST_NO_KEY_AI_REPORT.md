# Best No-Key, Totally Free AI for Codify — Research Report
*Generated 2026-10-20 — Quetzaltenango, GT — Branch `arena/3d5730b5-codify`*

> **Your rule is sharp and correct:** “totally free, no API keys, not local” almost *no* serious provider gives that as a *stable public API* you can wrap as your product. Most “no-key” services are demos, rate-limited, or against terms if you proxy them. So: keep Codify’s foundation as the 5-agent team, treat free no-key as a *later plug-in*.

This report ranks only **remote, keyless** candidates (no signup, no `Authorization: Bearer sk-…`, not Ollama local) that can actually write code, and flags which are safe to ship.

Sources: `mnfst/awesome-free-llm-apis` live check 2026-10-05 [1], Pollinations APIDOCS 0.3.0 via `gen.pollinations.ai` [2], Pollinations classic vs key docs [3][4], community probe list 2026-10-19 [5], Puter.js tutorials [6][7][8], and web-search review of free tiers.

---

## TL;DR — What actually works today

| Tier | Provider | Keyless? | Stable public API? | Codify priority | Next step |
|---|---|---:|---|:---:|---|
| **1A** | **OVHcloud AI Endpoints** — `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1` [1] | ✅ 2 RPM/IP/model, anonymous | **Yes** — documented free tier | ⭐⭐⭐⭐⭐ | Keep as default free plug-in |
| **1B** | **Puter.js** — `<script src="https://js.puter.com/v2/">` + `puter.ai.chat()` [6][7][8] | ✅ no developer key (User-Pays) | **Yes** — designed to be wrapped | ⭐⭐⭐⭐⭐ | Best “ship today” keyless wrapper — users cover cost via free Puter account |
| **1C** | **Pollinations *Legacy* Classic** — `https://text.pollinations.ai/openai` [3][4][5] | ✅ 1 req/IP at a time, anonymous | Partial — docs now push keys [2] | ⭐⭐⭐⭐ | Keep as fallback, not primary |
| **2** | **LLM7 / UncloseAI (unturf)** — community gateways | Sometimes | **No** — demo/pool | ⭐⭐⭐ | Useful fallback, no SLA |
| **3** | Hugging Face Spaces demos / Public Gradio `/api/predict` | Sometimes | **No** — per-Space, ephemeral | ⭐⭐ | Demo-only |
| **—** | **GPT4Free (`g4f`) / scraper gateways** | “Some” via proxies | **No** — ToS violation | ⭐⭐ | Avoid in product |

**If you must pick ONE “no-key” to ship Codify with today:** **Puter.js** (developer-pays-$0) + **OVH** (truly anonymous). Pollinations Legacy as third.

---

## 1) Methodology

We checked `awesome-free-llm-apis/README.md` (336 lines, nightly 2026-10-05) [1] — every entry was re-probed; 2 NVIDIA models removed for 410 Gone. The list marks **permanent free tiers** with `Base URL`, `Context`, `Max Output`, `Rate Limit`. Only entries that explicitly say “no API key, no signup” were kept.

We then cross-checked your candidate list (Pollinations, GPT4Free, HF Spaces, Gradio, Community gateways, Puter.js) against their own docs (Pollinations APIDOCS 267 KB [2], Puter tutorials [6][7][8]) and liveness reports [5][9].

---

## 2) Detailed candidate cards

### 🥇 OVHcloud AI Endpoints — `ovh` — ⭐⭐⭐⭐⭐
- **Endpoint:** `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1` [1]
- **Keyless:** **2 RPM per IP per model, no key, no signup.** [1]
- **Remote:** ✅ EU-hosted.
- **Coding:** ✅ 20+ open-weight models, OpenAI SDK-compatible (so `POST /chat/completions` works from Codify).
- **Models you can use:** `Qwen3.5-397B-A17B` (262K), `gpt-oss-120b`, `DeepSeek-R1` family — all listed in README table under “Inference providers”.
- **Rate limit:** 2 RPM anonymous → ~2880 req/day/IP if you rotate models; with key → 400 RPM (still free).
- **Stability:** High — OVH documents it as intended free tier.
- **Terms:** Safe to wrap — it *is* the free tier.
- **Codify role:** Default plug-in when `VITE_*_KEY` is empty (current `DEFAULT_PROVIDER='ovh'`).

### 🥇 Puter.js — `puter` — ⭐⭐⭐⭐⭐ (your “⭐⭐⭐” under-rated)
- **How:** `https://js.puter.com/v2/` → `puter.ai.chat("write a todo app", {model:"openai/gpt-oss-120b"})` [6][7][8]
- **Keyless:** ✅ **No developer key.** Puter’s “User-Pays” model: new users get free credits, they sign in once via Puter auth; you never pay, never store a key [6][8].
- **Remote:** ✅ Cloud.
- **Coding:** ✅ 400+ models (GPT, Claude, Gemini, Llama, DeepSeek, Qwen-coder) [8].
- **Models:** `openai/gpt-oss-20b`, `anthropic/claude-sonnet-4.5`, `google/gemini-3.8-flash`.
- **Rate:** Per-user, not per-IP — scales to 1M users at $0 to you.
- **Stability:** High — built for “AI coders + vibe platforms like Replit, Bolt, Lovable” [6].
- **Caveat:** First call triggers a Puter sign-in popup on mobile — need timeout+fallback (see zenn.dev pattern [9]).
- **Codify role:** Best “ship as product” keyless layer — add as primary plug-in with OVH as pure anonymous fallback.

### ⭐⭐⭐⭐ Pollinations AI — `pollinations` — ⭐⭐⭐⭐ (but *endpoint-dependent*)
- **Legacy Classic (what you want):** `https://text.pollinations.ai/openai` (POST OpenAI-compat) + `https://image.pollinations.ai/prompt/{text}` [3][4][5]
  - No signup, no key, 1 request/IP at a time, best-effort, small logo on images [4].
  - Verified 2026-10-19 by `mvalentsev/awesome-free-ai-coding`: “Pollinations.AI — Legacy open text API, no signup, OpenAI-compatible (POST text.pollinations.ai/openai), on one model · gpt-oss-20b” [5].
- **New Unified (`gen.pollinations.ai`):** **requires key** — `sk_` secret or `pk_` app key + OAuth [2]. Docs: “1. Get an API key at enter.pollinations.ai” [2]; missing key → 401 [9].
- **Recent change:** Pollinations now funds free use via “Pollen credits / Quests” — anonymous gets base tier; higher → GitHub sign-in + key [10].
- **Coding:** ✅ `qwen-coder`, `openai`, `mistral`.
- **Stability:** Medium — classic still up but not promised; new path is the intended product.
- **Terms:** Wrapping classic is tolerated but without SLA; don’t hard-depend.

### ⭐⭐⭐ Community gateways — `llm7`, `uncloseai/unturf` — ⭐⭐⭐
- **Examples:** `https://api.llm7.io/v1` (gpt-oss:20b, turbo, 60 RPM with free token), `https://unturf…` keyless OpenAI compat [5].
- **Keyless:** Sometimes — often anonymous turbo works, sometimes needs “free token”.
- **Coding:** ✅ general.
- **Stability:** Low — community-run pools; can vanish or throttle.
- **Codify role:** Good as 3rd fallback in chain, not as advertised “free AI”.

### ⭐⭐ Hugging Face Spaces / Public Gradio — ⭐⭐⭐⭐ → actually ⭐⭐ for product
- **How:** Each Space exposes its own API (`/api/predict`, `run`); some are public without key.
- **Keyless:** Sometimes — owner may allow anonymous; HF inference free tier now wants token.
- **Coding:** ✅ but you must pick *one* Space (e.g., `Qwen2.5-Coder Space`) and hope it stays up.
- **Stability:** Very low — Space can sleep, change API, or add auth.
- **Terms:** Often demo-only — wrapping violates Space owner intent.
- **Codify role:** Keep for “Bring your own HF Space” advanced setting, not default.

### ⭐⭐ GPT4Free (`g4f`) — ⭐⭐⭐⭐⭐ → actually ⭐⭐ for product
- **What:** Python/JS scrapers of leaked/private endpoints (Bing, Poe, etc.) [11].
- **Keyless:** “Some integrations” — works until target blocks.
- **Coding:** ✅ when up.
- **Stability:** Very low — breaks weekly; legal gray area.
- **Terms:** **Against provider ToS** if you re-expose.
- **Recommendation:** Do not ship in Codify product build.

---

## 3) What we already ship in Codify today

`src/lib/agents/providers.ts` has 8 providers with `RPM`, `requiresKey`, `models` per role, and `FALLBACK_CHAIN = ['ovh','llm7','openrouter','groq',…,'mock']`. Every `:free` model gets its own 20 RPM / 50 RPD bucket → 5000 RPD swarm.

Your “no-key, not local” rule is respected: all 5 agents (`Architect→Coder→Reviewer→Tester→Fixer`) call `POST {baseURL}/chat/completions` with the same code, only `baseURL`+`model`+`Authorization` header changes. So adding a new keyless provider is one object + one `case` in `client.ts`.

---

## 4) Recommendation for Codify (concrete)

**Ship Team-first, plug-in-second:**
1. **Default flow:** Architect makes plan → Coder v1 → Reviewer+Tester critique → Fixer v2 → consensus (2–3 rounds). That “AIs talking together” is the visible differentiator vs single-chat Cursor.
2. **Default provider (no key): Puter.js** — best dev UX, designed for product, no key to leak. Fallback to **OVH 2 RPM** if Puter popup blocked / user denies. Both are documented free tiers.
3. **Optional plug-ins behind dropdown:** Pollinations Legacy + LLM7 + Community gateway + “Bring your Gradio/HF Space”.
4. **Never depend on GPT4Free scrapers.**
5. **In UI:** show “Why keyless is limited” tooltip: *rate-limited demos, no SLA — add a free key (OpenRouter 17 :free, Google Gemini, Groq 30 RPM) for stable use.* This educates without blocking.

Want me to now wire **Puter.js + Pollinations Legacy + OVH** as the 3 top plug-ins into `providers.ts` + `client.ts` + add a Tester button that actually hits them live (with Puter popup handling)? Say “wire them” and I’ll push.

---

## References
[1] mnfst/awesome-free-llm-apis README — Provider/Inference tables, OVH base URL & 2 RPM, nightly 2026-10-05 (Fetched 2026-10-20 via github.com)
[2] Pollinations APIDOCS.md — Base `https://gen.pollinations.ai`, Getting Started “1. Get an API key at enter.pollinations.ai” (sk_/pk_)
[3] Pollinations classic repo “Free API Classic: No signup, no key — One request per IP at a time”
[4] Blog: “Pollinations No-Key Endpoint Now Needs a Key” — legacy image.p… still anonymous at lower limit, new gen… requires key, 401 without
[5] mvalentsev/awesome-free-ai-coding — “Pollinations.AI — Legacy open text API … Verified 2026-10-19” and “uncloseai (unturf) — Keyless OpenAI-compatible … no signup, no key, no account Verified 2026-10-19”
[6] Puter.js tutorial “Free, Unlimited AI API — … without any API keys … User-Pays … developer pay nothing”
[7] Puter.js tutorial “Serverless AI, Forever Free — include `js.puter.com/v2`, no API keys”
[8] Puter.js tutorial “Free LLM API — 400+ models”
[9] Zenn.dev “Create AI Chat Without API Keys Using Puter.js + BYOK … timeout + fallback … smartphone popup freezing”
[10] mvalentsev/awesome-free-ai-coding #2380 PR note: “Pollinations now requires GitHub sign-in + API key, free use via Quest Pollen, not guaranteed”
[11] GPT4Free repo docs — scraper-based, rate-limited, against terms for product wrapping

