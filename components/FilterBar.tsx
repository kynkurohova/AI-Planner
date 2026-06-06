import type { Priority, Complexity } from '@/lib/types'

interface Props {
  priority: Priority | null
  complexity: Complexity | null
  onPriority: (p: Priority | null) => void
  onComplexity: (c: Complexity | null) => void
}

const PRIORITY_OPTS: { value: Priority | null; label: string; activeColor: string; activeBg: string }[] = [
  { value: null,   label: 'Всі',  activeColor: '#fff',      activeBg: 'rgba(255,255,255,0.15)' },
  { value: 'must', label: 'MUST', activeColor: '#fff',      activeBg: 'var(--coral)' },
  { value: 'nice', label: 'NICE', activeColor: 'var(--bg)', activeBg: 'var(--lime)' },
]

const COMPLEXITY_OPTS: { value: Complexity | null; label: string; activeColor: string; activeBg: string }[] = [
  { value: null,     label: 'Всі',  activeColor: '#fff',      activeBg: 'rgba(255,255,255,0.15)' },
  { value: 'low',    label: 'LOW',  activeColor: 'rgba(255,255,255,0.7)', activeBg: 'rgba(255,255,255,0.1)' },
  { value: 'medium', label: 'MED',  activeColor: '#5B9CF6',   activeBg: 'rgba(91,156,246,0.2)' },
  { value: 'high',   label: 'HIGH', activeColor: '#FF5C3A',   activeBg: 'rgba(255,92,58,0.2)' },
]

function Chip({ label, active, activeColor, activeBg, onClick }: {
  label: string; active: boolean; activeColor: string; activeBg: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
      style={{
        background: active ? activeBg : 'transparent',
        color: active ? activeColor : 'var(--text-muted)',
        border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
      }}
    >
      {label}
    </button>
  )
}

export default function FilterBar({ priority, complexity, onPriority, onComplexity }: Props) {
  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] uppercase tracking-widest shrink-0" style={{ color: 'var(--text-muted)' }}>
          Пріоритет
        </span>
        {PRIORITY_OPTS.map(opt => (
          <Chip
            key={String(opt.value)}
            label={opt.label}
            active={priority === opt.value}
            activeColor={opt.activeColor}
            activeBg={opt.activeBg}
            onClick={() => onPriority(opt.value)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[10px] uppercase tracking-widest shrink-0" style={{ color: 'var(--text-muted)' }}>
          Складність
        </span>
        {COMPLEXITY_OPTS.map(opt => (
          <Chip
            key={String(opt.value)}
            label={opt.label}
            active={complexity === opt.value}
            activeColor={opt.activeColor}
            activeBg={opt.activeBg}
            onClick={() => onComplexity(opt.value)}
          />
        ))}
      </div>
    </div>
  )
}
