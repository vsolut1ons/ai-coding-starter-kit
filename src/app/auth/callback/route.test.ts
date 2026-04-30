import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockExchangeCodeForSession = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  }),
}))

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ getAll: () => [], set: vi.fn() }),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    NextResponse: {
      redirect: (url: URL | string) => ({ redirected: true, url: url.toString() }),
    },
  }
})

const makeRequest = (code: string | null, next?: string) => {
  const params = new URLSearchParams()
  if (code !== null) params.set('code', code)
  if (next) params.set('next', next)
  return new Request(`http://localhost/auth/callback?${params}`)
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
  })

  it('exchanges code for session and redirects to / on success', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const { GET } = await import('./route')
    const res = await GET(makeRequest('valid-code'))
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code')
    expect(res.url).toBe('http://localhost/')
  })

  it('redirects to custom next path when provided', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
    const { GET } = await import('./route')
    const res = await GET(makeRequest('valid-code', '/ideas'))
    expect(res.url).toBe('http://localhost/ideas')
  })

  it('redirects to /login?error=auth_callback_failed when exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: new Error('invalid') })
    const { GET } = await import('./route')
    const res = await GET(makeRequest('bad-code'))
    expect(res.url).toBe('http://localhost/login?error=auth_callback_failed')
  })

  it('redirects to /login?error=auth_callback_failed when no code is present', async () => {
    const { GET } = await import('./route')
    const res = await GET(makeRequest(null))
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
    expect(res.url).toBe('http://localhost/login?error=auth_callback_failed')
  })
})
