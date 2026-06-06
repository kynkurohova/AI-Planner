import Anthropic from '@anthropic-ai/sdk'
import type { Task } from './types'

const SYSTEM_PROMPT = `You receive a raw brain dump in Ukrainian or English. Extract every task and return a JSON array only — no markdown, no explanation, just the array.

Each task object:
{
  "title": string,           // concise task name, max 5 words
  "priority": "must" | "nice",
  "durationMin": number,     // estimated minutes
  "deadline": string | null  // ISO date-time if mentioned, else null
}

Rules:
- "must" = time-sensitive, has a person/deliverable, or explicitly urgent
- "nice" = vague, optional, no hard deadline
- If a specific time is mentioned ("о 15", "at 3pm"), parse it as today's date + that time
- Keep titles in the original language
- Return only valid JSON array, no other text`

export async function parseTasks(
  text: string,
  today: string
): Promise<Omit<Task, 'id' | 'status' | 'createdAt'>[]> {
  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Today's date: ${today}\n\nBrain dump:\n${text}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected Claude response type')

  const parsed = JSON.parse(content.text)
  if (!Array.isArray(parsed)) throw new Error('Claude response is not a JSON array')

  return parsed
}
