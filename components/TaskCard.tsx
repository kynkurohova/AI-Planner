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
