'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LogoutButton({ className, nextPath }: { className?: string; nextPath?: string }) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ next: nextPath ?? window.location.pathname + window.location.search }),
      })
      const payload = await response.json().catch(() => ({}))
      router.replace(typeof payload.redirectTo === 'string' ? payload.redirectTo : '/')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={cn('flex items-center gap-2 text-xs transition-colors disabled:opacity-60', className)}
    >
      <LogOut className="h-3.5 w-3.5" />
      {isLoggingOut ? 'Keluar...' : 'Logout'}
    </button>
  )
}
