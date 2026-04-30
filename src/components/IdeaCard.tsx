import Link from 'next/link'
import { ThumbsUp, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type Idea } from '@/lib/types'

const statusStyles: Record<string, string> = {
  'Planned': 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-0',
  'In Progress': 'bg-blue-100 text-blue-700 hover:bg-blue-100 border-0',
  'Done': 'bg-green-100 text-green-700 hover:bg-green-100 border-0',
}

export function IdeaCard({ idea }: { idea: Idea }) {
  const statusClass = statusStyles[idea.status] ?? statusStyles['Planned']
  const description =
    idea.description.length > 150
      ? idea.description.slice(0, 150) + '…'
      : idea.description

  return (
    <Link href={`/ideas/${idea.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex gap-4">
          <div className="flex flex-col items-center justify-center min-w-[52px] text-muted-foreground">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm font-semibold mt-1">{idea.vote_count}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h3 className="font-medium text-sm leading-snug line-clamp-2 flex-1">
                {idea.title}
              </h3>
              <Badge variant="secondary" className={statusClass}>
                {idea.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{idea.comment_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
