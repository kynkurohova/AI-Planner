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
      <div
        className="relative flex flex-col min-h-[calc(100dvh-64px)] overflow-hidden"
        style={{
          backgroundImage: 'url(/inbox-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(12,12,16,0.72)' }} />

      <div className="relative z-10 flex flex-col flex-1 px-5 pt-12">
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
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--lime)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
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
