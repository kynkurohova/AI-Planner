# AI Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first AI Planner Next.js app with voice capture, Claude-powered task parsing, and a 3-screen flow (Capture → Inbox → Today).

**Architecture:** Next.js 14 App Router with 3 route pages, a single API route for Claude parsing, localStorage for persistence, and Web Speech API for voice transcription. No auth, no backend DB.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, `@anthropic-ai/sdk` (claude-sonnet-4-6), Web Speech API, `react-swipeable`, localStorage

---

## File Map

| File | Responsibility |
|------|----------------|
| `app/layout.tsx` | Root layout, dark theme, NavBar |
| `app/page.tsx` | Redirect to /capture |
| `app/globals.css` | Tailwind + CSS design token vars |
| `app/capture/page.tsx` | Screen 1: textarea + mic + CTA |
| `app/inbox/page.tsx` | Screen 2: task cards with actions |
| `app/today/page.tsx` | Screen 3: checklist + progress bar |
| `app/api/parse-tasks/route.ts` | POST: raw text → Task[] via Claude |
| `components/NavBar.tsx` | Fixed bottom nav (Capture / Inbox / Today) |
| `components/TaskCard.tsx` | Swipeable task card (priority badge, duration chip, action buttons) |
| `components/MicButton.tsx` | Hold-to-record via Web Speech API |
| `components/ProgressBar.tsx` | Thin linear progress bar |
| `lib/types.ts` | Task, Priority, Status types |
| `lib/storage.ts` | localStorage CRUD helpers |
| `lib/claude.ts` | Anthropic SDK wrapper + parse prompt |

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`

- [ ] **Step 1: Init Next.js 14 with TypeScript + Tailwind**

```bash
cd "/Users/anastasiia.kynkurohova/Documents/Claude/AI Planner"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected: `app/`, `public/`, `package.json` created

- [ ] **Step 2: Install Anthropic SDK and swipe lib**

```bash
npm install @anthropic-ai/sdk react-swipeable
```

Expected: both packages appear in `package.json` dependencies

- [ ] **Step 3: Create `.env.local`**

```
ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: http://localhost:3000 responds with default Next.js page

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 with TypeScript and Tailwind"
```

---

## Task 2: Design tokens and global styles

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #0C0C10;
  --surface: rgba(255,255,255,0.07);
  --border: rgba(255,255,255,0.1);
  --text-primary: #FFFFFF;
  --text-muted: rgba(255,255,255,0.4);
  --lime: #C8FF33;
  --coral: #FF5C3A;
  --sky: #5B9CF6;
}

* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: var(--bg);
  color: var(--text-primary);
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100dvh;
  overscroll-behavior: none;
}

input, textarea {
  font-size: 16px;
}
```

- [ ] **Step 2: Replace `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0C0C10',
        lime: '#C8FF33',
        coral: '#FF5C3A',
        sky: '#5B9CF6',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat: add design tokens and dark theme globals"
```

---

## Task 3: Types and storage helpers

**Files:**
- Create: `lib/types.ts`
- Create: `lib/storage.ts`

- [ ] **Step 1: Create `lib/types.ts`**

```ts
export type Priority = 'must' | 'nice'
export type Status = 'inbox' | 'today' | 'done' | 'deleted'

export type Task = {
  id: string
  title: string
  priority: Priority
  durationMin: number
  deadline: string | null  // ISO date-time
  status: Status
  createdAt: string        // ISO date-time
}
```

- [ ] **Step 2: Create `lib/storage.ts`**

```ts
import type { Task } from './types'

const KEY = 'ai-planner-tasks'

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Task[]) : []
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(KEY, JSON.stringify(tasks))
}

export function upsertTask(task: Task): void {
  const tasks = loadTasks()
  const idx = tasks.findIndex(t => t.id === task.id)
  if (idx >= 0) {
    tasks[idx] = task
  } else {
    tasks.push(task)
  }
  saveTasks(tasks)
}

