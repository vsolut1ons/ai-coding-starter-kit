import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockFrom = vi.hoisted(() => vi.fn())
const mockAdminFrom = vi.hoisted(() => vi.fn())

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: mockAdminFrom })),
}))

const { DELETE } = await import('./route')

const TEST_COMMENT_ID = 'comment-uuid-1234'
const OWNER_USER = { id: 'owner-uuid', email: 'owner@test.com', user_metadata: {} }
const OTHER_USER = { id: 'other-uuid', email: 'other@test.com', user_metadata: {} }
const ADMIN_USER = { id: 'admin-uuid', email: 'admin@test.com', user_metadata: { role: 'admin' } }

function makeRequest(): Request {
  return new Request(`http://localhost/api/comments/${TEST_COMMENT_ID}`, {
    method: 'DELETE',
  })
}

function makeParams(id = TEST_COMMENT_ID) {
  return { params: Promise.resolve({ id }) }
}

// ─── Chain builders ───────────────────────────────────────────────────────────

function commentExistsChain(userId: string) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: userId } }),
  }
}

function commentMissingChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null }),
  }
}

function deleteSuccessChain() {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  }
}

function deleteErrorChain() {
  return {
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DELETE /api/comments/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 404 when comment does not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: OWNER_USER } })
    mockFrom.mockReturnValueOnce(commentMissingChain())
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not owner and not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: OTHER_USER } })
    mockFrom.mockReturnValueOnce(commentExistsChain(OWNER_USER.id))
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 204 when owner deletes their own comment', async () => {
    mockGetUser.mockResolvedValue({ data: { user: OWNER_USER } })
    mockFrom.mockReturnValueOnce(commentExistsChain(OWNER_USER.id))
    mockAdminFrom.mockReturnValueOnce(deleteSuccessChain())
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(204)
  })

  it('returns 204 when admin deletes any comment', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    mockFrom.mockReturnValueOnce(commentExistsChain(OWNER_USER.id))
    mockAdminFrom.mockReturnValueOnce(deleteSuccessChain())
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(204)
  })

  it('returns 500 when DB delete fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: OWNER_USER } })
    mockFrom.mockReturnValueOnce(commentExistsChain(OWNER_USER.id))
    mockAdminFrom.mockReturnValueOnce(deleteErrorChain())
    const res = await DELETE(makeRequest(), makeParams())
    expect(res.status).toBe(500)
  })
})
