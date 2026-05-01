import { Separator } from '@/components/ui/separator'
import { CommentForm } from '@/components/CommentForm'
import { CommentItem } from '@/components/CommentItem'
import type { Comment } from '@/lib/types'

interface Props {
  ideaId: string
  comments: Comment[]
  currentUserId: string | null
  isAdmin: boolean
}

export function CommentsSection({ ideaId, comments, currentUserId, isAdmin }: Props) {
  return (
    <section className="space-y-4 mt-8">
      <Separator />
      <h2 className="font-semibold text-lg">Kommentare ({comments.length})</h2>

      {currentUserId && (
        <div className="mb-4">
          <CommentForm ideaId={ideaId} />
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Noch keine Kommentare — sei der Erste!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={isAdmin || comment.user_id === currentUserId}
            />
          ))}
        </div>
      )}
    </section>
  )
}
