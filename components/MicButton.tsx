'use client'
import { useState, useRef, useCallback } from 'react'

interface Props {
  onTranscript: (text: string) => void
  onError?: (msg: string) => void
}

export default function MicButton({ onTranscript, onError }: Props) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)

  const start = useCallback(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition

    if (!SR) {
      onError?.('Голосовий ввід не підтримується цим браузером')
      return
    }

    const rec = new SR()
    rec.lang = 'uk-UA'
    rec.continuous = true
    rec.interimResults = false

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join(' ')
      onTranscript(transcript)
    }
    rec.onerror = (e) => { onError?.(e.error); setListening(false) }
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
