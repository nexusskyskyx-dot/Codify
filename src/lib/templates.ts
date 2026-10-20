import { FileNode } from './types'

export const TEMPLATES: Record<string, { name: string; files: FileNode[] }> = {
  react: {
    name: 'React + Vite',
    files: [
      {
        id: '1', name: 'src', type: 'folder', children: [
          { id: '1-1', name: 'App.tsx', type: 'file', language: 'typescript', content: `import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)
  return (
    <div style={{ padding: 32, fontFamily: 'system-ui' }}>
      <h1>Codify × React</h1>
      <p>Fast, modern, Tokyo Night themed.</p>
      <button onClick={() => setCount(c => c + 1)}>
        Count is {count}
      </button>
    </div>
  )
}
` },
          { id: '1-2', name: 'main.tsx', type: 'file', language: 'typescript', content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)` },
          { id: '1-3', name: 'index.css', type: 'file', language: 'css', content: `* { margin: 0; }
body { font-family: Inter, system-ui; background: #1a1b26; color: #c0caf5; }` },
        ]
      },
      { id: '2', name: 'index.html', type: 'file', language: 'html', content: `<!doctype html>
<html>
  <head><title>Codify React</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>` },
      { id: '3', name: 'package.json', type: 'file', language: 'json', content: `{
  "name": "codify-react",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": { "react": "^18.0.0" }
}` },
    ]
  },
  vanilla: {
    name: 'Vanilla HTML/CSS/JS',
    files: [
      { id: '1', name: 'index.html', type: 'file', language: 'html', content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Codify</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="hero">
    <h1>Hello from <span>Codify</span> ✨</h1>
    <p>Edit <code>app.js</code> and see the preview update.</p>
    <button id="btn">Click me</button>
    <p id="out"></p>
  </main>
  <script src="app.js"></script>
</body>
</html>` },
      { id: '2', name: 'style.css', type: 'file', language: 'css', content: `* { box-sizing: border-box; margin: 0; }
body { background: #1a1b26; color: #c0caf5; font-family: Inter, system-ui; }
.hero { max-width: 720px; margin: 80px auto; padding: 32px; }
h1 span { color: #7aa2f7; }
button { margin-top: 16px; background: #7aa2f7; color: #1a1b26; border: 0; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
button:hover { background: #89aef9; }` },
      { id: '3', name: 'app.js', type: 'file', language: 'javascript', content: `const btn = document.getElementById('btn')
const out = document.getElementById('out')
let c = 0
btn.addEventListener('click', () => {
  c++
  out.textContent = \`Clicked \${c} \${c === 1 ? 'time' : 'times'} — built with Codify\`
})` },
    ]
  },
  python: {
    name: 'Python',
    files: [
      { id: '1', name: 'main.py', type: 'file', language: 'python', content: `def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to Codify."

if __name__ == "__main__":
    print(greet("world"))
    # Try loops, async, or import libs — Codify runs it in-preview
    for i in range(3):
        print(f"  • iteration {i+1}")
` },
      { id: '2', name: 'utils.py', type: 'file', language: 'python', content: `def fibonacci(n: int) -> int:
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fib(10) = {fibonacci(10)})` },
      { id: '3', name: 'README.md', type: 'file', language: 'markdown', content: `# Codify — Python Starter\n\n- \`main.py\` is your entrypoint\n- Use the **Run** button to execute\n- Terminal supports interactive I/O\n` },
    ]
  },
  next: {
    name: 'Next.js',
    files: [
      { id: '1', name: 'app', type: 'folder', children: [
        { id: '1-1', name: 'page.tsx', type: 'file', language: 'typescript', content: `export default function Page() {
  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ color: '#7aa2f7' }}>Codify × Next.js</h1>
      <p>App Router ready. Edit app/page.tsx to get started.</p>
    </main>
  )
}` },
        { id: '1-2', name: 'layout.tsx', type: 'file', language: 'typescript', content: `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>
}` },
      ]},
      { id: '2', name: 'package.json', type: 'file', language: 'json', content: `{\n  "name": "codify-next",\n  "scripts": { "dev": "next dev" }\n}` },
    ]
  },
}

export const TEMPLATE_META = [
  { id: 'react', name: 'React', icon: '⚛️', color: '#61dafb', description: 'Vite + React + TypeScript' },
  { id: 'vanilla', name: 'HTML/CSS/JS', icon: '🌐', color: '#e0af68', description: 'Lightweight web starter' },
  { id: 'python', name: 'Python', icon: '🐍', color: '#9ece6a', description: 'Python 3 with runner' },
  { id: 'next', name: 'Next.js', icon: '▲', color: '#c0caf5', description: 'App Router + RSC' },
]
