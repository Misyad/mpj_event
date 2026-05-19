import type { ReactNode } from 'react'

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F4F7F5] text-[#1B4332] sm:bg-[#e8f0ec]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#F4F7F5] shadow-2xl sm:max-w-2xl sm:border-x sm:border-black/5 lg:max-w-3xl">
        {children}
      </div>
    </main>
  )
}
