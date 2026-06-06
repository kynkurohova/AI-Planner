import { NextRequest, NextResponse } from 'next/server'
import { parseTasks } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const { text, today } = await req.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 })
    }
    const todayStr = today ?? new Date().toISOString().split('T')[0]
    const tasks = await parseTasks(text, todayStr)
    return NextResponse.json({ tasks })
  } catch (err) {
    console.error('parse-tasks error:', err)
    return NextResponse.json({ error: 'AI parsing failed' }, { status: 500 })
  }
}
