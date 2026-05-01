export type IdeaStatus = 'Planned' | 'In Progress' | 'Done'

export interface Comment {
  id: string
  idea_id: string
  user_id: string
  author_email: string
  content: string
  created_at: string
}

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
