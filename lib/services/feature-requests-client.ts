import { apiClient } from '../api'
import type {
  CreateFeatureRequestInput,
  CreateFeatureRequestResponse,
  FeatureRequest,
  FeatureRequestsResponse,
  FeatureRequestVoteResponse,
} from './feature-requests'

// GET /api/v1/feature-requests — ranked by vote count, then newest first.
export async function fetchFeatureRequests(
  page = 1,
  limit = 20,
): Promise<FeatureRequestsResponse> {
  const { data } = await apiClient.get<FeatureRequestsResponse>(
    '/feature-requests',
    { params: { page, limit } },
  )
  return data
}

// POST /api/v1/feature-requests — creates a persisted request.
export async function createFeatureRequest(
  input: CreateFeatureRequestInput,
): Promise<FeatureRequest> {
  const { data } = await apiClient.post<CreateFeatureRequestResponse>(
    '/feature-requests',
    input,
  )
  return data.request
}

// POST /api/v1/feature-requests/:id/vote — toggles the current user's vote.
export async function toggleFeatureRequestVote(
  id: number,
): Promise<FeatureRequestVoteResponse> {
  const { data } = await apiClient.post<FeatureRequestVoteResponse>(
    `/feature-requests/${id}/vote`,
  )
  return data
}
