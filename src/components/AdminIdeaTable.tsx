'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Idea, IdeaStatus } from '@/lib/types'

interface Props {
  ideas: Idea[]
}

export function AdminIdeaTable({ ideas: initialIdeas }: Props) {
  const router = useRouter()
  const [ideas, setIdeas] = useState(initialIdeas)

  const handleStatusChange = async (ideaId: string, newStatus: IdeaStatus) => {
    const previous = ideas
    setIdeas(ideas.map((i) => (i.id === ideaId ? { ...i, status: newStatus } : i)))

    const res = await fetch(`/api/ideas/${ideaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!res.ok) {
      setIdeas(previous)
      toast.error('Status konnte nicht geändert werden.')
      return
    }

    toast.success('Status aktualisiert.')
    router.refresh()
  }

  const handleDelete = async (ideaId: string) => {
    const previous = ideas
    setIdeas(ideas.filter((i) => i.id !== ideaId))

    const res = await fetch(`/api/ideas/${ideaId}`, { method: 'DELETE' })

    if (!res.ok) {
      setIdeas(previous)
      toast.error('Idee konnte nicht gelöscht werden.')
      return
    }

    toast.success('Idee gelöscht.')
    router.refresh()
  }

  if (ideas.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
        Noch keine Ideen eingereicht.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titel</TableHead>
            <TableHead className="w-24 text-center">Votes</TableHead>
            <TableHead className="w-48">Status</TableHead>
            <TableHead className="w-32">Eingereicht</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ideas.map((idea) => (
            <TableRow key={idea.id}>
              <TableCell>
                <div className="font-medium">{idea.title}</div>
                {idea.author_email && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {idea.author_email}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-center tabular-nums">{idea.vote_count}</TableCell>
              <TableCell>
                <Select
                  value={idea.status}
                  onValueChange={(v) => handleStatusChange(idea.id, v as IdeaStatus)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(idea.created_at).toLocaleDateString('de-CH')}
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Idee löschen?</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>&ldquo;{idea.title}&rdquo;</strong> wird unwiderruflich
                        gelöscht — inklusive aller zugehörigen Votes und Kommentare.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(idea.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
