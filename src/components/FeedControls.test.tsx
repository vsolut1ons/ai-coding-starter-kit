import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedControls } from './FeedControls'

const mockPush = vi.fn()
let mockParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/',
  useSearchParams: () => mockParams,
}))

describe('FeedControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParams = new URLSearchParams()
  })

  it('renders sort tabs', () => {
    render(<FeedControls />)
    expect(screen.getByText('Top')).toBeTruthy()
    expect(screen.getByText('Neu')).toBeTruthy()
  })

  it('renders status filter trigger', () => {
    render(<FeedControls />)
    expect(screen.getByRole('combobox')).toBeTruthy()
  })

  it('clicking Neu tab pushes sort=new to router', async () => {
    const user = userEvent.setup()
    render(<FeedControls />)
    await user.click(screen.getByText('Neu'))
    expect(mockPush).toHaveBeenCalledWith('/?sort=new')
  })

  it('clicking Top tab pushes sort=top to router', async () => {
    const user = userEvent.setup()
    mockParams = new URLSearchParams('sort=new')
    render(<FeedControls />)
    await user.click(screen.getByText('Top'))
    expect(mockPush).toHaveBeenCalledWith('/?sort=top')
  })

  it('changing sort resets page param', async () => {
    const user = userEvent.setup()
    mockParams = new URLSearchParams('sort=top&page=3')
    render(<FeedControls />)
    await user.click(screen.getByText('Neu'))
    const pushed = mockPush.mock.calls[0][0] as string
    expect(pushed).not.toContain('page=')
  })
})
