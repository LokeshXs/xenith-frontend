'use client'

import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import {
  IconAlertTriangle,
  IconCalendar,
  IconCheck,
  IconClock,
  IconCopy,
  IconDots,
  IconExternalLink,
  IconPencil,
  IconRosetteDiscountCheckFilled,
  IconSparkles,
} from '@tabler/icons-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { TIME_SLOTS, formatTime12 } from '@/components/ui/time-picker'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { GeneratedPost, XAccount } from '@/lib/services/posts'
import { EngagementBadge } from './EngagementBadge'
import {
  publishPost,
  schedulePost,
  unschedulePost,
  updatePost,
} from '@/lib/services/posts-client'
import { getTwitterAuthUrl } from '@/lib/services/twitter'
import { cn } from '@/lib/utils'

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

// "Jun 10, 9:00 AM" — the time a scheduled post will go out, in local tz.
function formatScheduledAt(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Public URL for a posted tweet; falls back to the id-only deep link when we
// don't know the account's @handle.
function tweetUrl(tweetId: string, username?: string): string {
  return username
    ? `https://x.com/${username}/status/${tweetId}`
    : `https://x.com/i/web/status/${tweetId}`
}

function CopyButton({
  copied,
  onClick,
  label,
}: {
  copied: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <IconCheck className="size-4 text-emerald-500" />
      ) : (
        <IconCopy className="size-4" />
      )}
    </button>
  )
}

