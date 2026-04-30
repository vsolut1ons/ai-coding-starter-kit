import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IdeaCard } from './IdeaCard'
import { type Idea } from '@/lib/types'

const base: Idea = {
  id: 'abc-123',
  title: 'Dark Mode Support',
  description: 'Add a dark mode toggle to the app.',
  status: 'Planned',
  vote_count: 42,
  comment_count: 7,
  author_id: 'user-1',
  created_at: '2026-04-30T10:00:00Z',
}

describe('IdeaCard', () => {
  it('renders title', () => {
    render(<IdeaCard idea={base} />)
    expect(screen.getByText('Dark Mode Support')).toBeTruthy()
  })

  it('renders vote count', () => {
    render(<IdeaCard idea={base} />)
    expect(screen.getByText('42')).toBeTruthy()
  })

  it('renders comment count', () => {
    render(<IdeaCard idea={base} />)
    expect(screen.getByText('7')).toBeTruthy()
  })

  it('renders status badge', () => {
    render(<IdeaCard idea={base} />)
    expect(screen.getByText('Planned')).toBeTruthy()
  })

  it('links to the idea detail page', () => {
    render(<IdeaCard idea={base} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/ideas/abc-123')
  })

  it('truncates description longer than 150 chars', () => {
    const longDesc = 'x'.repeat(200)
    render(<IdeaCard idea={{ ...base, description: longDesc }} />)
    expect(screen.getByText('x'.repeat(150) + '…')).toBeTruthy()
  })

  it('does not truncate description of 150 chars or fewer', () => {
    const shortDesc = 'Short and sweet.'
    render(<IdeaCard idea={{ ...base, description: shortDesc }} />)
    expect(screen.getByText('Short and sweet.')).toBeTruthy()
  })

  it('renders In Progress status badge', () => {
    render(<IdeaCard idea={{ ...base, status: 'In Progress' }} />)
    expect(screen.getByText('In Progress')).toBeTruthy()
  })

  it('renders Done status badge', () => {
    render(<IdeaCard idea={{ ...base, status: 'Done' }} />)
    expect(screen.getByText('Done')).toBeTruthy()
  })
})
