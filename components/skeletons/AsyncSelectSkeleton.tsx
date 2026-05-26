import { Skeleton } from '@/components/ui/skeleton'

export function AsyncSelectSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-1 px-3 py-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg px-1 py-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}
