import Link from 'next/link'
import type { ReactNode } from 'react'
import { BarChart3, CalendarDays, CreditCard, LayoutDashboard, UserCheck } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { AUTH_ROLES } from '@/lib/auth/roles'
import { hasPermission, type AdminPermission } from '@/lib/auth/permissions'
import { getCurrentAdminSession } from '@/lib/server/rbac'

const menuItems: Array<{ href: string; label: string; icon: typeof LayoutDashboard; permission?: AdminPermission }> = [
  { href: '/regional/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/regional/events', label: 'Event Regional', icon: CalendarDays, permission: 'events.read' },
  { href: '/regional/participants', label: 'Peserta', icon: UserCheck, permission: 'participants.read' },
  { href: '/regional/payment-gateway', label: 'Payment Gateway', icon: CreditCard, permission: 'events.create' },
  { href: '/regional/dashboard', label: 'Analytics', icon: BarChart3, permission: 'analytics.read' },
]

export default async function RegionalLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentAdminSession(AUTH_ROLES.regionalAdmin)
  const permissions = session?.permissions ?? []
  const visibleItems = menuItems.filter((item) => !item.permission || hasPermission(permissions, item.permission))

  return (
    <div className="min-h-screen bg-[#eef3ef] text-[#0f2f25]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dfe8e1] bg-[#123d2d] text-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <BrandMark className="h-6 w-6" />
          <div>
            <p className="text-sm font-extrabold">MPJ Event</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Admin Regional</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {visibleItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 p-4">
          <LogoutButton className="text-white/55 hover:text-white" nextPath="/regional/dashboard" />
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-[#dfe8e1] bg-[#eef3ef]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold">MPJ Event</p>
              <p className="text-xs font-semibold text-gray-500">Admin Regional</p>
            </div>
            <LogoutButton className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700" nextPath="/regional/dashboard" />
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
