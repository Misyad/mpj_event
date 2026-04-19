import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'MPJ Apps — Event',
  description: 'Platform event resmi MPJ Indonesia. Temukan, daftar, dan ikuti event pelatihan, seremonial, dan rapat MPJ di seluruh Indonesia.',
  openGraph: {
    title: 'MPJ Apps — Event',
    description: 'Platform event resmi MPJ Indonesia.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-white" style={{ fontFamily: 'var(--font-jakarta), sans-serif' }}>
        <div className="mx-auto max-w-107.5 min-h-screen bg-[#f0f4f0]">
          {children}
        </div>
      </body>
    </html>
  )
}
