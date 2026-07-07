'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import { isAxiosError } from 'axios'
import {
  IconExternalLink,
  IconLoader2,
  IconRefresh,
  IconShieldLock,
} from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getErrorMessage } from '@/app/onboarding/utils/getErrorMessage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchAdminTrialRequests,
  updateAdminTrialRequest,
} from '@/lib/services/admin-trial-requests-client'
import type {
  AdminTrialRequest,
  AdminTrialRequestStatusFilter,
  TrialRequestStatus,
} from '@/lib/services/trial-requests'

const REQUESTS_PER_PAGE = 20
const STATUS_OPTIONS: Array<{ label: string; value: AdminTrialRequestStatusFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]
const REVIEW_STATUS_OPTIONS: Array<{ label: string; value: TrialRequestStatus }> = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

type ReviewFields = {
  status: TrialRequestStatus
  reviewNote: string
}

function formatDate(value: string | null): string {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatFollowerCount(value: number | null): string {
  if (value === null) return 'Not provided'
  return new Intl.NumberFormat('en').format(value)
}

function profileLabel(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname}${parsed.pathname}`.replace(/^www\./, '')
  } catch {
    return 'View profile'
  }
}

function statusBadge(status: TrialRequestStatus) {
  if (status === 'approved') {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        Approved
      </Badge>
    )
  }

  if (status === 'rejected') {
    return <Badge variant="destructive">Rejected</Badge>
  }

  return <Badge variant="secondary">Pending</Badge>
}

function accessDenied() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-5 bg-background p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <IconShieldLock className="size-6" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin access required</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          You are signed in, but this account is not allowed to review trial requests.
        </p>
      </div>
      <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
        Back to dashboard
      </Button>
    </div>
  )
}

function AdminTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="p-4">
        <Skeleton className="h-9 w-48" />
      </div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[1.4fr_1fr_1fr_1.5fr_0.8fr_0.8fr_0.7fr] gap-4 border-t p-4">
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <Skeleton key={cellIndex} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function AdminTrialRequestsClient() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AdminTrialRequestStatusFilter>('pending')
  const [page, setPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<AdminTrialRequest | null>(null)
  const [reviewFields, setReviewFields] = useState<ReviewFields>({
    status: 'pending',
    reviewNote: '',
  })

  const queryKey = useMemo(
    () => ['admin-trial-requests', status, page, REQUESTS_PER_PAGE] as const,
    [page, status],
  )

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminTrialRequests({
        status,
        page,
        limit: REQUESTS_PER_PAGE,
      }),
  })

  const updateRequest = useMutation({
    mutationFn: ({
      id,
      status: nextStatus,
    }: {
      id: string
      status: TrialRequestStatus
    }) =>
      updateAdminTrialRequest(id, {
        status: nextStatus,
        reviewNote: reviewFields.reviewNote.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Trial request updated')
      setSelectedRequest(null)
      queryClient.invalidateQueries({ queryKey: ['admin-trial-requests'] })
    },
    onError: (mutationError) => {
      const statusCode = isAxiosError(mutationError)
        ? mutationError.response?.status
        : undefined
      if (statusCode === 403) {
        toast.error('You do not have access to admin trial requests.')
        return
      }
      if (statusCode === 404) {
        toast.error('This request no longer exists.')
        return
      }
      if (statusCode === 409) {
        toast.error('This email already has an approved trial request.')
        return
      }
      toast.error(getErrorMessage(mutationError, 'Could not update trial request.'))
    },
  })

  function openReview(request: AdminTrialRequest) {
    setReviewFields({
      status: request.status,
      reviewNote: request.reviewNote ?? '',
    })
    setSelectedRequest(request)
  }

  const statusCode = isAxiosError(error) ? error.response?.status : undefined
  if (statusCode === 403) return accessDenied()

  const total = data?.pagination.total ?? 0
  const requests = data?.requests ?? []

  function handleStatusFilterChange(value: string | null) {
    const nextStatus = (value ?? 'pending') as AdminTrialRequestStatusFilter
    setStatus(nextStatus)
    setPage(1)
  }

  function handleReviewFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.target.name as keyof ReviewFields
    setReviewFields((current) => ({ ...current, [field]: event.target.value }))
  }

  function saveWithStatus(nextStatus: TrialRequestStatus) {
    if (!selectedRequest || updateRequest.isPending) return
    updateRequest.mutate({ id: selectedRequest.id, status: nextStatus })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 bg-background p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trial requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review creator trial applications from verified X creators.
          </p>
          {!isLoading && (
            <p className="mt-2 text-sm tabular-nums text-muted-foreground">
              {total.toLocaleString()} {total === 1 ? 'request' : 'requests'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={status} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? (
              <IconLoader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <IconRefresh data-icon="inline-start" />
            )}
            Refresh
          </Button>
        </div>
      </header>

      {isLoading ? (
        <AdminTableSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm text-destructive">
            {getErrorMessage(error, 'Could not load trial requests.')}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <IconRefresh data-icon="inline-start" />
            Try again
          </Button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-12 text-center">
          <p className="font-medium">No trial requests found</p>
          <p className="text-sm text-muted-foreground">
            New creator trial requests will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-52">Creator</TableHead>
                  <TableHead className="min-w-40">X profile</TableHead>
                  <TableHead className="min-w-40">Audience</TableHead>
                  <TableHead className="min-w-64">Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="min-w-32">Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="min-w-52">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{request.name}</span>
                        <span className="text-xs text-muted-foreground">{request.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-40">
                      <a
                        href={request.socialProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-44 items-center gap-1 truncate rounded outline-none text-sm font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        <span className="truncate">{profileLabel(request.socialProfileUrl)}</span>
                        <IconExternalLink className="size-3.5 shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell className="min-w-40">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm tabular-nums">
                          {formatFollowerCount(request.followerCount)}
                        </span>
                        {request.isVerified ? (
                          <Badge className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not verified</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-64 max-w-72">
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {request.message || 'No message'}
                      </p>
                    </TableCell>
                    <TableCell>{statusBadge(request.status)}</TableCell>
                    <TableCell className="min-w-32 text-sm text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openReview(request)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {data && data.pagination.totalPages > 0 && (
        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {Math.max(data.pagination.totalPages, 1)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((current) => current + 1)}
              disabled={!data.pagination.hasMore || isFetching}
            >
              Next
            </Button>
          </div>
        </footer>
      )}

      <Sheet
        open={Boolean(selectedRequest)}
        onOpenChange={(open) => {
          if (updateRequest.isPending) return
          if (!open) setSelectedRequest(null)
        }}
      >
        <SheetContent
          side="right"
          className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          {selectedRequest && (
            <>
              <SheetHeader>
                <SheetTitle>Review trial request</SheetTitle>
                <SheetDescription>
                  {selectedRequest.name} - {selectedRequest.email}
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-6 px-6 pb-6">
                <section className="grid gap-3 rounded-2xl border bg-muted/20 p-4 text-sm">
                  <DetailRow label="Name" value={selectedRequest.name} />
                  <DetailRow label="Email" value={selectedRequest.email} />
                  <DetailRow
                    label="X profile"
                    value={
                      <a
                        href={selectedRequest.socialProfileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {profileLabel(selectedRequest.socialProfileUrl)}
                        <IconExternalLink className="size-3.5" />
                      </a>
                    }
                  />
                  <DetailRow
                    label="Followers"
                    value={formatFollowerCount(selectedRequest.followerCount)}
                  />
                  <DetailRow
                    label="Verified claim"
                    value={selectedRequest.isVerified ? 'Verified' : 'Not verified'}
                  />
                  <DetailRow
                    label="Submitted"
                    value={formatDate(selectedRequest.createdAt)}
                  />
                  <DetailRow
                    label="Approval email sent"
                    value={formatDate(selectedRequest.approvalEmailSentAt)}
                  />
                  <DetailRow
                    label="Trial checkout started"
                    value={formatDate(selectedRequest.trialCheckoutStartedAt)}
                  />
                </section>

                <section className="flex flex-col gap-2">
                  <h2 className="text-sm font-medium">Message</h2>
                  <p className="rounded-2xl border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
                    {selectedRequest.message || 'No message provided.'}
                  </p>
                </section>

                <FieldGroup className="gap-4">
                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <Select
                      value={reviewFields.status}
                      onValueChange={(value) =>
                        setReviewFields((current) => ({
                          ...current,
                          status: (value ?? 'pending') as TrialRequestStatus,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REVIEW_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="review-note">Review note</FieldLabel>
                    <Textarea
                      id="review-note"
                      name="reviewNote"
                      placeholder="Internal note for this request"
                      value={reviewFields.reviewNote}
                      onChange={handleReviewFieldChange}
                      disabled={updateRequest.isPending}
                      className="min-h-28"
                    />
                  </Field>

                  {updateRequest.isError && (
                    <FieldError>
                      {getErrorMessage(updateRequest.error, 'Could not update trial request.')}
                    </FieldError>
                  )}
                </FieldGroup>
              </div>

              <SheetFooter className="border-t">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    variant="outline"
                    onClick={() => saveWithStatus(reviewFields.status)}
                    disabled={updateRequest.isPending}
                  >
                    {updateRequest.isPending ? 'Saving...' : 'Save changes'}
                  </Button>
                  <Button
                    onClick={() => saveWithStatus('approved')}
                    disabled={updateRequest.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => saveWithStatus('rejected')}
                    disabled={updateRequest.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}
