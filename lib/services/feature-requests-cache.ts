import type { InfiniteData } from '@tanstack/react-query'

import type {
  FeatureRequest,
  FeatureRequestsResponse,
} from './feature-requests'

type FeatureRequestsInfiniteData = InfiniteData<
  FeatureRequestsResponse,
  number
>

export type FeatureRequestVoteState = Pick<
  FeatureRequest,
  'voteCount' | 'hasVoted'
>

export function findFeatureRequestVoteState(
  data: FeatureRequestsInfiniteData | undefined,
  id: number,
): FeatureRequestVoteState | undefined {
  for (const page of data?.pages ?? []) {
    const request = page.requests.find((item) => item.id === id)
    if (request) {
      return {
        voteCount: request.voteCount,
        hasVoted: request.hasVoted,
      }
    }
  }
}

export function patchFeatureRequestVote(
  data: FeatureRequestsInfiniteData | undefined,
  id: number,
  vote: FeatureRequestVoteState,
): FeatureRequestsInfiniteData | undefined {
  if (!data) return data

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      requests: page.requests.map((request) =>
        request.id === id ? { ...request, ...vote } : request,
      ),
    })),
  }
}
