import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

const { POST } = await import('./route')

const TEST_IDEA_ID = 'idea-uuid-1234'
const TEST_USER = { id: 'user-uuid-5678', email: 'test@example.com' }

function makeRequest(body?: object): Request {
  return new Request(`http://localhost/api/ideas/${TEST_IDEA_ID}/comments`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeParams(id = TEST_IDEA_ID) {
  return { params: Promise.resolve({ id }) }
}

// ─── Chain builders ───────────────────────────────────────────────────────────

function ideaExistsChain(id = TEST_IDEA_ID) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybySingle: vi.fn().mockResolvedValue({ data: { id } }),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id } }),
  }
}

function ideaMissingChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybySingle: vi.fn().mockResolvedValue({ data: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
  }
}

function insertSuccessChain(comment: object) {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: comment, error: null }),
  }
}

function insertErrorChain() {
  return {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/ideas/[id]/comments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ content: 'Hello' }), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 404 when idea does not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom.mockReturnValueOnce(ideaMissingChain())
    const res = await POST(makeRequest({ content: 'Hello' }), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 400 when content is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom.mockReturnValueOnce(ideaExistsChain())
    const res = await POST(makeRequest({}), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 400 when content is empty string', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom.mockReturnValueOnce(ideaExistsChain())
    const res = await POST(makeRequest({ content: '' }), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 400 when content is only whitespace', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom.mockReturnValueOnce(ideaExistsChain())
    const res = await POST(makeRequest({ content: '   ' }), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 400 when content exceeds 500 characters', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom.mockReturnValueOnce(ideaExistsChain())
    const res = await POST(makeRequest({ content: 'a'.repeat(501) }), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 201 with created comment on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    const createdComment = {
      id: 'comment-uuid-1',
      idea_id: TEST_IDEA_ID,
      user_id: TEST_USER.id,
      author_email: TEST_USER.email,
      content: 'Great idea!',
      created_at: '2026-05-01T12:00:00Z',
    }
    mockFrom
      .mockReturnValueOnce(ideaExistsChain())
      .mockReturnValueOnce(insertSuccessChain(createdComment))
    const res = await POST(makeRequest({ content: 'Great idea!' }), makeParams())
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.content).toBe('Great idea!')
    expect(json.author_email).toBe(TEST_USER.email)
  })

  it('trims whitespace from content', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    const createdComment = {
      id: 'comment-uuid-2',
      idea_id: TEST_IDEA_ID,
      user_id: TEST_USER.id,
      author_email: TEST_USER.email,
      content: 'Trimmed comment',
      created_at: '2026-05-01T12:00:00Z',
    }
    mockFrom
      .mockReturnValueOnce(ideaExistsChain())
      .mockReturnValueOnce(insertSuccessChain(createdComment))
    const res = await POST(makeRequest({ content: '  Trimmed comment  ' }), makeParams())
    expect(res.status).toBe(201)
  })

  it('returns 500 when DB insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom
      .mockReturnValueOnce(ideaExistsChain())
      .mockReturnValueOnce(insertErrorChain())
    const res = await POST(makeRequest({ content: 'Hello' }), makeParams())
    expect(res.status).toBe(500)
  })
})
