import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Params = Promise<{ id: string }>

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id: commentId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch comment to verify existence and ownership
  const { data: comment } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .maybeSingle()

  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  const isOwner = comment.user_id === user.id
  const isAdmin = user.user_metadata?.role === 'admin'

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('comments').delete().eq('id', commentId)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
