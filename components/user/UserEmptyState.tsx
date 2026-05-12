import type { ReactNode } from 'react'

export function UserEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[2rem] border border-white/80 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0ec] text-[#1B4332]">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-[#1B4332]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
