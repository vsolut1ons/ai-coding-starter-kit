import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ThumbsUp, MessageSquare } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'

const statusStyles: Record<string, string> = {
  'Planned': 'bg-gray-100 text-gray-700 border-0',
  'In Progress': 'bg-blue-100 text-blue-700 border-0',
  'Done': 'bg-green-100 text-green-700 border-0',
}

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: idea } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .single()

  if (!idea) {
    notFound()
  }

  const statusClass = statusStyles[idea.status] ?? statusStyles['Planned']

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Board
        </Link>

        <div className="space-y-4">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-bold flex-1">{idea.title}</h1>
            <Badge variant="secondary" className={statusClass}>
              {idea.status}
            </Badge>
          </div>

          <p className="text-muted-foreground leading-relaxed">{idea.description}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {idea.vote_count} Votes
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {idea.comment_count} Kommentare
            </span>
          </div>

          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground mt-6">
            Kommentare folgen in PROJ-5.
          </div>
        </div>
      </main>
    </>
  )
}
