import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function TransactionTableSkeleton({ rows = 5, columns = 8 }: { rows?: number; columns?: number }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {Array.from({ length: columns }).map((_, index) => (
                <TableHead key={index}><Skeleton className="h-4 w-20" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }).map((__, columnIndex) => (
                  <TableCell key={columnIndex}>
                    <Skeleton className={`h-4 ${columnIndex === 0 ? 'w-28' : columnIndex === columns - 1 ? 'w-16 rounded-lg' : 'w-24'}`} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-3 p-3 md:hidden">
        {Array.from({ length: Math.min(rows, 4) }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </>
  )
}
