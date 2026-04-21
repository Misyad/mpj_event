'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  deadline: string
  label?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(deadline: string): TimeLeft | null {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

export function CountdownTimer({ deadline, label = 'Pendaftaran ditutup dalam' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => getTimeLeft(deadline))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(deadline))
    }, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  if (!timeLeft) return null

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 6

  return (
    <div className={`rounded-2xl p-4 ${isUrgent ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
      <p className={`text-xs font-semibold mb-3 ${isUrgent ? 'text-red-600' : 'text-amber-700'}`}>
        ⏳ {label}
      </p>
      <div className="flex items-center gap-2">
        {[
          { value: timeLeft.days, label: 'Hari' },
          { value: timeLeft.hours, label: 'Jam' },
          { value: timeLeft.minutes, label: 'Menit' },
          { value: timeLeft.seconds, label: 'Detik' },
        ].map(({ value, label: unitLabel }, i) => (
          <div key={unitLabel} className="flex items-center gap-2">
            <div className={`w-14 text-center rounded-xl py-2 ${isUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
              <p className={`text-2xl font-extrabold tabular-nums ${isUrgent ? 'text-red-700' : 'text-amber-800'}`}>
                {pad(value)}
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${isUrgent ? 'text-red-400' : 'text-amber-500'}`}>
                {unitLabel}
              </p>
            </div>
            {i < 3 && (
              <span className={`text-lg font-bold ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
