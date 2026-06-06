export type Priority = 'must' | 'nice'
export type Status = 'inbox' | 'today' | 'done' | 'deleted'

export type Task = {
  id: string
  title: string
  priority: Priority
  durationMin: number
  deadline: string | null  // ISO date-time
  status: Status
  createdAt: string        // ISO date-time
}
