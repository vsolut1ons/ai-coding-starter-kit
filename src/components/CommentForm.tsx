'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const MAX = 500

interface Props {
  ideaId: string
}

export function CommentForm({ ideaId }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const ref = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch(`/api/ideas/${ideaId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Fehler beim Absenden')
      return
    }

    setContent('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <Textarea
          ref={ref}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Kommentar schreiben…"
          maxLength={MAX}
          rows={3}
          className="resize-none pr-16"
          disabled={loading}
        />
        <span className="absolute bottom-2 right-3 text-xs text-muted-foreground select-none">
          {content.length}/{MAX}
        </span>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || content.trim().length === 0} size="sm">
        {loading ? 'Wird gesendet…' : 'Kommentar absenden'}
      </Button>
    </form>
  )
}
