'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { user, isAdmin, isLoading } = useAuth()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="border-b bg-white">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-sm">
          Feedback Board
        </Link>
        {!isLoading && (
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Admin
                  </Link>
                )}
                <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
