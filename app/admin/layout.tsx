'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Calendar, ChevronRight, Database, LayoutDashboard, Menu, QrCode, UserCheck, Users2, X } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { BrandMark } from '@/components/BrandMark'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin-pusat/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin-pusat/events', label: 'Master Event', icon: Calendar, exact: false },
  { href: '/admin-pusat/narasumber', label: 'Narasumber', icon: Users2, exact: false },
  { href: '/admin-pusat/peserta', label: 'Master Peserta', icon: UserCheck, exact: false },
  { href: '/admin-pusat/master-data', label: 'Master Data', icon: Database, exact: false },
  { href: '/scan', label: 'Scan Absensi', icon: QrCode, exact: false },
]

function NavItem({ href, label, icon: Icon, active, onClick }: {
  href: string; label: string; icon: React.ElementType; active: boolean; onClick?: () => void
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
        active
          ? 'bg-[#C9A227] text-[#1B4332] shadow-sm'
          : 'text-white/60 hover:bg-white/10 hover:text-white'
      )}>
        <Icon className={cn('w-4 h-4 shrink-0 transition-colors', active ? 'text-[#1B4332]' : 'text-white/50 group-hover:text-white')} />
        <span className="flex-1">{label}</span>
        {active && <ChevronRight className="w-3.5 h-3.5 text-[#1B4332]/60" />}
      </div>
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-[#f0f4f1] flex">

      {/* ─── Sidebar Desktop ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1B4332] min-h-screen fixed left-0 top-0 z-30 border-r border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <BrandMark className="h-5 w-5" />
          <div>
            <p className="font-extrabold text-white text-sm tracking-tight leading-tight">MPJ Event</p>
            <p className="text-white/40 text-[10px] font-medium tracking-wide uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 mb-2">Menu Utama</p>
          {navItems.map(({ href, label, icon, exact }) => (
            <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href, exact)} />
          ))}
        </nav>

        {/* User Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/30 flex items-center justify-center">
              <span className="text-[#C9A227] text-xs font-bold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">Admin Pusat</p>
              <p className="text-white/30 text-[10px] truncate">admin@mpj.id</p>
            </div>
          </div>
          <LogoutButton className="text-white/40 hover:text-white/70" nextPath="/admin-pusat/dashboard" />
        </div>
      </aside>

      {/* ─── Mobile Top Bar ───────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#1B4332] flex items-center justify-between px-4 z-30 border-b border-white/10 shadow-md">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-4 w-4" />
          <div>
            <p className="font-extrabold text-white text-sm leading-none">MPJ Event</p>
            <p className="text-white/40 text-[9px] uppercase tracking-wide">Admin</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* ─── Mobile Drawer ────────────────────────────────── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] bg-[#1B4332] flex flex-col h-full z-50 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-4 w-4" />
                <p className="font-extrabold text-white text-sm">MPJ Admin</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-3 mb-2">Menu Utama</p>
              {navItems.map(({ href, label, icon, exact }) => (
                <NavItem key={href} href={href} label={label} icon={icon} active={isActive(href, exact)} onClick={() => setOpen(false)} />
              ))}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/30 flex items-center justify-center">
                  <span className="text-[#C9A227] text-xs font-bold">AD</span>
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Admin Pusat</p>
                  <p className="text-white/30 text-[10px]">admin@mpj.id</p>
                </div>
              </div>
              <LogoutButton className="text-white/40 hover:text-white/70" nextPath="/admin-pusat/dashboard" />
            </div>
          </aside>
        </div>
      )}

      {/* ─── Main Content ─────────────────────────────────── */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
