import { Navbar } from '@/components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Feedback Board</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Submit ideas and vote on what gets built next.
          </p>
          <p className="text-sm text-muted-foreground">
            Idea feed coming in PROJ-2.
          </p>
        </div>
      </main>
    </>
  )
}
