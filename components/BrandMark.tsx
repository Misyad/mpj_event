import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
      <Image
        src="/mpj-logo.jpeg"
        alt="MPJ Apps Logo"
        width={512}
        height={512}
        className={cn('h-6 w-6 object-contain', className)}
        priority
      />
    </div>
  )
}
