import axios from 'axios'
import type {
  CreateTrialRequestInput,
  CreateTrialRequestResponse,
} from './trial-requests'

const publicApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

export async function createTrialRequest(
  input: CreateTrialRequestInput,
): Promise<CreateTrialRequestResponse['request']> {
  const { data } = await publicApi.post<CreateTrialRequestResponse>(
    '/trial-requests',
    input,
  )
  return data.request
}
