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

const { POST, DELETE, GET } = await import('./route')

const TEST_IDEA_ID = 'idea-uuid-1234'
const TEST_USER = { id: 'user-uuid-5678', email: 'test@example.com' }

function makeRequest(method = 'POST'): Request {
  return new Request(`http://localhost/api/ideas/${TEST_IDEA_ID}/vote`, { method })
}

function makeParams(id = TEST_IDEA_ID) {
  return { params: Promise.resolve({ id }) }
}

// ─── Chain builders ──────────────────────────────────────────────────────────

function ideaExistsChain(ideaId = TEST_IDEA_ID) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { id: ideaId } }),
  }
}

function ideaMissingChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
  }
}

function voteCountChain(count: number) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { vote_count: count } }),
  }
}

function insertSuccessChain() {
  return { insert: vi.fn().mockResolvedValue({ error: null }) }
}

function insertDuplicateChain() {
  return {
    insert: vi.fn().mockResolvedValue({ error: { code: '23505', message: 'unique violation' } }),
  }
}

function deleteChain() {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  }
}

function voteCheckChain(voted: boolean) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: voted ? { id: 'vote-1' } : null }),
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('POST /api/ideas/[id]/vote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest(), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 404 when idea does not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom
      .mockReturnValueOnce(ideaMissingChain())
    const res = await POST(makeRequest(), makeParams())
    expect(res.status).toBe(404)
  })

  it('inserts vote and returns vote_count and voted:true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom
      .mockReturnValueOnce(ideaExistsChain())
      .mockReturnValueOnce(insertSuccessChain())
      .mockReturnValueOnce(voteCountChain(42))
    const res = await POST(makeRequest(), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.voted).toBe(true)
    expect(json.vote_count).toBe(42)
  })

  it('is idempotent — returns 200 even if vote already exists (unique conflict ignored)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom
      .mockReturnValueOnce(ideaExistsChain())
      .mockReturnValueOnce(insertDuplicateChain())
      .mockReturnValueOnce(voteCountChain(10))
    const res = await POST(makeRequest(), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.voted).toBe(true)
  })
})

describe('DELETE /api/ideas/[id]/vote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(401)
  })

  it('deletes vote and returns vote_count and voted:false', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom
      .mockReturnValueOnce(deleteChain())
      .mockReturnValueOnce(voteCountChain(5))
    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.voted).toBe(false)
    expect(json.vote_count).toBe(5)
  })

  it('is idempotent — returns 200 even if vote did not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom
      .mockReturnValueOnce(deleteChain())
      .mockReturnValueOnce(voteCountChain(0))
    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.voted).toBe(false)
  })
})

describe('GET /api/ideas/[id]/vote', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns voted:false for unauthenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockFrom.mockReturnValueOnce(voteCountChain(7))
    const res = await GET(makeRequest('GET'), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.voted).toBe(false)
    expect(json.vote_count).toBe(7)
  })

  it('returns voted:true when user has voted', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom
      .mockReturnValueOnce(voteCountChain(3))
      .mockReturnValueOnce(voteCheckChain(true))
    const res = await GET(makeRequest('GET'), makeParams())
    const json = await res.json()
    expect(json.voted).toBe(true)
    expect(json.vote_count).toBe(3)
  })

  it('returns voted:false when user has not voted', async () => {
    mockGetUser.mockResolvedValue({ data: { user: TEST_USER } })
    mockFrom
      .mockReturnValueOnce(voteCountChain(8))
      .mockReturnValueOnce(voteCheckChain(false))
    const res = await GET(makeRequest('GET'), makeParams())
    const json = await res.json()
    expect(json.voted).toBe(false)
  })
})
