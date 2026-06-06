import type { Metadata, Viewport } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'AI Planner',
  description: 'Brain dump → structured day',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="flex flex-col min-h-dvh" style={{ background: 'var(--bg)' }}>
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        <NavBar />
      </body>
    </html>
  )
}
