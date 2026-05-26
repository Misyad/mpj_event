import { EventCardSkeleton } from '@/components/skeletons/EventCardSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function PublicHomeLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-md" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </header>
      <main className="flex-1 space-y-6 px-4 py-5">
        <section className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => <EventCardSkeleton key={index} variant="public" />)}
          </div>
        </section>
      </main>
    </div>
  )
}
