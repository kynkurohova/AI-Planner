export type Priority = 'must' | 'nice'
export type Status = 'inbox' | 'today' | 'planned' | 'done' | 'deleted'
export type Complexity = 'low' | 'medium' | 'high'

export type Task = {
  id: string
  title: string
  priority: Priority
  complexity: Complexity
  durationMin: number
  deadline: string | null    // ISO date-time (AI-detected or user-set)
  scheduledDate: string | null  // ISO date user picked (YYYY-MM-DD)
  status: Status
  createdAt: string
}