export function PostCard({
  post,
  xAccount,
  isTopPick = false,
}: {
  post: GeneratedPost
  xAccount: XAccount | null
  // Highlights the highest-scoring post in a batch. Advisory only — never gates
  // any action.
  isTopPick?: boolean
}) {
  const name = xAccount?.name ?? 'Your X account'
  const initials = initialsFrom(name)

  const [copiedContent, setCopiedContent] = useState(false)
  const [copiedHashtags, setCopiedHashtags] = useState(false)

  // Currently displayed (saved) values — kept in state so the card reflects
  // edits without the parent needing to refetch.
  const [content, setContent] = useState(post.content)
  const [hashtags, setHashtags] = useState<string[]>(post.hashtags)

  // Edit-mode state.
  const [isEditing, setIsEditing] = useState(false)
  const [draftContent, setDraftContent] = useState(post.content)
  const [draftHashtags, setDraftHashtags] = useState(post.hashtags.join(' '))
  const [isSaving, setIsSaving] = useState(false)

  // Publish/schedule lifecycle — kept in state so the card reflects the new
  // status in place without the parent needing to refetch.
  const [status, setStatus] = useState(post.status)
  const [tweetId, setTweetId] = useState(post.tweet_id)
  const [scheduledAt, setScheduledAt] = useState(post.scheduled_at)
  const [publishError, setPublishError] = useState(post.publish_error)

  const [isPublishing, setIsPublishing] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isUnscheduling, setIsUnscheduling] = useState(false)

  // Schedule dialog + picked date/time (time as "HH:MM").
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined)
  const [pickedTime, setPickedTime] = useState('09:00')
  const selectedSlotRef = useRef<HTMLButtonElement>(null)

  const busy = isPublishing || isScheduling || isUnscheduling
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Default the calendar to today when the dialog opens with nothing picked, so
  // the user lands on a usable state matching the footer's date display.
  const handleScheduleOpenChange = (open: boolean) => {
    if (open && !pickedDate) setPickedDate(new Date())
    setScheduleOpen(open)
  }

  // When the picked day is today, only offer slots at least 30 min out: this
  // skips the immediately-next slot (e.g. at 3:27 we disable 3:30 and start
  // selection from 4:00) so the user always has lead time before delivery.
  const pickedIsToday =
    !!pickedDate && pickedDate.toDateString() === new Date().toDateString()
  const isSlotPast = (slot: string) => {
    if (!pickedIsToday) return false
    const now = new Date()
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const [h, m] = slot.split(':').map(Number)
    return h * 60 + m <= nowMinutes + 30
  }

  // Center the selected time in the list whenever the dialog opens.
  useEffect(() => {
    if (!scheduleOpen) return
    const raf = requestAnimationFrame(() =>
      selectedSlotRef.current?.scrollIntoView({ block: 'center' }),
    )
    return () => cancelAnimationFrame(raf)
  }, [scheduleOpen])

  // On a 403 the X connection lacks the tweet.write scope; route the user
  // back through the connect flow, returning them to this page afterwards.
  const reconnectForPosting = async () => {
    toast.error('Reconnect X to enable posting')
    try {
      const url = await getTwitterAuthUrl(window.location.pathname)
      window.location.href = url
    } catch (error) {
      console.error('Failed to start X reconnect:', error)
      toast.error('Could not start X reconnect. Please try again.')
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const updated = await publishPost(post.id)
      setStatus(updated.status)
      setTweetId(updated.tweet_id)
      setPublishError(updated.publish_error)
      toast.success('Post published')
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined
      if (code === 403) {
        await reconnectForPosting()
        return
      }
      if (code === 400) {
        toast.error('Connect your X account to publish')
      } else if (code === 502) {
        const data = isAxiosError(error) ? error.response?.data : undefined
        const message =
          (data?.publish_error as string | undefined) ??
          (data?.post?.publish_error as string | undefined) ??
          'X rejected this post'
        setStatus('failed')
        setPublishError(message)
        toast.error(message)
      } else {
        console.error('Failed to publish post:', error)
        toast.error('Failed to publish post. Please try again.')
      }
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSchedule = async () => {
    if (!pickedDate) {
      toast.error('Pick a date')
      return
    }
    const [hours, minutes] = pickedTime.split(':').map(Number)
    const when = new Date(pickedDate)
    when.setHours(hours || 0, minutes || 0, 0, 0)
    if (when.getTime() <= Date.now()) {
      toast.error('Pick a time in the future')
      return
    }

    setIsScheduling(true)
    try {
      const updated = await schedulePost(post.id, when.toISOString())
      setStatus(updated.status)
      setScheduledAt(updated.scheduled_at)
      setScheduleOpen(false)
      toast.success('Post scheduled')
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined
      if (code === 403) {
        await reconnectForPosting()
        return
      }
      if (code === 409) {
        toast.error('This post is already published')
      } else if (code === 400) {
        toast.error('Pick a valid future time')
      } else {
        console.error('Failed to schedule post:', error)
        toast.error('Failed to schedule post. Please try again.')
      }
    } finally {
      setIsScheduling(false)
    }
  }

  const handleUnschedule = async () => {
    setIsUnscheduling(true)
    try {
      const updated = await unschedulePost(post.id)
      setStatus(updated.status)
      setScheduledAt(updated.scheduled_at)
      toast.success('Schedule cancelled')
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined
      if (code === 409) {
        toast.error('This post is not scheduled')
      } else {
        console.error('Failed to cancel schedule:', error)
        toast.error('Failed to cancel schedule. Please try again.')
      }
    } finally {
      setIsUnscheduling(false)
    }
  }

  const copyToClipboard = async (
    text: string,
    setFlag: (v: boolean) => void,
    successMessage: string,
  ) => {
    try {
      await navigator.clipboard.writeText(text)
      setFlag(true)
      toast.success(successMessage)
      setTimeout(() => setFlag(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy')
    }
  }

  const startEditing = () => {
    setDraftContent(content)
    setDraftHashtags(hashtags.join(' '))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const handleSave = async () => {
    const nextContent = draftContent.trim()
    const nextHashtags = draftHashtags
      .split(/\s+/)
      .map((tag) => tag.trim())
      .filter(Boolean)

    if (!nextContent) {
      toast.error('Content must not be empty')
      return
    }

    // Optimistically reflect the edit in the card.
    setContent(nextContent)
    setHashtags(nextHashtags)
    setIsEditing(false)
    setIsSaving(true)

    try {
      const updated = await updatePost(post.id, {
        content: nextContent,
        hashtags: nextHashtags,
      })
      // Sync with the server's authoritative copy.
      setContent(updated.content)
      setHashtags(updated.hashtags)
      toast.success('Post updated')
    } catch (error) {
      console.error('Failed to update post:', error)
      toast.error('Failed to update post')
    } finally {
      setIsSaving(false)
    }
  }

  const hashtagsText = hashtags.join(' ')

  // The backend doesn't re-score on save, so once the content diverges from the
  // generated draft the score is stale — mark it rather than imply it's fresh.
  const scoreStale = content !== post.content

  return (
    <Card size="sm" className="mb-4 break-inside-avoid gap-3 shadow-sm">
      <div className="flex flex-col gap-3 px-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Avatar className="size-9 rounded-full">
            {xAccount?.avatar && <AvatarImage src={xAccount.avatar} alt={name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 items-center gap-1 text-sm">
            <span className="truncate font-semibold">{name}</span>
            <IconRosetteDiscountCheckFilled className="size-4 shrink-0 text-sky-500" />
            {xAccount?.username && (
              <span className="truncate text-muted-foreground">@{xAccount.username}</span>
            )}

          </div>
          {isTopPick && post.engagement_score !== null && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] leading-none font-semibold text-primary">
              <IconSparkles className="size-3" />
              Top pick
            </span>
          )}
          <EngagementBadge
            score={post.engagement_score}
            signals={post.engagement_signals}
            stale={scoreStale}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More actions"
              disabled={isEditing}
              className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <IconDots className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={startEditing}>
                <IconPencil className="size-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isEditing ? (
          /* Edit mode */
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`post-content-${post.id}`}>Content</Label>
              <Textarea
                id={`post-content-${post.id}`}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                rows={5}
                disabled={isSaving}
                
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`post-hashtags-${post.id}`}>Hashtags</Label>
              <Input
                id={`post-hashtags-${post.id}`}
                value={draftHashtags}
                onChange={(e) => setDraftHashtags(e.target.value)}
                placeholder="#ai #saas"
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-end">
                <CopyButton
                  copied={copiedContent}
                  label="Copy content"
                  onClick={() =>
                    copyToClipboard(content, setCopiedContent, 'Content copied')
                  }
                />
              </div>
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-end">
                  <CopyButton
                    copied={copiedHashtags}
                    label="Copy hashtags"
                    onClick={() =>
                      copyToClipboard(
                        hashtagsText,
                        setCopiedHashtags,
                        'Hashtags copied',
                      )
                    }
                  />
                </div>
                <p className="text-sm text-sky-500">{hashtagsText}</p>
              </div>
            )}
          </>
        )}

        {/* Meta label */}
        {(post.post_type || post.topic) && (
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {[post.post_type, post.topic].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Footer action bar — status-driven */}
      <div className="border-t px-4 pt-3">
        {(status === 'pending' || status === 'approved') && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={busy || isEditing}
            >
              {isPublishing ? 'Publishing…' : 'Publish now'}
            </Button>
            <Dialog open={scheduleOpen} onOpenChange={handleScheduleOpenChange}>
              <DialogTrigger
                render={<Button variant="outline" size="sm" />}
                disabled={busy || isEditing}
              >
                <IconCalendar className="size-4" />
                Schedule
              </DialogTrigger>
              <DialogContent className="w-auto max-w-[calc(100%-2rem)] gap-0 p-0">
                <DialogTitle className="sr-only">Schedule post</DialogTitle>
                <div className="flex flex-col sm:flex-row">
                  {/* Date */}
                  <div className="flex justify-center border-b p-2 sm:border-b-0 sm:border-r">
                    <Calendar
                      mode="single"
                      selected={pickedDate}
                      onSelect={setPickedDate}
                      disabled={{ before: startOfToday }}
                      weekStartsOn={1}
                      autoFocus
                    />
                  </div>

                  {/* Available times */}
                  <div className="flex w-full flex-col gap-2 p-3 sm:w-52">
                    <p className="px-1 text-sm font-medium">Available times</p>
                    <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto pr-0.5 sm:max-h-72">
                      {TIME_SLOTS.map((slot) => {
                        const selected = slot === pickedTime
                        const past = isSlotPast(slot)
                        return (
                          <button
                            key={slot}
                            type="button"
                            ref={selected ? selectedSlotRef : undefined}
                            aria-pressed={selected}
                            disabled={past}
                            onClick={() => setPickedTime(slot)}
                            className={cn(
                              'flex items-center justify-center rounded-2xl border px-3 py-2 text-sm transition-colors',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                              'disabled:cursor-not-allowed disabled:opacity-40',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-background text-foreground hover:bg-muted',
                            )}
                          >
                            {formatTime12(slot)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-2 border-t p-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-2xl border border-border bg-background px-3 py-2 text-sm">
                      {pickedDate
                        ? pickedDate.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Select a date'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPickedDate(new Date())}
                    >
                      Today
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <DialogClose render={<Button variant="ghost" size="sm" />}>
                      Cancel
                    </DialogClose>
                    <Button
                      size="sm"
                      onClick={handleSchedule}
                      disabled={isScheduling || !pickedDate}
                    >
                      {isScheduling ? 'Scheduling…' : 'Apply'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {status === 'scheduled' && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <IconClock className="size-4 shrink-0" />
              <span className="truncate">
                Scheduled for {formatScheduledAt(scheduledAt)}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={handleUnschedule}
              disabled={busy}
            >
              {isUnscheduling ? 'Cancelling…' : 'Cancel'}
            </Button>
          </div>
        )}

        {status === 'posted' && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <IconCheck className="size-4" />
              Posted
            </span>
            {tweetId && (
              <a
                href={tweetUrl(tweetId, xAccount?.username)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-sky-500 transition-colors hover:text-sky-600"
              >
                View on X
                <IconExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        )}

        {status === 'failed' && (
          <div className="flex flex-col gap-2">
            <span className="flex items-start gap-1.5 text-xs text-destructive">
              <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
              {publishError || 'Publishing failed.'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={busy || isEditing}
              >
                {isPublishing ? 'Retrying…' : 'Retry'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditing}
                disabled={busy || isEditing}
              >
                <IconPencil className="size-4" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
