import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const submitSchema = z.object({
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(100, 'Titel darf maximal 100 Zeichen lang sein')
    .transform((v) => v.trim()),
  description: z
    .string()
    .min(1, 'Beschreibung ist erforderlich')
    .max(1000, 'Beschreibung darf maximal 1000 Zeichen lang sein')
    .transform((v) => v.trim()),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { title, description } = parsed.data

  // Validate trimmed values are non-empty after trimming
  if (!title) {
    return NextResponse.json(
      { error: 'Validation failed', details: { title: ['Titel ist erforderlich'] } },
      { status: 400 }
    )
  }

  // Case-insensitive duplicate check
  const { data: existing } = await supabase
    .from('ideas')
    .select('id')
    .ilike('title', title)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: 'Duplicate idea', existingId: existing.id },
      { status: 409 }
    )
  }

  const { data: idea, error } = await supabase
    .from('ideas')
    .insert({
      title,
      description,
      status: 'Planned',
      vote_count: 0,
      comment_count: 0,
      author_id: user.id,
      author_email: user.email ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 })
  }

  return NextResponse.json(idea, { status: 201 })
}
