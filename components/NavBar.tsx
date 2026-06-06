'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/capture', label: 'Capture', icon: '✦' },
  { href: '/inbox',   label: 'Inbox',   icon: '◈' },
  { href: '/today',   label: 'Today',   icon: '◎' },
]

export default function NavBar() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around h-16 px-4"
      style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
    >
      {TABS.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-0.5 min-w-[64px] py-2"
            style={{ color: active ? 'var(--lime)' : 'var(--text-muted)' }}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] uppercase tracking-widest">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
