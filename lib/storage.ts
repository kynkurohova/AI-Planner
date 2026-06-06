import type { Task } from './types'

const KEY = 'ai-planner-tasks'

function normalize(raw: Partial<Task> & Pick<Task, 'id' | 'title' | 'priority' | 'status'>): Task {
  return {
    complexity: 'medium',
    durationMin: 30,
    deadline: null,
    scheduledDate: null,
    createdAt: new Date().toISOString(),
    ...raw,
  } as Task
}

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Task>[]) : []
    return parsed.map(t => normalize(t as Partial<Task> & Pick<Task, 'id' | 'title' | 'priority' | 'status'>))
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(KEY, JSON.stringify(tasks))
}

export function upsertTask(task: Task): void {
  const tasks = loadTasks()
  const idx = tasks.findIndex(t => t.id === task.id)
  if (idx >= 0) {
    tasks[idx] = task
  } else {
    tasks.push(task)
  }
  saveTasks(tasks)
}

export function updateTaskStatus(id: string, status: Task['status']): void {
  const tasks = loadTasks()
  const task = tasks.find(t => t.id === id)
  if (task) {
    task.status = status
    saveTasks(tasks)
  }
}

export function scheduleTask(id: string, date: string): void {
  const tasks = loadTasks()
  const task = tasks.find(t => t.id === id)
  if (!task) return
  const today = new Date().toISOString().split('T')[0]
  task.scheduledDate = date
  task.status = date === today ? 'today' : 'planned'
  saveTasks(tasks)
}

export function updateTask(id: string, changes: Partial<Pick<Task, 'title' | 'deadline' | 'scheduledDate' | 'durationMin' | 'priority' | 'complexity'>>): void {
  const tasks = loadTasks()
  const task = tasks.find(t => t.id === id)
  if (task) {
    Object.assign(task, changes)
    saveTasks(tasks)
  }
}
