import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.hoisted(() => vi.fn())
const mockAdminFrom = vi.hoisted(() => vi.fn())

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: mockAdminFrom })),
}))

const { PATCH, DELETE } = await import('./route')

const TEST_ID = 'idea-uuid-1234'
const ADMIN_USER = {
  id: 'admin-uuid',
  email: 'admin@test.com',
  user_metadata: { role: 'admin' },
}
const REGULAR_USER = {
  id: 'user-uuid',
  email: 'user@test.com',
  user_metadata: {},
}

function makeRequest(method: string, body?: object): Request {
  return new Request(`http://localhost/api/ideas/${TEST_ID}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeParams(id = TEST_ID) {
  return { params: Promise.resolve({ id }) }
}

// ─── Chain builders ───────────────────────────────────────────────────────────

function updateSuccessChain(idea: object) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: idea, error: null }),
  }
}

function updateNotFoundChain() {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'no rows returned' },
    }),
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

// ─── PATCH tests ─────────────────────────────────────────────────────────────

describe('PATCH /api/ideas/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await PATCH(makeRequest('PATCH', { status: 'Done' }), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: REGULAR_USER } })
    const res = await PATCH(makeRequest('PATCH', { status: 'Done' }), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 400 when status value is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    const res = await PATCH(makeRequest('PATCH', { status: 'InvalidStatus' }), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 400 when status field is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    const res = await PATCH(makeRequest('PATCH', {}), makeParams())
    expect(res.status).toBe(400)
  })

  it('returns 200 with updated idea for Planned', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    const updated = { id: TEST_ID, title: 'Test', status: 'Planned', vote_count: 3 }
    mockAdminFrom.mockReturnValueOnce(updateSuccessChain(updated))
    const res = await PATCH(makeRequest('PATCH', { status: 'Planned' }), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('Planned')
  })

  it('returns 200 with updated idea for In Progress', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    const updated = { id: TEST_ID, title: 'Test', status: 'In Progress', vote_count: 5 }
    mockAdminFrom.mockReturnValueOnce(updateSuccessChain(updated))
    const res = await PATCH(makeRequest('PATCH', { status: 'In Progress' }), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('In Progress')
  })

  it('returns 200 with updated idea for Done', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    const updated = { id: TEST_ID, title: 'Test', status: 'Done', vote_count: 10 }
    mockAdminFrom.mockReturnValueOnce(updateSuccessChain(updated))
    const res = await PATCH(makeRequest('PATCH', { status: 'Done' }), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('Done')
  })

  it('returns 404 when idea does not exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    mockAdminFrom.mockReturnValueOnce(updateNotFoundChain())
    const res = await PATCH(makeRequest('PATCH', { status: 'Done' }), makeParams())
    expect(res.status).toBe(404)
  })
})

// ─── DELETE tests ─────────────────────────────────────────────────────────────

describe('DELETE /api/ideas/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: REGULAR_USER } })
    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(403)
  })

  it('returns 204 when idea is deleted successfully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    mockAdminFrom.mockReturnValueOnce(deleteSuccessChain())
    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(204)
  })

  it('returns 500 when DB delete fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } })
    mockAdminFrom.mockReturnValueOnce(deleteErrorChain())
    const res = await DELETE(makeRequest('DELETE'), makeParams())
    expect(res.status).toBe(500)
  })
})
