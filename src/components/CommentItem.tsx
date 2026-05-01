'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Comment } from '@/lib/types'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' })
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  const days = Math.floor(hours / 24)
  return rtf.format(-days, 'day')
}

interface Props {
  comment: Comment
  canDelete: boolean
}

export function CommentItem({ comment, canDelete }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/comments/${comment.id}`, { method: 'DELETE' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex gap-3 group">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{comment.author_email}</span>
          <span className="text-muted-foreground">{relativeTime(comment.created_at)}</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
          disabled={loading}
          aria-label="Kommentar löschen"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
