import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MPJ Apps — Event',
  description: 'Platform event resmi MPJ Indonesia. Temukan, daftar, dan ikuti event pelatihan, seremonial, dan rapat MPJ di seluruh Indonesia.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/mpj-logo.jpeg',
  },
  openGraph: {
    title: 'MPJ Apps — Event',
    description: 'Platform event resmi MPJ Indonesia.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-white">
        {children}
      </body>
    </html>
  )
}
