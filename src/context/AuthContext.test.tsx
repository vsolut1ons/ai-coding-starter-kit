import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import React from 'react'

const mockGetUser = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockUnsubscribe = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
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
    mockGetUser.mockReturnValue(new Promise(() => {}))
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(getByTestId('loading').textContent).toBe('true')
    expect(getByTestId('user').textContent).toBe('null')
    expect(getByTestId('admin').textContent).toBe('false')
  })

  it('sets user and clears loading after getUser resolves with a user', async () => {
    const fakeUser = { email: 'test@example.com', user_metadata: {} }
    mockGetUser.mockResolvedValue({ data: { user: fakeUser } })

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

  it('clears loading and sets no user when getUser returns null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

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
    mockGetUser.mockResolvedValue({ data: { user: adminUser } })

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
    mockGetUser.mockResolvedValue({ data: { user: regularUser } })

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
    mockGetUser.mockResolvedValue({ data: { user: userNoRole } })

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {})

    expect(getByTestId('admin').textContent).toBe('false')
  })

  it('unsubscribes from auth state changes on unmount', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

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
    mockGetUser.mockResolvedValue({ data: { user: null } })

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
