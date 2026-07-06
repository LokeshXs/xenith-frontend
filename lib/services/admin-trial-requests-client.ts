import { apiClient } from '../api'
import type {
  AdminTrialRequest,
  AdminTrialRequestStatusFilter,
  AdminTrialRequestsResponse,
  UpdateAdminTrialRequestInput,
  UpdateAdminTrialRequestResponse,
} from './trial-requests'

export async function fetchAdminTrialRequests(input: {
  status?: AdminTrialRequestStatusFilter
  page?: number
  limit?: number
}): Promise<AdminTrialRequestsResponse> {
  const { data } = await apiClient.get<AdminTrialRequestsResponse>(
    '/admin/trial-requests',
    { params: input },
  )
  return data
}

export async function updateAdminTrialRequest(
  id: string,
  input: UpdateAdminTrialRequestInput,
): Promise<AdminTrialRequest> {
  const { data } = await apiClient.patch<UpdateAdminTrialRequestResponse>(
    `/admin/trial-requests/${id}`,
    input,
  )
  return data.request
}
