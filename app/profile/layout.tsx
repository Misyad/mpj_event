import type { ReactNode } from 'react'

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#eef3ef] text-[#1B4332] sm:bg-[#e8f0ec]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f4f7f5] shadow-2xl sm:border-x sm:border-black/5 relative">
        {children}
      </div>
    </main>
  )
}
