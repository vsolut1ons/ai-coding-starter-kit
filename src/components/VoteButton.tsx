'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

interface VoteButtonProps {
  ideaId: string
  initialCount: number
  initialVoted: boolean
  className?: string
}

export function VoteButton({ ideaId, initialCount, initialVoted, className }: VoteButtonProps) {
  const { user } = useAuth()
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(initialVoted)
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      window.location.href = '/login?next=/'
      return
    }

    if (loading) return

    const wasVoted = voted
    const previousCount = count

    // Optimistic update — instant feedback before server confirms
    setVoted(!wasVoted)
    setCount(wasVoted ? count - 1 : count + 1)
    setLoading(true)

    try {
      const method = wasVoted ? 'DELETE' : 'POST'
      const res = await fetch(`/api/ideas/${ideaId}/vote`, { method })

      if (!res.ok) throw new Error('Failed to vote')

      const data = await res.json()
      // Sync with server's authoritative count (handles race conditions)
      setCount(data.vote_count)
      setVoted(data.voted)
    } catch {
      // Roll back optimistic update
      setVoted(wasVoted)
      setCount(previousCount)
      toast.error('Abstimmung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={voted ? 'Upvote entfernen' : 'Upvoten'}
      className={cn(
        'flex flex-col items-center justify-center min-w-[52px] rounded-md p-2 transition-colors',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        voted
          ? 'text-blue-600 hover:bg-blue-50'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        className
      )}
    >
      <ThumbsUp className={cn('h-4 w-4', voted && 'fill-current')} />
      <span className="text-sm font-semibold mt-1">{count}</span>
    </button>
  )
}
