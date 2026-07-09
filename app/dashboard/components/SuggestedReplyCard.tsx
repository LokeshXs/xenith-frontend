'use client'

import { useState } from 'react'
import { isAxiosError } from 'axios'
import {
  IconCheck,
  IconCopy,
  IconDots,
  IconExternalLink,
  IconEye,
  IconHeart,
  IconMessageCircle,
  IconPencil,
  IconRepeat,
  type TablerIcon,
} from '@tabler/icons-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/app/onboarding/utils/getErrorMessage'
import type { XAccount } from '@/lib/services/posts'
import type { SuggestedReply } from '@/lib/services/suggested-replies'
import {
  blockAccountFromReply,
  updateSuggestedReply,
} from '@/lib/services/suggested-replies-client'

const REPLY_MAX_LENGTH = 280

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

// 25532 -> "25.5K", 427328 -> "427.3K"
function formatCompact(value: number | undefined): string {
  if (value == null) return '0'
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

// Time for today's tweets, "Jun 6" for older ones; '' when missing/invalid.
function formatSourceTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Metric({ icon: Icon, value }: { icon: TablerIcon; value?: number }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="size-4" />
      <span className="text-xs tabular-nums">{formatCompact(value)}</span>
    </span>
  )
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="shrink-0 text-muted-foreground transition-[color,transform] hover:text-foreground active:scale-[0.97]"
    >
      {children}
    </button>
  )
}

