'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Comment } from '@/lib/types'
import { relativeTime } from '@/lib/relativeTime'

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