export function updateTaskStatus(id: string, status: Task['status']): void {
  const tasks = loadTasks()
  const task = tasks.find(t => t.id === id)
  if (task) {
    task.status = status
    saveTasks(tasks)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts lib/storage.ts
git commit -m "feat: add Task types and localStorage helpers"
```

---

## Task 4: Claude wrapper and parse-tasks API route

**Files:**
- Create: `lib/claude.ts`
- Create: `app/api/parse-tasks/route.ts`

- [ ] **Step 1: Create `lib/claude.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { Task } from './types'

const client = new Anthropic()

const SYSTEM_PROMPT = `You receive a raw brain dump in Ukrainian or English. Extract every task and return a JSON array only — no markdown, no explanation, just the array.

Each task object:
{
  "title": string,           // concise task name, max 5 words
  "priority": "must" | "nice",
  "durationMin": number,     // estimated minutes
  "deadline": string | null  // ISO date-time if mentioned, else null
}

Rules:
- "must" = time-sensitive, has a person/deliverable, or explicitly urgent
- "nice" = vague, optional, no hard deadline
- If a specific time is mentioned ("о 15", "at 3pm"), parse it as today's date + that time
- Keep titles in the original language
- Return only valid JSON array, no other text`

export async function parseTasks(
  text: string,
  today: string
): Promise<Omit<Task, 'id' | 'status' | 'createdAt'>[]> {
  const client_ = new Anthropic()
  const message = await client_.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Today's date: ${today}\n\nBrain dump:\n${text}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected Claude response type')

  const parsed = JSON.parse(content.text)
  if (!Array.isArray(parsed)) throw new Error('Claude response is not a JSON array')

  return parsed
}
```

- [ ] **Step 2: Create `app/api/parse-tasks/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { parseTasks } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { text, today } = await req.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }
    const todayStr = today ?? new Date().toISOString().split('T')[0]
    const tasks = await parseTasks(text, todayStr)
    return NextResponse.json({ tasks })
  } catch (err) {
    console.error('parse-tasks error:', err)
    return NextResponse.json({ error: 'AI parsing failed' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/claude.ts app/api/parse-tasks/route.ts
git commit -m "feat: add Claude wrapper and parse-tasks API route"
```

---

## Task 5: Layout, redirect, and NavBar

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `components/NavBar.tsx`

- [ ] **Step 1: Create `components/NavBar.tsx`**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/capture', label: 'Capture', icon: '✦' },
  { href: '/inbox',   label: 'Inbox',   icon: '◈' },
  { href: '/today',   label: 'Today',   icon: '◎' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around h-16 px-4"
      style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
    >
      {TABS.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 min-w-[64px] py-2"
            style={{ color: active ? 'var(--lime)' : 'var(--text-muted)' }}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] uppercase tracking-widest">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'AI Planner',
  description: 'Brain dump → structured day',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="flex flex-col min-h-dvh" style={{ background: 'var(--bg)' }}>
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Replace `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/capture')
}
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx components/NavBar.tsx
git commit -m "feat: add root layout with NavBar and /capture redirect"
```

---

## Task 6: MicButton component

**Files:**
- Create: `components/MicButton.tsx`

- [ ] **Step 1: Create `components/MicButton.tsx`**

```tsx
'use client'
import { useState, useRef, useCallback } from 'react'

interface Props {
  onTranscript: (text: string) => void
  onError?: (msg: string) => void
}

export default function MicButton({ onTranscript, onError }: Props) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)

  const start = useCallback(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SR) {
      onError?.('Голосовий ввід не підтримується цим браузером')
      return
    }

    const rec = new SR()
    rec.lang = 'uk-UA'
    rec.continuous = true
    rec.interimResults = false

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
      onTranscript(transcript)
    }
    rec.onerror = (e) => { onError?.(e.error); setListening(false) }
    rec.onend = () => setListening(false)

    rec.start()
    recRef.current = rec
    setListening(true)
  }, [onTranscript, onError])

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      className="flex items-center justify-center rounded-full transition-all active:scale-95"
      style={{
        width: 80,
        height: 80,
        background: listening ? 'var(--lime)' : 'var(--surface)',
        border: `2px solid ${listening ? 'var(--lime)' : 'var(--border)'}`,
        color: listening ? 'var(--bg)' : 'var(--text-muted)',
        flexShrink: 0,
      }}
      aria-label={listening ? 'Зупинити запис' : 'Записати голос'}
    >
      <span className="text-3xl select-none">{listening ? '⏹' : '🎙'}</span>
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/MicButton.tsx
git commit -m "feat: add MicButton with Web Speech API hold-to-record"
```

---

## Task 7: Capture screen

**Files:**
- Create: `app/capture/page.tsx`

- [ ] **Step 1: Create `app/capture/page.tsx`**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import MicButton from '@/components/MicButton'
import { upsertTask } from '@/lib/storage'
import type { Task } from '@/lib/types'

export default function CapturePage() {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleTranscript = (t: string) => {
    setText(prev => (prev ? prev + ' ' + t : t))
  }

  const handleSubmit = () => {
    if (!text.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const res = await fetch('/api/parse-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, today }),
        })
        if (!res.ok) throw new Error('failed')
        const { tasks } = await res.json()
        const now = new Date().toISOString()
        tasks.forEach((t: Omit<Task, 'id' | 'status' | 'createdAt'>) => {
          upsertTask({ ...t, id: crypto.randomUUID(), status: 'inbox', createdAt: now })
        })
        router.push('/inbox')
      } catch {
        setError('Не вдалося обробити текст. Спробуй ще раз.')
      }
    })
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] px-5 pt-12">
      <h1
        className="text-3xl font-black uppercase tracking-tight mb-2"
        style={{ color: 'var(--lime)' }}
      >
        Brain dump
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Говори або пиши все підряд
      </p>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Треба написати Анні, доробити презу, забукати зал, не забути про дзвінок о 15…"
        className="flex-1 w-full resize-none rounded-2xl p-4 text-base leading-relaxed outline-none"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          minHeight: 200,
        }}
      />

      {error && (
        <p className="mt-3 text-sm" style={{ color: 'var(--coral)' }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-4 mt-6 mb-6">
        <MicButton onTranscript={handleTranscript} onError={setError} />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isPending}
          className="flex-1 py-5 rounded-2xl text-base font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'var(--lime)', color: 'var(--bg)' }}
        >
          {isPending ? 'Обробляю…' : 'Обробити → задачі'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/capture/page.tsx
git commit -m "feat: add Capture screen (voice + text → AI parse)"
```

