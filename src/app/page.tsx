import { Suspense } from 'react'
import { Navbar } from '@/components/Navbar'
import { IdeaCard } from '@/components/IdeaCard'
import { FeedControls } from '@/components/FeedControls'
import { createClient } from '@/lib/supabase/server'
import { type Idea } from '@/lib/types'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'

const PAGE_SIZE = 20

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  )
}

function makePageUrl(sort: string, status: string, page: number) {
  const params = new URLSearchParams()
  if (sort !== 'top') params.set('sort', sort)
  if (status !== 'all') params.set('status', status)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; status?: string; page?: string }>
}) {
  const { sort: sortParam, status: statusParam, page: pageParam } = await searchParams

  const sort = sortParam === 'new' ? 'new' : 'top'
  const status = statusParam ?? 'all'
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('ideas')
    .select('*', { count: 'exact' })
    .range(from, to)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  query =
    sort === 'top'
      ? query.order('vote_count', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false })

  const { data: ideas, count, error } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Ideen-Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stimme für Ideen ab oder reiche deine eigene ein.
          </p>
        </div>

        <div className="mb-5">
          <Suspense fallback={<div className="h-10" />}>
            <FeedControls />
          </Suspense>
        </div>

        {error ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Fehler beim Laden der Ideen. Bitte versuche es erneut.
          </div>
        ) : !ideas || ideas.length === 0 ? (
          <div className="text-center py-16 space-y-1">
            <p className="font-medium text-muted-foreground">
              {status !== 'all'
                ? 'Keine Ideen in dieser Kategorie.'
                : 'Noch keine Ideen eingereicht.'}
            </p>
            <p className="text-sm text-muted-foreground">Sei der Erste!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(ideas as Idea[]).map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={makePageUrl(sort, status, page - 1)} />
                </PaginationItem>
              )}
              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext href={makePageUrl(sort, status, page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        )}
      </main>
    </>
  )
}
