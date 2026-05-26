import { ArrowLeft } from 'lucide-react'
import { EventCardSkeleton } from '@/components/skeletons/EventCardSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function PublicEventsLoading() {
  return (
    <div className="min-h-screen bg-[#F4F7F5]">
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-10 pt-5 sm:px-6 sm:pt-7">
        <header className="flex items-start gap-3">
          <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white text-[#1B4332] shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
        </header>
        <section className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => <EventCardSkeleton key={index} variant="public" />)}
          </div>
        </section>
      </main>
    </div>
  )
}
