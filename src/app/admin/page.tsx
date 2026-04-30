import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Admin Panel' }

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage ideas, statuses, and moderation.</p>
        </div>
        <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
          Admin features coming in PROJ-6.
        </div>
      </div>
    </div>
  )
}
