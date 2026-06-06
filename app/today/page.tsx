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
            {done.length === total ? 'Відмінний день!' : 'Гарна робота!'}
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
