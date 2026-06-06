import type { Task } from './types'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function fmtLocal(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

export function googleCalendarUrl(task: Task, fallbackDate?: string): string {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
  const title = encodeURIComponent(task.title)
  const details = encodeURIComponent(
    [task.priority.toUpperCase(), `${task.durationMin} хв`, task.complexity].join(' · ')
  )

  const date = task.scheduledDate ?? fallbackDate

  if (date && task.time) {
    const [h, m] = task.time.split(':').map(Number)
    const start = new Date(date)
    start.setHours(h, m, 0, 0)
    const end = new Date(start.getTime() + task.durationMin * 60_000)
    return `${base}&text=${title}&dates=${fmtLocal(start)}/${fmtLocal(end)}&details=${details}`
  }

  if (date) {
    const d = date.replace(/-/g, '')
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    const nd = nextDate.toISOString().split('T')[0].replace(/-/g, '')
    return `${base}&text=${title}&dates=${d}/${nd}&details=${details}`
  }

  // Fallback: today all-day
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0].replace(/-/g, '')
  return `${base}&text=${title}&dates=${today}/${tomorrow}&details=${details}`
}
