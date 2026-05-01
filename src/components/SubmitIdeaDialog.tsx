'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const schema = z.object({
  title: z
    .string()
    .min(1, 'Titel ist erforderlich')
    .max(100, 'Maximal 100 Zeichen'),
  description: z
    .string()
    .min(1, 'Beschreibung ist erforderlich')
    .max(1000, 'Maximal 1000 Zeichen'),
})

type FormValues = z.infer<typeof schema>

interface ServerError {
  message: string
  existingId?: string
}

interface SubmitIdeaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmitIdeaDialog({ open, onOpenChange }: SubmitIdeaDialogProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<ServerError | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  })

  const titleLength = (watch('title') ?? '').length
  const descriptionLength = (watch('description') ?? '').length

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
      setServerError(null)
    }
    onOpenChange(isOpen)
  }

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.status === 409) {
        const json = await response.json()
        setServerError({
          message: 'Eine Idee mit diesem Titel existiert bereits.',
          existingId: json.existingId,
        })
        return
      }

      if (!response.ok) {
        setServerError({ message: 'Fehler beim Einreichen. Bitte versuche es erneut.' })
        return
      }

      reset()
      onOpenChange(false)
      toast.success('Idee erfolgreich eingereicht!')
      router.refresh()
    } catch {
      setServerError({ message: 'Netzwerkfehler. Bitte versuche es erneut.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Idee einreichen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Titel</Label>
              <span className="text-xs text-muted-foreground">{titleLength}/100</span>
            </div>
            <Input
              id="title"
              placeholder="Kurzer, prägnanter Titel"
              maxLength={100}
              aria-describedby={errors.title ? 'title-error' : undefined}
              {...register('title')}
            />
            {errors.title && (
              <p id="title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Beschreibung</Label>
              <span className="text-xs text-muted-foreground">{descriptionLength}/1000</span>
            </div>
            <Textarea
              id="description"
              placeholder="Was ist deine Idee? Welches Problem löst sie?"
              className="min-h-[120px] resize-none"
              maxLength={1000}
              aria-describedby={errors.description ? 'description-error' : undefined}
              {...register('description')}
            />
            {errors.description && (
              <p id="description-error" className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>
                {serverError.message}
                {serverError.existingId && (
                  <>
                    {' '}
                    <a
                      href={`/ideas/${serverError.existingId}`}
                      className="underline font-medium hover:no-underline"
                    >
                      Zur bestehenden Idee →
                    </a>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Einreichen…' : 'Einreichen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
