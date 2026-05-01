import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

async function getIdeaVoteCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ideaId: string
) {
  const { data } = await supabase
    .from('ideas')
    .select('vote_count')
    .eq('id', ideaId)
    .single()
  return data?.vote_count ?? 0
}

export async function POST(_request: Request, { params }: { params: Params }) {
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

  // Insert vote — ON CONFLICT DO NOTHING for idempotency (unique constraint handles duplicates)
  const { error } = await supabase
    .from('votes')
    .insert({ user_id: user.id, idea_id: ideaId })

  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }

  const vote_count = await getIdeaVoteCount(supabase, ideaId)
  return NextResponse.json({ vote_count, voted: true }, { status: 200 })
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id: ideaId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete vote — idempotent: no error if vote doesn't exist
  await supabase
    .from('votes')
    .delete()
    .eq('user_id', user.id)
    .eq('idea_id', ideaId)

  const vote_count = await getIdeaVoteCount(supabase, ideaId)
  return NextResponse.json({ vote_count, voted: false }, { status: 200 })
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const { id: ideaId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const vote_count = await getIdeaVoteCount(supabase, ideaId)

  if (!user) {
    return NextResponse.json({ vote_count, voted: false })
  }

  const { data: vote } = await supabase
    .from('votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('idea_id', ideaId)
    .maybeSingle()

  return NextResponse.json({ vote_count, voted: !!vote })
}
