import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'

export default function IdeaNotFound() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Idee nicht gefunden</h1>
        <p className="text-muted-foreground text-sm">
          Diese Idee existiert nicht oder wurde gelöscht.
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Board
          </Button>
        </Link>
      </main>
    </>
  )
}
