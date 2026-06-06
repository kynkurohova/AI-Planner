'use client'
import { useState } from 'react'
import { useSwipeable } from 'react-swipeable'
import type { Task, Complexity } from '@/lib/types'

interface Props {
  task: Task
  onToday: (id: string) => void
  onSchedule: (id: string, date: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
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

const COMPLEXITY_STYLE: Record<Complexity, { label: string; bg: string; color: string }> = {
  low:    { label: 'LOW',  bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' },
  medium: { label: 'MED',  bg: 'rgba(91,156,246,0.15)',  color: '#5B9CF6' },
  high:   { label: 'HIGH', bg: 'rgba(255,92,58,0.15)',   color: '#FF5C3A' },
}

export default function TaskCard({ task, onToday, onSchedule, onDelete, onEdit }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickedDate, setPickedDate] = useState('')

  const handlers = useSwipeable({
    onSwipedRight: () => onToday(task.id),
    onSwipedLeft: () => onDelete(task.id),
    trackMouse: false,
    delta: 50,
  })

  const isMust = task.priority === 'must'
  const deadlineTime = formatDeadlineTime(task.deadline)
  const complexity = COMPLEXITY_STYLE[task.complexity ?? 'medium']
  const todayStr = new Date().toISOString().split('T')[0]

  const handleConfirmDate = () => {
    if (!pickedDate) return
    if (pickedDate === todayStr) {
      onToday(task.id)
    } else {
      onSchedule(task.id, pickedDate)
    }
    setShowDatePicker(false)
    setPickedDate('')
  }

  return (
    <div
      {...handlers}
      className="flex flex-col gap-2 rounded-2xl p-4 mb-3 transition-all active:scale-[0.98]"
      style={{
        background: isMust ? 'rgba(255,92,58,0.12)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${isMust ? 'rgba(255,92,58,0.5)' : 'rgba(255,255,255,0.15)'}`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-base font-semibold leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
          {task.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
            style={{
              background: isMust ? 'var(--coral)' : 'transparent',
              color: isMust ? '#fff' : 'var(--text-muted)',
              border: isMust ? 'none' : '1px solid var(--border)',
            }}
          >
            {isMust ? 'MUST' : 'NICE'}
          </span>
          <span
            className="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
            style={{ background: complexity.bg, color: complexity.color }}
          >
            {complexity.label}
          </span>
        </div>
      </div>

      {/* Chips row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(91,156,246,0.15)', color: 'var(--sky)' }}>
          {formatDuration(task.durationMin)}
        </span>
        {deadlineTime && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(91,156,246,0.15)', color: 'var(--sky)' }}>
            о {deadlineTime}
          </span>
        )}
      </div>

      {/* Date picker (expanded) */}
      {showDatePicker && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="date"
            min={todayStr}
            value={pickedDate}
            onChange={e => setPickedDate(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleConfirmDate}
            disabled={!pickedDate}
            className="px-3 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'rgba(200,255,51,0.8)', color: 'var(--bg)' }}
          >
            ✓
          </button>
          <button
            onClick={() => { setShowDatePicker(false); setPickedDate('') }}
            className="px-3 py-2 rounded-xl text-sm transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Action buttons */}
      {!showDatePicker && (
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => onToday(task.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'rgba(200,255,51,0.8)', color: 'var(--bg)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
          >
            Сьогодні
          </button>
          <button
            onClick={() => setShowDatePicker(true)}
            className="px-3 flex items-center justify-center rounded-xl text-base transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            aria-label="Обрати дату"
          >
            📅
          </button>
          <button
            onClick={() => onEdit(task)}
            className="px-3 flex items-center justify-center rounded-xl text-base transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            aria-label="Редагувати"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="px-3 flex items-center justify-center rounded-xl text-base transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
            aria-label="Видалити"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  )
}
