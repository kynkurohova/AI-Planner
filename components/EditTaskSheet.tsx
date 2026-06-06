'use client'
import { useState } from 'react'
import type { Task, Priority, Complexity } from '@/lib/types'
import { updateTask } from '@/lib/storage'

interface Props {
  task: Task
  onClose: () => void
  onSaved: () => void
}

export default function EditTaskSheet({ task, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task.title)
  const [deadline, setDeadline] = useState(
    task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
  )
  const [scheduledDate, setScheduledDate] = useState(task.scheduledDate ?? '')
  const [time, setTime] = useState(task.time ?? '')
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [complexity, setComplexity] = useState<Complexity>(task.complexity ?? 'medium')

  const handleSave = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      scheduledDate: scheduledDate || null,
      time: time || null,
      priority,
      complexity,
    })
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl p-5 pb-10"
        style={{ background: '#16161C', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />

        <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Пріоритет</p>
        <div className="flex gap-2 mb-4">
          {(['must', 'nice'] as Priority[]).map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-95"
              style={{
                background: priority === p
                  ? (p === 'must' ? 'var(--coral)' : 'var(--lime)')
                  : 'var(--surface)',
                color: priority === p
                  ? (p === 'must' ? '#fff' : 'var(--bg)')
                  : 'var(--text-muted)',
                border: priority === p ? 'none' : '1px solid var(--border)',
              }}
            >
              {p === 'must' ? 'MUST' : 'NICE'}
            </button>
          ))}
        </div>

        <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Складність</p>
        <div className="flex gap-2 mb-4">
          {([['low', 'LOW', 'rgba(255,255,255,0.4)', 'var(--surface)'], ['medium', 'MED', '#5B9CF6', 'rgba(91,156,246,0.2)'], ['high', 'HIGH', '#FF5C3A', 'rgba(255,92,58,0.2)']] as [Complexity, string, string, string][]).map(([val, label, activeColor, activeBg]) => (
            <button
              key={val}
              onClick={() => setComplexity(val)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-95"
              style={{
                background: complexity === val ? activeBg : 'var(--surface)',
                color: complexity === val ? activeColor : 'var(--text-muted)',
                border: `1px solid ${complexity === val ? activeColor : 'var(--border)'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Назва</p>
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-xl p-3 text-base outline-none mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />

        <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Дедлайн (час)</p>
        <input
          type="datetime-local"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full rounded-xl p-3 text-base outline-none mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />

        <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Запланована дата</p>
        <input
          type="date"
          value={scheduledDate}
          onChange={e => setScheduledDate(e.target.value)}
          className="w-full rounded-xl p-3 text-base outline-none mb-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />

        <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Час початку</p>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="w-full rounded-xl p-3 text-base outline-none mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Скасувати
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--lime)', color: 'var(--bg)' }}
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  )
}
