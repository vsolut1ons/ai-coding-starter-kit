import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

// Import after mocks are set up
const { POST } = await import('./route')

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const authenticatedUser = { id: 'user-123', email: 'test@example.com' }

describe('POST /api/ideas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      const response = await POST(makeRequest({ title: 'Test', description: 'Desc' }))
      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: authenticatedUser } })
    })

    it('returns 400 when title is missing', async () => {
      const response = await POST(makeRequest({ description: 'A valid description' }))
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Validation failed')
    })

    it('returns 400 when description is missing', async () => {
      const response = await POST(makeRequest({ title: 'Valid title' }))
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Validation failed')
    })

    it('returns 400 when title exceeds 100 characters', async () => {
      const response = await POST(
        makeRequest({ title: 'a'.repeat(101), description: 'Valid description' })
      )
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.details.title).toBeDefined()
    })

    it('returns 400 when description exceeds 1000 characters', async () => {
      const response = await POST(
        makeRequest({ title: 'Valid title', description: 'a'.repeat(1001) })
      )
      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.details.description).toBeDefined()
    })

    it('returns 400 when title is only whitespace', async () => {
      const response = await POST(
        makeRequest({ title: '   ', description: 'Valid description' })
      )
      expect(response.status).toBe(400)
    })

    it('returns 400 for invalid JSON body', async () => {
      const request = new Request('http://localhost/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Duplicate detection', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: authenticatedUser } })
    })

    it('returns 409 with existingId when a duplicate title is found', async () => {
      const selectChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing-id-123' } }),
      }
      mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(selectChain) })

      const response = await POST(
        makeRequest({ title: 'Mobile App iOS & Android', description: 'Some description' })
      )
      expect(response.status).toBe(409)
      const json = await response.json()
      expect(json.error).toBe('Duplicate idea')
      expect(json.existingId).toBe('existing-id-123')
    })
  })

  describe('Happy path', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: authenticatedUser } })
    })

    it('returns 201 with the created idea on success', async () => {
      const newIdea = {
        id: 'new-idea-id',
        title: 'My New Idea',
        description: 'A great description',
        status: 'Planned',
        vote_count: 0,
        comment_count: 0,
        author_id: 'user-123',
        created_at: '2026-05-01T00:00:00Z',
      }

      const dupCheckChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newIdea, error: null }),
      }

      mockFrom
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(dupCheckChain) })
        .mockReturnValueOnce(insertChain)

      const response = await POST(
        makeRequest({ title: 'My New Idea', description: 'A great description' })
      )
      expect(response.status).toBe(201)
      const json = await response.json()
      expect(json.id).toBe('new-idea-id')
      expect(json.status).toBe('Planned')
      expect(json.vote_count).toBe(0)
      expect(json.author_id).toBe('user-123')
    })

    it('trims whitespace from title and description', async () => {
      const dupCheckChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }

      let capturedInsert: Record<string, unknown> = {}
      const insertChain = {
        insert: vi.fn().mockImplementation((data: Record<string, unknown>) => {
          capturedInsert = data
          return insertChain
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'x', title: 'Trimmed title', description: 'Trimmed desc',
            status: 'Planned', vote_count: 0, comment_count: 0,
            author_id: 'user-123', created_at: '',
          },
          error: null,
        }),
      }

      mockFrom
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(dupCheckChain) })
        .mockReturnValueOnce(insertChain)

      await POST(makeRequest({ title: '  Trimmed title  ', description: '  Trimmed desc  ' }))

      expect(capturedInsert.title).toBe('Trimmed title')
      expect(capturedInsert.description).toBe('Trimmed desc')
    })
  })

  describe('Database error', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: authenticatedUser } })
    })

    it('returns 500 when database insert fails', async () => {
      const dupCheckChain = {
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      }
      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }

      mockFrom
        .mockReturnValueOnce({ select: vi.fn().mockReturnValue(dupCheckChain) })
        .mockReturnValueOnce(insertChain)

      const response = await POST(
        makeRequest({ title: 'Test Idea', description: 'Test description' })
      )
      expect(response.status).toBe(500)
    })
  })
})
