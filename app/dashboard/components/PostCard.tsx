'use client'

import { useState } from 'react'
import {
  IconAlignLeft,
  IconBookmark,
  IconCheck,
  IconCopy,
  IconDots,
  IconEye,
  IconHeart,
  IconMessageCircle,
  IconPencil,
  IconRepeat,
  IconRosetteDiscountCheckFilled,
  IconShare3,
  type TablerIcon,
} from '@tabler/icons-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { GeneratedPost, XAccount } from '@/lib/services/posts'
import { updatePost } from '@/lib/services/posts-client'

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
}

function formatGeneratedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

type ActionProps = { icon: TablerIcon; value?: string }

function Action({ icon: Icon, value = '—' }: ActionProps) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="size-4" />
      <span className="text-xs tabular-nums">{value}</span>
    </span>
  )
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
}: {
  post: GeneratedPost
  xAccount: XAccount | null
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

    </Card>
  )
}