---

## Task 8: TaskCard component

**Files:**
- Create: `components/TaskCard.tsx`

- [ ] **Step 1: Create `components/TaskCard.tsx`**

```tsx
'use client'
import { useSwipeable } from 'react-swipeable'
import type { Task } from '@/lib/types'

interface Props {
  task: Task
  onToday: (id: string) => void
  onDelete: (id: string) => void
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} хв`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}г ${m}хв` : `${h}г`
}

function formatDeadlineTime(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

export default function TaskCard({ task, onToday, onDelete }: Props) {
  const handlers = useSwipeable({
    onSwipedRight: () => onToday(task.id),
    onSwipedLeft: () => onDelete(task.id),
    trackMouse: false,
    delta: 50,
  })

  const isMust = task.priority === 'must'
  const deadlineTime = formatDeadlineTime(task.deadline)

  return (
    <div
      {...handlers}
      className="flex flex-col gap-2 rounded-2xl p-4 mb-3 transition-all active:scale-[0.98]"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${isMust ? 'var(--coral)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-base font-semibold leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </span>
        <span
          className="shrink-0 text-xs font-bold uppercase px-2 py-0.5 rounded-full"
          style={{
            background: isMust ? 'var(--coral)' : 'transparent',
            color: isMust ? '#fff' : 'var(--text-muted)',
            border: isMust ? 'none' : '1px solid var(--border)',
          }}
        >
          {isMust ? 'MUST' : 'NICE'}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(91,156,246,0.15)', color: 'var(--sky)' }}
        >
          {formatDuration(task.durationMin)}
        </span>
        {deadlineTime && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(91,156,246,0.15)', color: 'var(--sky)' }}
          >
            о {deadlineTime}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onToday(task.id)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ background: 'var(--lime)', color: 'var(--bg)' }}
        >
          → На сьогодні
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="w-12 flex items-center justify-center rounded-xl text-xl transition-all active:scale-95"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          aria-label="Видалити"
        >
          🗑
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/TaskCard.tsx
git commit -m "feat: add TaskCard with priority badge, duration chip, swipe gestures"
```

---

## Task 9: Inbox screen

**Files:**
- Create: `app/inbox/page.tsx`

- [ ] **Step 1: Create `app/inbox/page.tsx`**

```tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TaskCard from '@/components/TaskCard'
import { loadTasks, updateTaskStatus } from '@/lib/storage'
import type { Task } from '@/lib/types'

export default function InboxPage() {
  const [inboxTasks, setInboxTasks] = useState<Task[]>([])
  const [todayTotalMin, setTodayTotalMin] = useState(0)
  const router = useRouter()

  const refresh = useCallback(() => {
    const all = loadTasks()
    setInboxTasks(all.filter(t => t.status === 'inbox'))
    setTodayTotalMin(
      all.filter(t => t.status === 'today').reduce((sum, t) => sum + t.durationMin, 0)
    )
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleToday = (id: string) => { updateTaskStatus(id, 'today'); refresh() }
  const handleDelete = (id: string) => { updateTaskStatus(id, 'deleted'); refresh() }

  const overloaded = todayTotalMin > 480

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] px-5 pt-12">
      <h1
        className="text-3xl font-black uppercase tracking-tight mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        Inbox
      </h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        {inboxTasks.length} задач · свайп вправо = сьогодні, вліво = видалити
      </p>

      {overloaded && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'rgba(255,92,58,0.1)', border: '1px solid var(--coral)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--coral)' }}>
            Ти запланував {Math.round(todayTotalMin / 60)}г. Хочеш перекинути зайве на завтра?
          </p>
        </div>
      )}

      {inboxTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <span className="text-5xl">✓</span>
          <p style={{ color: 'var(--text-muted)' }}>Inbox порожній</p>
          <button
            onClick={() => router.push('/capture')}
            className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--lime)' }}
          >
            Новий brain dump
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {inboxTasks.map(task => (
            <TaskCard key={task.id} task={task} onToday={handleToday} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/inbox/page.tsx
git commit -m "feat: add Inbox screen with task routing and overload warning"
```

