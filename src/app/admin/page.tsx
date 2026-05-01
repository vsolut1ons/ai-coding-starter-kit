import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { AdminIdeaTable } from '@/components/AdminIdeaTable'
import { createClient } from '@/lib/supabase/server'
import type { Idea } from '@/lib/types'

export const metadata = { title: 'Admin Panel' }

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.role !== 'admin') {
    redirect('/')
  }

  const { data: ideas } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">
            {ideas?.length ?? 0} {ideas?.length === 1 ? 'Idee' : 'Ideen'} eingereicht
          </p>
        </div>
        <AdminIdeaTable ideas={(ideas ?? []) as Idea[]} />
      </main>
    </>
  )
}
