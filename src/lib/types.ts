export type IdeaStatus = 'Planned' | 'In Progress' | 'Done'

export interface Idea {
  id: string
  title: string
  description: string
  status: IdeaStatus
  vote_count: number
  comment_count: number
  author_id: string
  author_email: string | null
  created_at: string
}