---

## Task 10: ProgressBar + Today screen

**Files:**
- Create: `components/ProgressBar.tsx`
- Create: `app/today/page.tsx`

- [ ] **Step 1: Create `components/ProgressBar.tsx`**

```tsx
interface Props {
  value: number  // 0–1
}

export default function ProgressBar({ value }: Props) {
  const pct = Math.min(Math.max(value, 0), 1) * 100
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: 'var(--lime)' }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create `app/today/page.tsx`**

```tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import ProgressBar from '@/components/ProgressBar'
import { loadTasks, updateTaskStatus } from '@/lib/storage'
import type { Task } from '@/lib/types'

function formatDuration(min: number): string {
  if (min < 60) return `${min} хв`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}г ${m}хв` : `${h}г`
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isEvening, setIsEvening] = useState(false)

  const refresh = useCallback(() => {
    const all = loadTasks().filter(t => t.status === 'today' || t.status === 'done')
    const sorted = [
      ...all.filter(t => t.priority === 'must'),
      ...all.filter(t => t.priority === 'nice'),
    ]
    setTasks(sorted)
    setIsEvening(new Date().getHours() >= 19)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleToggle = (task: Task) => {
    updateTaskStatus(task.id, task.status === 'done' ? 'today' : 'done')
    refresh()
  }

  const done = tasks.filter(t => t.status === 'done')
  const total = tasks.length
  const totalMin = tasks.reduce((sum, t) => sum + t.durationMin, 0)
  const progress = total > 0 ? done.length / total : 0
  const currentHour = new Date().getHours()

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)] px-5 pt-12">
      <div className="flex items-end justify-between mb-2">
        <h1 className="text-3xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Сьогодні
        </h1>
        <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
          {done.length}/{total} · {formatDuration(totalMin)}
        </span>
      </div>

      <ProgressBar value={progress} />

      <div className="flex-1 mt-6 space-y-3 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-20">
            <span className="text-5xl">☀</span>
            <p style={{ color: 'var(--text-muted)' }}>Немає задач на сьогодні</p>
          </div>
        ) : (
          tasks.map(task => {
            const isDone = task.status === 'done'
            const isNow = task.deadline
              ? new Date(task.deadline).getHours() === currentHour
              : false

            return (
              <button
                key={task.id}
                onClick={() => handleToggle(task)}
                className="w-full text-left flex items-start gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
                style={{
                  background: isDone ? 'rgba(200,255,51,0.07)' : 'var(--surface)',
                  border: `1px solid ${isDone ? 'var(--lime)' : isNow ? 'var(--sky)' : 'var(--border)'}`,
                  opacity: isDone ? 0.6 : 1,
                }}
              >
                <span
                  className="mt-0.5 text-xl shrink-0"
                  style={{ color: isDone ? 'var(--lime)' : 'var(--border)' }}
                >
                  {isDone ? '✓' : '○'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-base font-semibold ${isDone ? 'line-through' : ''}`}
                      style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}
                    >
                      {task.title}
                    </span>
                    {isNow && !isDone && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
                        style={{ background: 'var(--sky)', color: '#fff' }}
                      >
                        зараз
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDuration(task.durationMin)}
                    </span>
                    {task.priority === 'must' && (
                      <span className="text-xs font-bold" style={{ color: 'var(--coral)' }}>MUST</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {isEvening && done.length > 0 && (
        <div
          className="mt-6 mb-2 p-4 rounded-2xl text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--lime)' }}>
            {done.length} з {total} задач виконано.{' '}
            {done.length === total ? 'Відмінний день! 🎉' : 'Гарна робота!'}
          </p>
          {done.length < total && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Залишок перейде на завтра автоматично
            </p>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ProgressBar.tsx app/today/page.tsx
git commit -m "feat: add Today screen with checklist, progress, and evening summary"
```

---

## Task 11: Push to GitHub and deploy to Vercel

- [ ] **Step 1: Verify `.gitignore` excludes `.env.local`**

Check that `.env.local` is listed in `.gitignore` (create-next-app adds it by default).

- [ ] **Step 2: Push all commits**

```bash
git push -u origin main
```

Expected: all commits visible at https://github.com/kynkurohova/AI-Planner

- [ ] **Step 3: Deploy on Vercel**

1. Open https://vercel.com/new
2. Import `kynkurohova/AI-Planner`
3. Add environment variable: `ANTHROPIC_API_KEY` = your key
4. Click **Deploy**

Expected: live URL like `https://ai-planner-xyz.vercel.app`

- [ ] **Step 4: Smoke-test on phone**

Open the Vercel URL on mobile → dictate 30 seconds → confirm 4–6 tasks appear in Inbox within 3 seconds.
