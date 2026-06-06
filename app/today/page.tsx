'use client'
import { useState, useEffect, useCallback } from 'react'
import ProgressBar from '@/components/ProgressBar'
import EditTaskSheet from '@/components/EditTaskSheet'
import FilterBar from '@/components/FilterBar'
import { loadTasks, updateTaskStatus } from '@/lib/storage'
import { googleCalendarUrl } from '@/lib/calendar'
import type { Task, Complexity, Priority } from '@/lib/types'

function formatDuration(min: number): string {
  if (min < 60) return `${min} хв`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}г ${m}хв` : `${h}г`
}

const COMPLEXITY_COLOR: Record<Complexity, string> = {
  low: 'rgba(255,255,255,0.3)',
  medium: '#5B9CF6',
  high: '#FF5C3A',
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isEvening, setIsEvening] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null)
  const [filterComplexity, setFilterComplexity] = useState<Complexity | null>(null)

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

  const visible = tasks.filter(t =>
    (!filterPriority || t.priority === filterPriority) &&
    (!filterComplexity || (t.complexity ?? 'medium') === filterComplexity)
  )

  return (
    <>
      <div
        className="relative flex flex-col min-h-[calc(100dvh-64px)] overflow-hidden"
        style={{
          backgroundImage: 'url(/today-plan-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(12,12,16,0.75)' }} />
      <div className="relative z-10 flex flex-col flex-1 px-5 pt-12">
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-3xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Сьогодні
          </h1>
          <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            {done.length}/{total} · {formatDuration(totalMin)}
          </span>
        </div>

        <ProgressBar value={progress} />

        <div className="mt-5">
          <FilterBar
            priority={filterPriority}
            complexity={filterComplexity}
            onPriority={setFilterPriority}
            onComplexity={setFilterComplexity}
          />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 pt-20">
              <span className="text-5xl">☀</span>
              <p style={{ color: 'var(--text-muted)' }}>Немає задач на сьогодні</p>
            </div>
          ) : (
            visible.map(task => {
              const isDone = task.status === 'done'
              const isNow = task.deadline
                ? new Date(task.deadline).getHours() === currentHour
                : false
              const complexity = task.complexity ?? 'medium'

              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{
                    background: isDone ? 'rgba(200,255,51,0.07)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${isDone ? 'rgba(200,255,51,0.4)' : isNow ? 'rgba(91,156,246,0.5)' : 'rgba(255,255,255,0.15)'}`,
                    opacity: isDone ? 0.6 : 1,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 text-xl shrink-0 transition-all active:scale-90"
                    style={{ color: isDone ? 'var(--lime)' : 'var(--border)' }}
                    aria-label={isDone ? 'Позначити невиконаним' : 'Позначити виконаним'}
                  >
                    {isDone ? '✓' : '○'}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-base font-semibold ${isDone ? 'line-through' : ''}`}
                        style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}
                      >
                        {task.title}
                      </span>
                      {isNow && !isDone && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
                          style={{ background: 'var(--sky)', color: '#fff' }}>
                          зараз
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDuration(task.durationMin)}
                      </span>
                      {task.priority === 'must' && (
                        <span className="text-xs font-bold" style={{ color: 'var(--coral)' }}>MUST</span>
                      )}
                      <span className="text-xs font-bold uppercase" style={{ color: COMPLEXITY_COLOR[complexity] }}>
                        {complexity}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {task.time && (
                      <span className="text-xs px-2 py-0.5 rounded-full mr-1"
                        style={{ background: 'rgba(200,255,51,0.12)', color: 'var(--lime)' }}>
                        {task.time}
                      </span>
                    )}
                    <a
                      href={googleCalendarUrl(task, new Date().toISOString().split('T')[0])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base transition-all active:scale-90"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Додати в Google Calendar"
                      onClick={e => e.stopPropagation()}
                    >
                      📆
                    </a>
                    <button
                      onClick={() => setEditingTask(task)}
                      className="text-base transition-all active:scale-90"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Редагувати"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {isEvening && done.length > 0 && (
          <div className="mt-6 mb-2 p-4 rounded-2xl text-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
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
