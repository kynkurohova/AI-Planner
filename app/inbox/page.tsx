'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TaskCard from '@/components/TaskCard'
import EditTaskSheet from '@/components/EditTaskSheet'
import { loadTasks, updateTaskStatus, scheduleTask } from '@/lib/storage'
import type { Task } from '@/lib/types'

export default function InboxPage() {
  const [inboxTasks, setInboxTasks] = useState<Task[]>([])
  const [todayTotalMin, setTodayTotalMin] = useState(0)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
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
  const handleSchedule = (id: string, date: string) => { scheduleTask(id, date); refresh() }
  const handleDelete = (id: string) => { updateTaskStatus(id, 'deleted'); refresh() }

  const overloaded = todayTotalMin > 480

  return (
    <>
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
              <TaskCard
                key={task.id}
                task={task}
                onToday={handleToday}
                onSchedule={handleSchedule}
                onDelete={handleDelete}
                onEdit={setEditingTask}
              />
            ))}
          </div>
        )}
      </div>

      {editingTask && (
        <EditTaskSheet
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={refresh}
        />
      )}
    </>
  )
}
