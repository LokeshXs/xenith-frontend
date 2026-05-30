'use client'

import {
  IconBookmark,
  IconDots,
  IconEye,
  IconHeart,
  IconMessageCircle,
  IconRepeat,
  IconRosetteDiscountCheckFilled,
  IconShare3,
  type TablerIcon,
} from '@tabler/icons-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import type { GeneratedPost, XAccount } from '@/lib/services/posts'

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

export function PostCard({
  post,
  xAccount,
}: {
  post: GeneratedPost
  xAccount: XAccount | null
}) {
  const name = xAccount?.name ?? 'Your X account'
  const initials = initialsFrom(name)

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
            <span className="text-muted-foreground">·</span>
            <span className="shrink-0 text-muted-foreground">
              {formatGeneratedAt(post.generated_at)}
            </span>
          </div>
          <button
            type="button"
            aria-label="More"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <IconDots className="size-4" />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <p className="text-sm text-sky-500">{post.hashtags.join(' ')}</p>
        )}

        {/* Meta label */}
        {(post.post_type || post.topic) && (
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {[post.post_type, post.topic].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between border-t px-4 pt-3">
        <Action icon={IconMessageCircle} />
        <Action icon={IconRepeat} />
        <Action icon={IconHeart} />
        <Action icon={IconEye} />
        <span className="flex items-center gap-3 text-muted-foreground">
          <IconBookmark className="size-4" />
          <IconShare3 className="size-4" />
        </span>
      </div>
    </Card>
  )
}
