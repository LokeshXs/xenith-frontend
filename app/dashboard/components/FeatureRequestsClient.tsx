'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { isAxiosError } from 'axios'
import { IconArrowUp, IconPlus, IconRefresh } from '@tabler/icons-react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { getErrorMessage } from '@/app/onboarding/utils/getErrorMessage'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import type {
  FeatureRequest,
  FeatureRequestsResponse,
} from '@/lib/services/feature-requests'
import {
  findFeatureRequestVoteState,
  patchFeatureRequestVote,
} from '@/lib/services/feature-requests-cache'
import {
  createFeatureRequest,
  fetchFeatureRequests,
  toggleFeatureRequestVote,
} from '@/lib/services/feature-requests-client'

const TITLE_MAX_LENGTH = 120
const DESCRIPTION_MAX_LENGTH = 2_000

const featureRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Enter a title')
    .max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or fewer`),
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description')
    .max(
      DESCRIPTION_MAX_LENGTH,
      `Description must be ${DESCRIPTION_MAX_LENGTH.toLocaleString()} characters or fewer`,
    ),
})

type FeatureRequestFields = z.infer<typeof featureRequestSchema>
type FieldErrors = Partial<Record<keyof FeatureRequestFields, string>>

const EMPTY_FIELDS: FeatureRequestFields = {
  title: '',
  description: '',
}

const QUERY_KEY = ['feature-requests'] as const
const REQUESTS_PER_PAGE = 20

export function FeatureRequestsClient() {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const queryClient = useQueryClient()
  const [pinnedRequests, setPinnedRequests] = useState<FeatureRequest[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [fields, setFields] = useState<FeatureRequestFields>(EMPTY_FIELDS)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchFeatureRequests(pageParam, REQUESTS_PER_PAGE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined,
  })

  const serverRequests = useMemo(() => {
    const seen = new Set<number>()
    const pinnedIds = new Set(pinnedRequests.map((request) => request.id))
    const requests: FeatureRequest[] = []

    for (const page of data?.pages ?? []) {
      for (const request of page.requests) {
        if (pinnedIds.has(request.id)) continue
        if (typeof request.id === 'number' && seen.has(request.id)) continue
        if (typeof request.id === 'number') seen.add(request.id)
        requests.push(request)
      }
    }

    return requests
  }, [data, pinnedRequests])

  const requests = useMemo(
    () => [...pinnedRequests, ...serverRequests],
    [pinnedRequests, serverRequests],
  )
  const totalCount =
    data?.pages[0]?.pagination.total ?? requests.length

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  function resetForm() {
    setFields(EMPTY_FIELDS)
    setFieldErrors({})
    setFormError(null)
  }

  function handleOpenChange(open: boolean) {
    if (!open && createRequest.isPending) return
    setDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const field = event.target.name as keyof FeatureRequestFields
    setFields((current) => ({ ...current, [field]: event.target.value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setFormError(null)
  }

  const createRequest = useMutation({
    mutationFn: createFeatureRequest,
    onSuccess: (request) => {
      setPinnedRequests((current) => [
        request,
        ...current.filter((item) => item.id !== request.id),
      ])
      queryClient.setQueryData(
        QUERY_KEY,
        (
          current:
            | InfiniteData<FeatureRequestsResponse, number>
            | undefined,
        ) => {
          if (!current?.pages[0]) return current
          return {
            ...current,
            pages: current.pages.map((page, index) =>
              index === 0
                ? {
                    ...page,
                    pagination: {
                      ...page.pagination,
                      total: page.pagination.total + 1,
                    },
                  }
                : page,
            ),
          }
        },
      )
      resetForm()
      setDialogOpen(false)
      toast.success('Feature request submitted')
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      const message =
        status === 400
          ? getErrorMessage(error, 'Check the title and description and try again.')
          : getErrorMessage(error, 'Failed to submit feature request')
      setFormError(message)
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (createRequest.isPending) return

    const result = featureRequestSchema.safeParse(fields)
    if (!result.success) {
      const errors: FieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FeatureRequestFields
        errors[field] ??= issue.message
      }
      setFieldErrors(errors)
      return
    }

    setFormError(null)
    createRequest.mutate(result.data)
  }

  const header = (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl font-semibold tracking-tight max-sm:text-xl">
              Feature Requests
            </h1>
            {!isLoading && (
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {totalCount}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            See what others have requested or suggest an improvement of your own.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button className="self-start" />}>
            <IconPlus data-icon="inline-start" />
            Request a feature
          </DialogTrigger>

          <DialogContent>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
              <DialogHeader>
                <DialogTitle>Request a feature</DialogTitle>
                <DialogDescription>
                  Tell us what would make Xenith more useful for you.
                </DialogDescription>
              </DialogHeader>

              <FieldGroup className="gap-5">
                <Field data-invalid={Boolean(fieldErrors.title)}>
                  <FieldLabel htmlFor="feature-title">Title</FieldLabel>
                  <Input
                    id="feature-title"
                    name="title"
                    placeholder="A short, clear feature name"
                    value={fields.title}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.title)}
                    maxLength={TITLE_MAX_LENGTH}
                    autoComplete="off"
                    disabled={createRequest.isPending}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <FieldError>{fieldErrors.title}</FieldError>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                      {fields.title.length}/{TITLE_MAX_LENGTH}
                    </span>
                  </div>
                </Field>

                <Field data-invalid={Boolean(fieldErrors.description)}>
                  <FieldLabel htmlFor="feature-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="feature-description"
                    name="description"
                    placeholder="Describe the problem this feature would solve"
                    value={fields.description}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.description)}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className="min-h-32"
                    disabled={createRequest.isPending}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <FieldError>{fieldErrors.description}</FieldError>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                      {fields.description.length}/
                      {DESCRIPTION_MAX_LENGTH.toLocaleString()}
                    </span>
                  </div>
                </Field>

                {formError && <FieldError>{formError}</FieldError>}
              </FieldGroup>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={createRequest.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createRequest.isPending}>
                  {createRequest.isPending ? 'Submitting…' : 'Submit request'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </header>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-4xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError && !data) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-destructive">
            {getErrorMessage(
              error,
              'Something went wrong loading feature requests. Please try again.',
            )}
          </p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <IconRefresh data-icon="inline-start" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      {requests.length > 0 ? (
        <div className="flex flex-col gap-4">
          {requests.map((request, index) => (
            <FeatureRequestCard
              key={request.id}
              request={request}
              index={index}
              onPinnedUpdated={
                pinnedRequests.some((item) => item.id === request.id)
                  ? (updated) =>
                      setPinnedRequests((current) =>
                        current.map((item) =>
                          item.id === updated.id ? updated : item,
                        ),
                      )
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className='p-12 border rounded-lg border-dashed'>
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="font-medium">No feature requests yet</p>
            <p className="text-sm text-muted-foreground">
              Be the first to suggest what Xenith should build next.
            </p>
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div ref={sentinelRef} className="flex flex-col gap-4">
          {isFetchingNextPage &&
            Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-4xl" />
            ))}
          {isFetchNextPageError && (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchNextPage()}
              >
                <IconRefresh data-icon="inline-start" />
                Try loading more
              </Button>
            </div>
          )}
          {!hasNextPage &&
            !isFetchingNextPage &&
            !isFetchNextPageError &&
            serverRequests.length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                You&rsquo;ve reached the end of the requests.
              </p>
            )}
        </div>
      )}
    </div>
  )
}

function FeatureRequestCard({
  request,
  index,
  onPinnedUpdated,
}: {
  request: FeatureRequest
  index: number
  onPinnedUpdated?: (request: FeatureRequest) => void
}) {
  const queryClient = useQueryClient()

  const vote = useMutation({
    mutationKey: ['feature-requests', 'vote', request.id],
    mutationFn: () => toggleFeatureRequestVote(request.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY })

      const data = queryClient.getQueryData<
        InfiniteData<FeatureRequestsResponse, number>
      >(QUERY_KEY)
      const previous = onPinnedUpdated
        ? {
            voteCount: request.voteCount,
            hasVoted: request.hasVoted,
          }
        : findFeatureRequestVoteState(data, request.id) ?? {
        voteCount: request.voteCount,
        hasVoted: request.hasVoted,
      }
      const optimistic = {
        voteCount: Math.max(
          0,
          previous.voteCount + (previous.hasVoted ? -1 : 1),
        ),
        hasVoted: !previous.hasVoted,
      }

      if (onPinnedUpdated) {
        onPinnedUpdated({ ...request, ...optimistic })
      }

      queryClient.setQueryData(QUERY_KEY, (current: typeof data) =>
        patchFeatureRequestVote(current, request.id, optimistic),
      )

      return { previous }
    },
    onSuccess: (result) => {
      const authoritative = {
        voteCount: result.voteCount,
        hasVoted: result.voted,
      }

      if (onPinnedUpdated) {
        onPinnedUpdated({ ...request, ...authoritative })
      }

      queryClient.setQueryData(
        QUERY_KEY,
        (
          current:
            | InfiniteData<FeatureRequestsResponse, number>
            | undefined,
        ) =>
          patchFeatureRequestVote(current, request.id, authoritative),
      )
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        if (onPinnedUpdated) {
          onPinnedUpdated({ ...request, ...context.previous })
        }
        queryClient.setQueryData(
          QUERY_KEY,
          (
            current:
              | InfiniteData<FeatureRequestsResponse, number>
              | undefined,
          ) =>
            patchFeatureRequestVote(
              current,
              request.id,
              context.previous,
            ),
        )
      }

      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status === 400) {
        toast.error('This feature request cannot be voted on')
      } else if (status === 404) {
        toast.error('This feature request no longer exists')
        queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      } else {
        toast.error(getErrorMessage(error, 'Failed to update your vote'))
      }
    },
  })

  return (
    <Card
      size="sm"
      className="animate-in fade-in-0 fill-mode-both duration-300 ease-out motion-safe:slide-in-from-bottom-1"
      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
    >
      <CardHeader>
        <CardTitle>{request.title}</CardTitle>
        <CardDescription className="leading-relaxed">
          {request.description}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          type="button"
          size="sm"
          variant={request.hasVoted ? 'secondary' : 'outline'}
          aria-pressed={request.hasVoted}
          aria-label={`${request.hasVoted ? 'Remove vote from' : 'Vote for'} ${request.title}`}
          disabled={vote.isPending}
          onClick={() => vote.mutate()}
        >
          <IconArrowUp data-icon="inline-start" />
          {request.hasVoted ? 'Voted' : 'Vote'}
          <span className="tabular-nums">{request.voteCount}</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
