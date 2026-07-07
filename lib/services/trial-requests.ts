export type CreateTrialRequestInput = {
  name: string
  email: string
  platform: 'x'
  socialProfileUrl: string
  followerCount?: number
  isVerified: boolean
  message?: string
  website?: string
}

export type CreateTrialRequestResponse = {
  request: {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
  }
  duplicate?: boolean
}

export type TrialRequestStatus = 'pending' | 'approved' | 'rejected'

export type AdminTrialRequest = {
  id: string
  name: string
  email: string
  platform: string
  socialProfileUrl: string
  followerCount: number | null
  isVerified: boolean
  message: string | null
  status: TrialRequestStatus
  reviewNote: string | null
  reviewedByEmail: string | null
  reviewedAt: string | null
  approvalEmailSentAt: string | null
  trialCheckoutStartedAt: string | null
  trialCheckoutSessionId: string | null
  createdAt: string
  updatedAt: string
}

export type AdminTrialRequestsResponse = {
  requests: AdminTrialRequest[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export type AdminTrialRequestStatusFilter = TrialRequestStatus | 'all'

export type UpdateAdminTrialRequestInput = {
  status: TrialRequestStatus
  reviewNote?: string | null
}

export type UpdateAdminTrialRequestResponse = {
  request: AdminTrialRequest
}
