interface Props {
  value: number  // 0–1
}

export default function ProgressBar({ value }: Props) {
  const pct = Math.min(Math.max(value, 0), 1) * 100
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: 'var(--lime)' }}
      />
    </div>
  )
}
