'use client'

import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { AUTH_ROLE_CONFIGS } from '@/lib/auth/roles'
import { cn } from '@/lib/utils'

export function RoleLoginSelector({ onSelect }: { onSelect?: () => void }) {
  return (
    <div className="space-y-3">
      {AUTH_ROLE_CONFIGS.map((role) => {
        const Icon = role.icon

        return (
          <Link key={role.role} href={role.loginPath} onClick={onSelect}>
            <div
              className={cn(
                'group flex min-h-28 gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
                role.accentClassName,
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 ring-1 ring-black/5">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold">{role.title}</p>
                  {role.badge ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold">
                      <ShieldCheck className="h-3 w-3" />
                      {role.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{role.description}</p>
              </div>
              <div className="flex items-center">
                <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
