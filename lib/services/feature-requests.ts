export type FeatureRequest = {
  id: number
  title: string
  description: string
  created_at: string
  updated_at: string
  voteCount: number
  hasVoted: boolean
}

export type FeatureRequestsResponse = {
  requests: FeatureRequest[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export type FeatureRequestVoteResponse = {
  voted: boolean
  voteCount: number
}

export type CreateFeatureRequestInput = {
  title: string
  description: string
}

export type CreateFeatureRequestResponse = {
  request: FeatureRequest
}
