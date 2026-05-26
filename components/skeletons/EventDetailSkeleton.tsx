import { Skeleton } from '@/components/ui/skeleton'

export function EventDetailSkeleton({ variant = 'admin' }: { variant?: 'admin' | 'public' }) {
  if (variant === 'public') {
    return (
      <div className="flex min-h-screen flex-col pb-24">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm">
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="space-y-4 px-4 py-5">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="fixed bottom-0 left-1/2 w-full max-w-107.5 -translate-x-1/2 border-t border-gray-100 bg-white px-4 py-4">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 p-4 md:p-8">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-8 w-24 rounded-lg" />)}
      </div>
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-14 rounded-2xl" />)}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
    </div>
  )
}
