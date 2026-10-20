# Codify — Code anywhere, fast.

![Codify](./public/logo.png)

> A Cursor / Codex-inspired, Tokyo Night-themed browser IDE. Fully functional, mobile-friendly, and runs entirely in the browser.

**Live Preview:** `npm run dev` → http://localhost:5173

---

## ✨ Features

- **Monaco Editor** (VS Code's engine) with Tokyo Night theme
- **File Explorer** — create / rename / delete files & folders, nested tree
- **Projects** — create from templates (React + Vite, HTML/CSS/JS, Python, Next.js), persisted in `localStorage`
- **Tabs + Auto-save** — dirty indicator, Monaco binding
- **Live Preview** — HTML/CSS/JS projects render in an iframe; other stacks show file preview
- **Integrated Terminal** — xterm.js simulated shell (`help`, `ls`, `run`, `echo`, `clear`)
- **Activity Bar** — Explorer / Search / Source Control / Run & Debug / Extensions / Codify AI
- **Search** — filter by filename & content
- **Codify AI Chat** — prompt suggestions, ready to wire to an LLM
- **Command Palette** — `⌘K` — New file/folder/project, Run, Toggle Preview/Theme
- **Top Bar + Status Bar** — Cursor-style layout
- **Mobile-first** — collapsible sidebar overlay, FAB for New Project, responsive preview drawer
- **Tokyo Night / Tailwind** — `tokyo.bg` `#1a1b26`, blue accents `#7aa2f7`, logo gradient `from #0ea5e9 to #0b6fda`

## 🗂 Structure
```
src/
  App.tsx                # app shell + state + preview builder
  components/
    ActivityBar.tsx
    Sidebar.tsx          # explorer + search + AI + git/debug/ext
    TopBar.tsx
    EditorArea.tsx
    Terminal.tsx
    CommandPalette.tsx
    NewProjectModal.tsx
    StatusBar.tsx
  lib/
    types.ts
    templates.ts         # 4 starters
    storage.ts           # localStorage + file-tree helpers
```

## 🚀 Getting started
```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## 🎨 Theme
Tokyo Night: `bg #1a1b26`, `bgDark #16161e`, `bgHighlight #292e42`, `fg #c0caf5`, `blue #7aa2f7`. Logo uses bright → deep blue gradient.

Built with ❤️ for Codify.
