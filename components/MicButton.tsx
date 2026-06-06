'use client'
import { useState, useRef, useCallback } from 'react'

interface Props {
  onTranscript: (text: string) => void
  onError?: (msg: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

export default function MicButton({ onTranscript, onError }: Props) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<AnySpeechRecognition>(null)

  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition

    if (!SR) {
      onError?.('Голосовий ввід не підтримується цим браузером')
      return
    }

    const rec = new SR()
    rec.lang = 'uk-UA'
    rec.continuous = true
    rec.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results as ArrayLike<SpeechRecognitionResult>)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript as string)
        .join(' ')
      onTranscript(transcript)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => { onError?.(e.error); setListening(false) }
    rec.onend = () => setListening(false)

    rec.start()
    recRef.current = rec
    setListening(true)
  }, [onTranscript, onError])

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      className="flex items-center justify-center rounded-full transition-all active:scale-95"
      style={{
        width: 80,
        height: 80,
        flexShrink: 0,
        background: listening ? 'var(--lime)' : 'var(--surface)',
        border: `2px solid ${listening ? 'var(--lime)' : 'var(--border)'}`,
        color: listening ? 'var(--bg)' : 'var(--text-muted)',
      }}
      aria-label={listening ? 'Зупинити запис' : 'Записати голос'}
    >
      <span className="text-3xl select-none">{listening ? '⏹' : '🎙'}</span>
    </button>
  )
}
