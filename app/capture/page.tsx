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
