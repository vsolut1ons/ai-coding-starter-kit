import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Kommentar darf nicht leer sein')
    .max(500, 'Kommentar darf maximal 500 Zeichen lang sein')
    .transform((v) => v.trim()),
})

export async function POST(request: Request, { params }: { params: Params }) {
  const { id: ideaId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify idea exists
  const { data: idea } = await supabase
    .from('ideas')
    .select('id')
    .eq('id', ideaId)
    .maybeSingle()

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { content } = parsed.data
  if (!content) {
    return NextResponse.json(
      { error: 'Validation failed', details: { content: ['Kommentar darf nicht leer sein'] } },
      { status: 400 }
    )
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      idea_id: ideaId,
      user_id: user.id,
      author_email: user.email ?? '',
      content,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }

  return NextResponse.json(comment, { status: 201 })
}
