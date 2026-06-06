'use client'
import { useState } from 'react'
import type { Task } from '@/lib/types'
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

  const handleSave = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      scheduledDate: scheduledDate || null,
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
