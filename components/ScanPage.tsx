'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Participant } from '@/types'
import { CheckCircle, LogIn, ScanLine, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ScanResult = { success: true; participant: Participant } | { success: false; message: string } | null

const API_URL = '/api'

export function ScanPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannedRef = useRef(false)

  function handleLogin() {
    if (username && password) setLoggedIn(true)
  }

  async function checkIn(decodedText: string) {
    try {
      const response = await fetch(`${API_URL}/tickets/check-in`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qr_token: decodedText }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'QR tidak dikenali atau tidak valid.')
      }

      setResult({ success: true, participant: payload.data })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'QR tidak dikenali atau tidak valid.',
      })
    }
  }

  async function startScanner() {
    setResult(null)
    scannedRef.current = false
    setScanning(true)
  }

  useEffect(() => {
    if (!scanning) return

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (scannedRef.current) return
          scannedRef.current = true

          scanner.stop().then(() => {
            setScanning(false)
            checkIn(decodedText)
          })
        },
        () => {},
      )
      .catch(() => {
        setScanning(false)
        setResult({ success: false, message: 'Tidak bisa mengakses kamera.' })
      })

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [scanning])

  if (!loggedIn) {
    return (
      <div className="flex flex-col min-h-screen bg-[#1B4332] text-white">
        <div className="flex-1 flex flex-col justify-center px-6 space-y-6">
          <div className="text-center">
            <ScanLine className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <h1 className="text-xl font-bold">Scan Absensi</h1>
            <p className="text-sm text-gray-400 mt-1">Login sebagai panitia untuk lanjut</p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-800 text-white border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button
              onClick={handleLogin}
              disabled={!username || !password}
              className="w-full bg-[#C9A227] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Masuk
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#1B4332] text-white">
      <div className="px-4 py-4 border-b border-gray-800">
        <h1 className="text-base font-bold">Scan Absensi</h1>
        <p className="text-xs text-gray-400">Arahkan kamera ke QR peserta</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 space-y-6">
        {scanning && (
          <div className="w-full rounded-2xl overflow-hidden border-2 border-blue-500">
            <div id="qr-reader" className="w-full" />
          </div>
        )}

        {result && !scanning && (
          <div
            className={`w-full rounded-2xl p-5 text-center ${
              result.success ? 'bg-green-900 border border-green-500' : 'bg-red-900 border border-red-500'
            }`}
          >
            {result.success ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-lg font-bold text-green-300">HADIR</p>
                <p className="text-base font-semibold mt-1">
                  {result.participant.registration_path === 'NIAM'
                    ? result.participant.crew?.full_name
                    : result.participant.guest?.full_name || result.participant.full_name}
                </p>
                <p className="text-xs text-green-400 mt-1">
                  Jalur {result.participant.registration_path}
                  {result.participant.registration_path === 'NIAM' && result.participant.crew
                    ? ` - ${result.participant.crew.unit}`
                    : ''}
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <p className="text-lg font-bold text-red-300">GAGAL</p>
                <p className="text-sm text-red-300 mt-1">{result.message}</p>
              </>
            )}
          </div>
        )}

        {!scanning && (
          <Button
            onClick={startScanner}
            className="w-full bg-[#C9A227] hover:bg-[#b8911f] text-white rounded-xl py-4 font-semibold text-base flex items-center justify-center gap-2"
          >
            <ScanLine className="w-5 h-5" />
            {result ? 'Scan Berikutnya' : 'Mulai Scan'}
          </Button>
        )}

        {scanning && (
          <Button
            onClick={() => {
              scannerRef.current?.stop().catch(() => {})
              setScanning(false)
            }}
            className="w-full bg-[#1B4332]/70 text-white rounded-xl py-3 font-semibold"
          >
            Batal
          </Button>
        )}
      </div>
    </div>
  )
}
