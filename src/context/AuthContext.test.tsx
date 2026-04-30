import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import React from 'react'

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockUnsubscribe = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

function TestConsumer() {
  const { user, isLoading, isAdmin } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.email ?? 'null'}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })
  })

  it('starts with isLoading true and no user', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}))
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(getByTestId('loading').textContent).toBe('true')
    expect(getByTestId('user').textContent).toBe('null')
    expect(getByTestId('admin').textContent).toBe('false')
  })

  it('sets user and clears loading after session resolves with a user', async () => {
    const fakeUser = { email: 'test@example.com', user_metadata: {} }
    mockGetSession.mockResolvedValue({ data: { session: { user: fakeUser } } })

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {})

    expect(getByTestId('loading').textContent).toBe('false')
    expect(getByTestId('user').textContent).toBe('test@example.com')
    expect(getByTestId('admin').textContent).toBe('false')
  })

  it('clears loading and sets no user when session is null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {})

    expect(getByTestId('loading').textContent).toBe('false')
    expect(getByTestId('user').textContent).toBe('null')
  })

  it('sets isAdmin true when user_metadata.role is admin', async () => {
    const adminUser = { email: 'admin@example.com', user_metadata: { role: 'admin' } }
    mockGetSession.mockResolvedValue({ data: { session: { user: adminUser } } })

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {})

    expect(getByTestId('admin').textContent).toBe('true')
  })

  it('sets isAdmin false when user_metadata.role is not admin', async () => {
    const regularUser = { email: 'user@example.com', user_metadata: { role: 'user' } }
    mockGetSession.mockResolvedValue({ data: { session: { user: regularUser } } })

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {})

    expect(getByTestId('admin').textContent).toBe('false')
  })

  it('sets isAdmin false when user has no role metadata', async () => {
    const userNoRole = { email: 'user@example.com', user_metadata: {} }
    mockGetSession.mockResolvedValue({ data: { session: { user: userNoRole } } })

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {})

    expect(getByTestId('admin').textContent).toBe('false')
  })

  it('unsubscribes from auth state changes on unmount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { unmount } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {})
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledOnce()
  })

  it('updates user when onAuthStateChange fires', async () => {
    let authCallback: (event: string, session: { user: unknown } | null) => void = () => {}
    mockOnAuthStateChange.mockImplementation((cb) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {})
    expect(getByTestId('user').textContent).toBe('null')

    const newUser = { email: 'new@example.com', user_metadata: {} }
    await act(async () => {
      authCallback('SIGNED_IN', { user: newUser })
    })

    expect(getByTestId('user').textContent).toBe('new@example.com')
    expect(getByTestId('loading').textContent).toBe('false')
  })
})
