import type { Task } from './types'

const KEY = 'ai-planner-tasks'

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Task[]) : []
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
