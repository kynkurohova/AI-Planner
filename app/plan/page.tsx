'use client'
import { useState, useEffect, useCallback } from 'react'
import EditTaskSheet from '@/components/EditTaskSheet'
import { loadTasks, updateTaskStatus } from '@/lib/storage'
import { googleCalendarUrl } from '@/lib/calendar'
import type { Task, Complexity } from '@/lib/types'

function formatDuration(min: number): string {
  if (min < 60) return `${min} хв`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}г ${m}хв` : `${h}г`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric', month: 'short' })
}

const COMPLEXITY_COLOR: Record<Complexity, string> = {
  low:    'rgba(255,255,255,0.3)',
  medium: '#5B9CF6',
  high:   '#FF5C3A',
}

export default function PlanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const refresh = useCallback(() => {
    const planned = loadTasks()
      .filter(t => t.status === 'planned' && t.scheduledDate)
      .sort((a, b) => (a.scheduledDate! > b.scheduledDate! ? 1 : -1))
    setTasks(planned)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleMoveToToday = (id: string) => { updateTaskStatus(id, 'today'); refresh() }
  const handleDelete = (id: string) => { updateTaskStatus(id, 'deleted'); refresh() }

  // Group tasks by scheduledDate
  const grouped: Record<string, Task[]> = {}
  tasks.forEach(t => {
    const key = t.scheduledDate!
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })
  const dateKeys = Object.keys(grouped).sort()

  return (
    <>
      <div className="flex flex-col min-h-[calc(100dvh-64px)] px-5 pt-12">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Plan
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {tasks.length} задач · відсортовано від найближчої
        </p>

        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <span className="text-5xl">◷</span>
            <p style={{ color: 'var(--text-muted)' }}>Немає запланованих задач</p>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              У Inbox натисни 📅, щоб призначити дату
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6">
            {dateKeys.map(date => (
              <div key={date}>
                <p className="text-xs uppercase tracking-widest font-bold mb-3"
                  style={{ color: 'var(--lime)' }}>
                  {formatDate(date)}
                </p>
                <div className="space-y-3">
                  {grouped[date].map(task => {
                    const isMust = task.priority === 'must'
                    const complexity = task.complexity ?? 'medium'
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-4 rounded-2xl"
                        style={{
                          background: 'var(--surface)',
                          border: `1px solid ${isMust ? 'var(--coral)' : 'var(--border)'}`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-base font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                              {task.title}
                            </span>
                            <div className="flex gap-1 shrink-0">
                              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                                style={{
                                  background: isMust ? 'var(--coral)' : 'transparent',
                                  color: isMust ? '#fff' : 'var(--text-muted)',
                                  border: isMust ? 'none' : '1px solid var(--border)',
                                }}>
                                {isMust ? 'MUST' : 'NICE'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(91,156,246,0.15)', color: 'var(--sky)' }}>
                              {formatDuration(task.durationMin)}
                            </span>
                            <span className="text-xs font-bold uppercase" style={{ color: COMPLEXITY_COLOR[complexity] }}>
                              {complexity}
                            </span>
                            {task.time && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,255,51,0.12)', color: 'var(--lime)' }}>
                                {task.time}
                              </span>
                            )}
                            {task.deadline && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(91,156,246,0.15)', color: 'var(--sky)' }}>
                                до {new Date(task.deadline).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 shrink-0">
                          <a
                            href={googleCalendarUrl(task)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm px-2 py-1 rounded-lg text-center transition-all active:scale-95"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                            aria-label="Додати в Google Calendar"
                          >
                            📆
                          </a>
                          <button onClick={() => setEditingTask(task)}
                            className="text-sm px-2 py-1 rounded-lg transition-all active:scale-95"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                            aria-label="Редагувати">
                            ✏️
                          </button>
                          <button onClick={() => handleMoveToToday(task.id)}
                            className="text-xs px-2 py-1 rounded-lg font-semibold transition-all active:scale-95"
                            style={{ background: 'var(--lime)', color: 'var(--bg)' }}>
                            ◎
                          </button>
                          <button onClick={() => handleDelete(task.id)}
                            className="text-sm px-2 py-1 rounded-lg transition-all active:scale-95"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                            aria-label="Видалити">
                            🗑
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
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
