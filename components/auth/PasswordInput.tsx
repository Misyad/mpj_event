'use client'

import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={cn('h-11 rounded-2xl pl-9 pr-11', className)}
      />
      <button
        type="button"
        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-pressed={showPassword}
        onClick={() => setShowPassword((current) => !current)}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-[#f4f7f5] hover:text-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4332]/25 active:scale-95"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
