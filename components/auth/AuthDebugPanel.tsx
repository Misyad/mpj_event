'use client'

import { useEffect, useState } from 'react'

type DebugSnapshot = {
  database: {
    host: string | null
    name: string | null
    port: string | null
    selected: string | null
  }
  authProvider: string
  totalUsers: number
  latestUsers: Array<{
    id: string
    fullName: string
    email: string
    createdAt: string | null
    roles: string[]
  }>
}

export function AuthDebugPanel() {
  const [data, setData] = useState<DebugSnapshot | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return

    let cancelled = false
    fetch('/api/debug/users')
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Debug auth gagal')
        if (!cancelled) setData(payload.data as DebugSnapshot)
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : 'Debug auth gagal')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (process.env.NODE_ENV === 'production') return null

  const latest = data?.latestUsers[0]

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-bold text-slate-800">Debug Auth Dev</p>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
          {data ? 'connected' : error ? 'error' : 'loading'}
        </span>
      </div>
      {error ? <p className="text-red-600">{error}</p> : null}
      {data ? (
        <div className="space-y-1">
          <p>Provider: {data.authProvider}</p>
          <p>
            DB: {data.database.selected || data.database.name || '-'} @ {data.database.host || '-'}:{data.database.port || '-'}
          </p>
          <p>Total users: {data.totalUsers}</p>
          <p>Latest: {latest ? `${latest.email} (${latest.roles.join(', ') || 'no-role'})` : '-'}</p>
        </div>
      ) : null}
    </div>
  )
}