export function SuggestedReplyCard({
  reply,
  xAccount,
  onUpdated,
}: {
  reply: SuggestedReply
  xAccount: XAccount | null
  onUpdated: (reply: SuggestedReply) => void
}) {
  const authorName =
    reply.source_author_name ??
    (reply.source_author_username
      ? `@${reply.source_author_username}`
      : 'Unknown author')
  const authorInitials = initialsFrom(reply.source_author_name ?? authorName)
  const sourceTime = formatSourceTime(reply.source_created_at)
  const metrics = reply.source_metrics

  const replyAsName = xAccount?.name ?? 'Your X account'
  const replyAsHandle = xAccount?.username ? `@${xAccount.username}` : 'you'

  // Currently displayed (saved) reply — kept in state so the card reflects
  // edits without the parent needing to refetch.
  const [text, setText] = useState(reply.suggested_reply)
  const [edited, setEdited] = useState(reply.edited)

  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(reply.suggested_reply)
  const [isSaving, setIsSaving] = useState(false)

  // Block-account confirmation lifecycle.
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)

  const draftTooLong = draft.length > REPLY_MAX_LENGTH

  const copyReply = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Reply copied')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy')
    }
  }

  const startEditing = () => {
    setDraft(text)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const next = draft.trim()
    if (!next) {
      toast.error('Reply must not be empty')
      return
    }
    if (next.length > REPLY_MAX_LENGTH) {
      toast.error(`Reply must be ${REPLY_MAX_LENGTH} characters or fewer`)
      return
    }

    // Optimistically reflect the edit in the card, remembering the prior values
    // so we can roll back if the PATCH fails (e.g. 400/404).
    const prevText = text
    const prevEdited = edited
    setText(next)
    setEdited(true)
    setIsEditing(false)
    setIsSaving(true)

    try {
      const updated = await updateSuggestedReply(reply.id, next)
      // Sync with the server's authoritative copy.
      setText(updated.suggested_reply)
      setEdited(updated.edited)
      onUpdated(updated)
      toast.success('Reply updated')
    } catch (error) {
      // 401 is handled globally by the apiClient interceptor.
      console.error('Failed to update reply:', error)
      // Roll back the optimistic update and reopen the editor with the draft so
      // the user can fix it and retry.
      setText(prevText)
      setEdited(prevEdited)
      setDraft(next)
      setIsEditing(true)
      toast.error(getErrorMessage(error, 'Failed to update reply'))
    } finally {
      setIsSaving(false)
    }
  }

  // Block the author of this suggestion so they won't surface in future runs.
  // The card is intentionally kept visible after blocking (it drops off on the
  // next generation run); 401 is handled globally by the apiClient interceptor.
  const handleBlock = async () => {
    setIsBlocking(true)
    try {
      await blockAccountFromReply(reply.id)
      setConfirmBlockOpen(false)
      toast.success(
        reply.source_author_username
          ? `Blocked @${reply.source_author_username}`
          : 'Account blocked',
      )
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined
      if (code === 404) {
        toast.error('This reply no longer exists')
      } else if (code === 422) {
        toast.error('This suggestion has no account to block')
      } else {
        console.error('Failed to block account:', error)
        toast.error(getErrorMessage(error, 'Failed to block account'))
      }
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <Card size="sm" className="gap-0 shadow-sm">
      <div className="flex flex-col px-4">
        {/* ── Source tweet ── */}
        <div className="flex gap-3">
          {/* Avatar column: avatar + thread line down to the reply row */}
          <div className="flex w-9 shrink-0 flex-col items-center">
            <Avatar className="size-9 rounded-full">
              {reply.source_author_avatar && (
                <AvatarImage src={reply.source_author_avatar} alt={authorName} />
              )}
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
            <div className="mt-1.5 w-px flex-1 bg-border" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4">
            <div className="flex items-center gap-1 text-sm">
              <span className="truncate font-semibold">{authorName}</span>
              {reply.source_author_name && reply.source_author_username && (
                <span className="truncate text-muted-foreground">
                  @{reply.source_author_username}
                </span>
              )}
              {sourceTime && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="shrink-0 text-muted-foreground">
                    {sourceTime}
                  </span>
                </>
              )}
              <div className="ml-auto flex shrink-0 items-center gap-1">
                <a
                  href={`https://x.com/i/status/${reply.source_tweet_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open post on X"
                  title="Open post on X"
                  className="text-muted-foreground transition-[color,transform] hover:text-foreground active:scale-[0.97]"
                >
                  <IconExternalLink className="size-4" />
                </a>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label="More actions"
                        title="More actions"
                        className="text-muted-foreground transition-[color,transform] hover:text-foreground active:scale-[0.97]"
                      >
                        <IconDots className="size-4" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="min-w-40">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setConfirmBlockOpen(true)}
                    >
                      Block account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <p className="max-h-56 overflow-y-auto pr-2 text-sm whitespace-pre-wrap break-words overscroll-contain">
              {reply.source_text}
            </p>

            {metrics && (
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Metric icon={IconMessageCircle} value={metrics.reply_count} />
                <Metric icon={IconRepeat} value={metrics.retweet_count} />
                <Metric icon={IconHeart} value={metrics.like_count} />
                <Metric icon={IconEye} value={metrics.impression_count} />
              </div>
            )}
          </div>
        </div>

        {/* ── Suggested reply ── */}
        <div className="flex gap-3">
          <div className="flex w-9 shrink-0 justify-center pt-0.5">
            <Avatar className="size-7 rounded-full">
              {xAccount?.avatar && (
                <AvatarImage src={xAccount.avatar} alt={replyAsName} />
              )}
              <AvatarFallback className="text-xs">
                {initialsFrom(replyAsName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <p className="min-w-0 truncate text-xs text-muted-foreground">
                Replying as{' '}
                <span className="font-medium text-foreground">
                  {replyAsHandle}
                </span>
              </p>
              {edited && (
                <Badge variant="secondary" className="shrink-0">
                  Edited
                </Badge>
              )}
              {!isEditing && (
                <div className="ml-auto flex shrink-0 items-center gap-3">
                  <IconAction label="Edit reply" onClick={startEditing}>
                    <IconPencil className="size-4" />
                  </IconAction>
                  <IconAction label="Copy reply" onClick={copyReply}>
                    {copied ? (
                      <IconCheck className="size-4 text-emerald-500" />
                    ) : (
                      <IconCopy className="size-4" />
                    )}
                  </IconAction>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  autoFocus
                  disabled={isSaving}
                  aria-label="Edit suggested reply"
                />
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs tabular-nums ${
                      draftTooLong ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {draft.length}/{REPLY_MAX_LENGTH}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || !draft.trim() || draftTooLong}
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="max-h-36 overflow-y-auto pr-2 text-sm whitespace-pre-wrap break-words overscroll-contain">
                {text}
              </p>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={confirmBlockOpen} onOpenChange={setConfirmBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this account?</AlertDialogTitle>
            <AlertDialogDescription>
              {reply.source_author_username
                ? `@${reply.source_author_username} won't appear in future suggested replies.`
                : "This account won't appear in future suggested replies."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmBlockOpen(false)}
              disabled={isBlocking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={isBlocking}
            >
              {isBlocking ? 'Blocking…' : 'Block'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
