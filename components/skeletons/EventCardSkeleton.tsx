import { Skeleton } from '@/components/ui/skeleton'

export function EventCardSkeleton({ variant = 'admin' }: { variant?: 'admin' | 'public' }) {
  if (variant === 'public') {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-md">
        <Skeleton className="aspect-video w-full rounded-none" />
        <div className="space-y-3 px-4 py-4">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-4/5" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="space-y-4 p-5">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
        <Skeleton className="h-3 rounded-full" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
