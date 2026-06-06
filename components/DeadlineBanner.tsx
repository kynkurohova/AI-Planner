'use client'
import { useState, useEffect } from 'react'
import { loadTasks, updateTaskStatus, updateTask } from '@/lib/storage'
import type { Task } from '@/lib/types'

export default function DeadlineBanner() {
  const [urgent, setUrgent] = useState<Task | null>(null)

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const in30 = new Date(now.getTime() + 30 * 60 * 1000)
      const tasks = loadTasks().filter(t =>
        t.deadline &&
        t.status !== 'done' &&
        t.status !== 'deleted' &&
        new Date(t.deadline) > now &&
        new Date(t.deadline) <= in30
      )
      setUrgent(tasks[0] ?? null)
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!urgent) return null

  const minutesLeft = Math.round((new Date(urgent.deadline!).getTime() - Date.now()) / 60_000)

  const handleClose = () => {
    updateTaskStatus(urgent.id, 'done')
    setUrgent(null)
  }

  const handlePostpone = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    updateTask(urgent.id, { deadline: tomorrow.toISOString() })
    setUrgent(null)
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-3"
      style={{ background: 'var(--coral)' }}
    >
      <p className="text-sm font-bold text-white mb-2">
        ⏰ «{urgent.title}» — через {minutesLeft} хв
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleClose}
          className="flex-1 py-2 rounded-xl text-xs font-bold uppercase"
          style={{ background: 'rgba(0,0,0,0.25)', color: '#fff' }}
        >
          Закрити задачу
        </button>
        <button
          onClick={handlePostpone}
          className="flex-1 py-2 rounded-xl text-xs font-bold uppercase"
          style={{ background: 'rgba(0,0,0,0.25)', color: '#fff' }}
        >
          На завтра о 9:00
        </button>
      </div>
    </div>
  )
}
