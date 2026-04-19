import type { Metadata } from 'next'
import { ScanPage } from '@/components/ScanPage'

export const metadata: Metadata = {
  title: 'Scan Absensi — MPJ Apps',
  robots: { index: false },
}

export default function Scan() {
  return <ScanPage />
}
