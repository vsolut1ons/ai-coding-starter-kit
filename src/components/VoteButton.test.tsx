import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VoteButton } from './VoteButton'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUser = { id: 'user-1', email: 'test@example.com' }

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Capture window.location.href assignments
let capturedHref = ''
Object.defineProperty(window, 'location', {
  value: { get href() { return capturedHref }, set href(v) { capturedHref = v } },
  writable: true,
})

import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeResponse(body: object, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VoteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedHref = ''
    // Default: authenticated user
    ;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: mockUser })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial render', () => {
    it('shows the initial vote count', () => {
      render(<VoteButton ideaId="idea-1" initialCount={42} initialVoted={false} />)
      expect(screen.getByText('42')).toBeTruthy()
    })

    it('has aria-label "Upvoten" when not voted', () => {
      render(<VoteButton ideaId="idea-1" initialCount={5} initialVoted={false} />)
      expect(screen.getByRole('button', { name: 'Upvoten' })).toBeTruthy()
    })

    it('has aria-label "Upvote entfernen" when already voted', () => {
      render(<VoteButton ideaId="idea-1" initialCount={5} initialVoted={true} />)
      expect(screen.getByRole('button', { name: 'Upvote entfernen' })).toBeTruthy()
    })
  })

  describe('Unauthenticated user', () => {
    beforeEach(() => {
      ;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null })
    })

    it('redirects to /login?next=/ when clicked', () => {
      render(<VoteButton ideaId="idea-1" initialCount={3} initialVoted={false} />)
      fireEvent.click(screen.getByRole('button'))
      expect(capturedHref).toBe('/login?next=/')
    })

    it('does not call fetch when unauthenticated', () => {
      render(<VoteButton ideaId="idea-1" initialCount={3} initialVoted={false} />)
      fireEvent.click(screen.getByRole('button'))
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Voting (optimistic update)', () => {
    it('increments count immediately before server responds (optimistic)', async () => {
      // Slow response — we check the UI before it resolves
      let resolveResponse!: (v: unknown) => void
      mockFetch.mockReturnValue(new Promise(r => { resolveResponse = r }))

      render(<VoteButton ideaId="idea-1" initialCount={10} initialVoted={false} />)
      fireEvent.click(screen.getByRole('button'))

      // Should show 11 immediately (optimistic)
      expect(screen.getByText('11')).toBeTruthy()

      // Clean up
      resolveResponse({ ok: true, json: () => Promise.resolve({ vote_count: 11, voted: true }) })
    })

    it('calls POST /api/ideas/[id]/vote when not yet voted', async () => {
      mockFetch.mockReturnValue(makeResponse({ vote_count: 6, voted: true }))

      render(<VoteButton ideaId="idea-42" initialCount={5} initialVoted={false} />)
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
        '/api/ideas/idea-42/vote',
        { method: 'POST' }
      ))
    })

    it('syncs count with server response after POST', async () => {
      // Server returns canonical count (e.g. another user voted concurrently)
      mockFetch.mockReturnValue(makeResponse({ vote_count: 15, voted: true }))

      render(<VoteButton ideaId="idea-1" initialCount={10} initialVoted={false} />)
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => expect(screen.getByText('15')).toBeTruthy())
    })
  })

  describe('Unvoting (optimistic update)', () => {
    it('decrements count immediately (optimistic)', async () => {
      let resolveResponse!: (v: unknown) => void
      mockFetch.mockReturnValue(new Promise(r => { resolveResponse = r }))

      render(<VoteButton ideaId="idea-1" initialCount={8} initialVoted={true} />)
      fireEvent.click(screen.getByRole('button'))

      expect(screen.getByText('7')).toBeTruthy()

      resolveResponse({ ok: true, json: () => Promise.resolve({ vote_count: 7, voted: false }) })
    })

    it('calls DELETE /api/ideas/[id]/vote when already voted', async () => {
      mockFetch.mockReturnValue(makeResponse({ vote_count: 4, voted: false }))

      render(<VoteButton ideaId="idea-99" initialCount={5} initialVoted={true} />)
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
        '/api/ideas/idea-99/vote',
        { method: 'DELETE' }
      ))
    })
  })

  describe('Error handling — rollback', () => {
    it('rolls back count when API returns non-ok response', async () => {
      mockFetch.mockReturnValue(makeResponse({ error: 'Server error' }, false))

      render(<VoteButton ideaId="idea-1" initialCount={10} initialVoted={false} />)
      fireEvent.click(screen.getByRole('button'))

      // Optimistic: shows 11
      expect(screen.getByText('11')).toBeTruthy()

      // After rejection: rolls back to 10
      await waitFor(() => expect(screen.getByText('10')).toBeTruthy())
    })

    it('shows error toast when API fails', async () => {
      mockFetch.mockReturnValue(makeResponse({ error: 'fail' }, false))

      render(<VoteButton ideaId="idea-1" initialCount={5} initialVoted={false} />)
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => expect(toast.error).toHaveBeenCalled())
    })

    it('rolls back when fetch throws (network error)', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<VoteButton ideaId="idea-1" initialCount={20} initialVoted={false} />)
      fireEvent.click(screen.getByRole('button'))

      await waitFor(() => expect(screen.getByText('20')).toBeTruthy())
      expect(toast.error).toHaveBeenCalled()
    })
  })

  describe('Double-click protection', () => {
    it('ignores a second click while the first request is still in flight', async () => {
      let resolveFirst!: (v: unknown) => void
      mockFetch.mockReturnValueOnce(new Promise(r => { resolveFirst = r }))

      render(<VoteButton ideaId="idea-1" initialCount={5} initialVoted={false} />)
      const btn = screen.getByRole('button')

      fireEvent.click(btn) // first click → optimistic 6
      fireEvent.click(btn) // second click — should be ignored (loading)

      expect(mockFetch).toHaveBeenCalledTimes(1)

      resolveFirst({ ok: true, json: () => Promise.resolve({ vote_count: 6, voted: true }) })
      await waitFor(() => expect(screen.getByText('6')).toBeTruthy())
    })
  })
})
