"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { isAxiosError } from "axios";
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconBook,
  IconCalendar,
  IconCheck,
  IconClock,
  IconCopy,
  IconDots,
  IconDownload,
  IconExternalLink,
  IconFlame,
  IconHeart,
  IconInfoCircle,
  IconList,
  IconMessageCircle,
  IconMoodSmile,
  IconPencil,
  IconPhoto,
  IconRefresh,
  IconRepeat,
  IconRosetteDiscountCheckFilled,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TextShimmer } from "@/components/ui/text-shimmer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TIME_SLOTS, formatTime12 } from "@/components/ui/time-picker";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  DraftAiActionSummary,
  EngagementBreakdown,
  GeneratedPost,
  XAccount,
} from "@/lib/services/posts";
import { EngagementBadge, getEngagementBand } from "./EngagementBadge";
import { MemeCanvas } from "./MemeCanvas";
import { MemeGeneratorDialog } from "./MemeGeneratorDialog";
import { SignalBars } from "./SignalBars";
import { useAiActions } from "./AiActionsContext";
import {
  type RewriteType,
  convertToMeme,
  publishPost,
  rescorePost,
  rewritePost,
  schedulePost,
  undoPost,
  unschedulePost,
  updatePost,
} from "@/lib/services/posts-client";
import { getTwitterAuthUrl } from "@/lib/services/twitter";
import {
  defaultMemeTemplate,
  fitCaptionsToTemplate,
  getMemeTemplate,
} from "@/lib/meme-templates";
import { cn } from "@/lib/utils";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

// "Jun 10, 9:00 AM" — the time a scheduled post will go out, in local tz.
function formatScheduledAt(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Public URL for a posted tweet; falls back to the id-only deep link when we
// don't know the account's @handle.
function tweetUrl(tweetId: string, username?: string): string {
  return username
    ? `https://x.com/${username}/status/${tweetId}`
    : `https://x.com/i/web/status/${tweetId}`;
}

function CopyButton({
  copied,
  onClick,
  label,
}: {
  copied: boolean;
  onClick: () => void;
  label: string;
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
  );
}

function signalPercent(value: number | undefined): number {
  return Math.round(Math.min(Math.max(value ?? 0, 0), 1) * 100);
}

function EditedBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      <IconPencil className="size-3" />
      Edited
    </Badge>
  );
}

// The text post types shown as selectable cards in the transform rail — each
// with the icon + one-line definition that mirrors the backend's rewrite
// prompt. "Meme" is rendered separately (an image action, not a text type).
const TRANSFORM_OPTIONS: {
  type: RewriteType;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    type: "Question",
    icon: IconMessageCircle,
    description: "Reframe it as one genuine question that invites replies.",
  },
  {
    type: "Hot take",
    icon: IconFlame,
    description: "Lead with a bold, debatable opinion worth arguing with.",
  },
  {
    type: "Story",
    icon: IconBook,
    description: "Retell it as a short narrative that lands the insight.",
  },
  {
    type: "Tips/Listicle",
    icon: IconList,
    description: "Break it into 2–4 tight, scannable tips.",
  },
  {
    type: "Funny",
    icon: IconMoodSmile,
    description: "A wry, relatable twist — humor over information.",
  },
];

type TransformTarget = RewriteType | "Meme";

function EngagementInfoDialog({
  open,
  onOpenChange,
  post,
  content,
  hashtags,
  postType,
  xAccount,
  edited,
  stale,
  score,
  signals,
  aiActions,
  isMeme,
  memeTextLength,
  memeNode,
  transforming,
  transformingTarget,
  onTransform,
  onConvertMeme,
  onUndo,
  onRescore,
  rescoring,
  canUndo,
  copied,
  onCopyTweet,
  isEditing,
  isSaving,
  draftContent,
  draftHashtags,
  onDraftContentChange,
  onDraftHashtagsChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  statusActions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: GeneratedPost;
  content: string;
  hashtags: string[];
  postType: string;
  xAccount: XAccount | null;
  edited: boolean;
  stale: boolean;
  score: number | null;
  signals: EngagementBreakdown | null | undefined;
  aiActions: DraftAiActionSummary;
  isMeme: boolean;
  memeTextLength: number;
  memeNode: ReactNode;
  transforming: boolean;
  transformingTarget: TransformTarget | null;
  onTransform: (type: RewriteType) => void;
  onConvertMeme: () => void;
  onUndo: () => void;
  onRescore: () => void;
  rescoring: boolean;
  canUndo: boolean;
  copied: boolean;
  onCopyTweet: () => void;
  isEditing: boolean;
  isSaving: boolean;
  draftContent: string;
  draftHashtags: string;
  onDraftContentChange: (value: string) => void;
  onDraftHashtagsChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  statusActions?: ReactNode;
}) {
  const name = xAccount?.name ?? "Your X account";
  const initials = initialsFrom(name);
  const hasScore = typeof score === "number";
  const band = hasScore ? getEngagementBand(score) : null;
  const characterCount = [content, hashtags.join(" ")]
    .filter(Boolean)
    .join(" ").length;
  const draftCharacterCount = [draftContent, draftHashtags]
    .filter(Boolean)
    .join(" ").length;
  const likePct = signalPercent(signals?.signals.p_like);
  const replyPct = signalPercent(signals?.signals.p_reply);
  const repostPct = signalPercent(signals?.signals.p_repost);
  const editingActive = isEditing || isSaving;
  const generatingMeme = transformingTarget === "Meme";
  const actionsExhausted = aiActions.balance <= 0;
  const actionsLow = aiActions.balance > 0 && aiActions.balance <= 2;
  const optionDisabled =
    transforming || rescoring || isEditing || actionsExhausted;

  // Confirm a rewrite before running it — it costs an AI call and clears the
  // current score. Clicking a type card stages it here; the alert commits it.
  const [pendingType, setPendingType] = useState<TransformTarget | null>(null);
  const confirmTransform = () => {
    const type = pendingType;
    setPendingType(null);
    if (type === "Meme") onConvertMeme();
    else if (type) onTransform(type);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && transforming) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="grid h-[90vh] max-h-none w-[90vw] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-3xl">
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4 sm:px-7 sm:py-5">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="text-xl font-semibold">
              Transform &amp; engagement
            </DialogTitle>
            <DialogDescription>
              Transform this draft and review its engagement details.
            </DialogDescription>
          </DialogHeader>
          <DialogClose
            render={
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-xl"
                aria-label="Close engagement details"
                disabled={transforming}
              />
            }
          >
            <IconX className="size-4" />
          </DialogClose>
        </header>

        <div className="grid min-h-0 overflow-y-auto md:grid-cols-[minmax(0,0.8fr)_minmax(20rem,0.86fr)] md:overflow-hidden">
          <section className="flex min-h-0 flex-col gap-3 border-b p-5 sm:p-6 md:overflow-hidden md:border-r md:border-b-0">
            {/* Transform rail — reshape this draft into another post type. */}
            <div className="flex shrink-0 flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  Transform into
                </p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums",
                      actionsExhausted
                        ? "border-destructive/25 bg-destructive/10 text-destructive"
                        : actionsLow
                          ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          : "border-primary/20 bg-primary/10 text-primary",
                    )}
                    title="Resets daily based on your configured timezone."
                  >
                    <IconSparkles className="size-3.5" />
                    {aiActions.balance} of {aiActions.period_granted} AI actions
                    left
                  </span>
                  {transforming && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconRefresh className="size-3.5 animate-spin" />
                      {generatingMeme ? "Generating meme…" : "Transforming…"}
                    </span>
                  )}
                  {canUndo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={transforming || rescoring}
                      onClick={onUndo}
                    >
                      <IconArrowBackUp className="size-4" />
                      Undo to original
                    </Button>
                  )}
                </div>
              </div>

              <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
                {TRANSFORM_OPTIONS.map(({ type, icon: Icon, description }) => {
                  const selected = !isMeme && postType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={selected}
                      disabled={optionDisabled}
                      onClick={() => setPendingType(type)}
                      className={cn(
                        "relative flex w-[15.5rem] shrink-0 items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-background hover:border-foreground/20",
                      )}
                    >
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight">
                          {type}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                          {description}
                        </span>
                      </span>
                      {selected && (
                        <span className="absolute top-2.5 right-2.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <IconCheck className="size-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Meme is an AI image action rather than a text rewrite. */}
                <button
                  type="button"
                  aria-pressed={isMeme}
                  aria-disabled={isMeme || optionDisabled}
                  disabled={optionDisabled || isMeme}
                  onClick={() => {
                    if (!isMeme) setPendingType("Meme");
                  }}
                  className={cn(
                    "relative flex w-[15.5rem] shrink-0 items-start gap-3 rounded-2xl border border-dashed p-3.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    isMeme && "cursor-default disabled:opacity-100",
                    isMeme
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-background hover:border-foreground/20",
                  )}
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <IconPhoto className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
                      Meme
                      <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        Image
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                      Let AI choose a template and write fitting captions.
                    </span>
                  </span>
                  {isMeme && (
                    <span className="absolute top-2.5 right-2.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <IconCheck className="size-3.5" />
                    </span>
                  )}
                </button>
              </div>
            </div>

            <AlertDialog
              open={pendingType !== null}
              onOpenChange={(nextOpen) => {
                if (!nextOpen) setPendingType(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Transform to “{pendingType}”?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {pendingType === "Meme"
                      ? "AI will choose a fitting template and generate its post text and captions. You can edit everything afterward."
                      : `This rewrites your draft in the “${pendingType}” style, in your voice, and clears its current engagement score. You can undo to the original anytime.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingType(null)}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={confirmTransform}>
                    {pendingType === "Meme" ? "Generate meme" : "Transform"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-background p-4 shadow-xs">
              <div className="flex shrink-0 items-center gap-2">
                <Avatar className="size-10 rounded-full">
                  {xAccount?.avatar && (
                    <AvatarImage src={xAccount.avatar} alt={name} />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className=" flex flex-col items-start gap-1">
                      <div className=" flex items-center gap-1">
                        <span className="truncate text-base font-semibold leading-tight max-md:text-base">
                          {name}
                        </span>
                        <IconRosetteDiscountCheckFilled className="size-6 shrink-0 text-sky-500" />
                      </div>
                      {xAccount?.username && (
                        <span className="block truncate text-sm leading-tight text-muted-foreground max-md:text-xs">
                          @{xAccount.username}
                        </span>
                      )}
                    </div>
                    {edited && <EditedBadge className="h-5 text-[11px]" />}
                  </div>
                </div>
              </div>

              {transforming ? (
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
                  <TextShimmer className="text-sm font-medium" duration={1.2}>
                    {generatingMeme
                      ? "Choosing a template and writing captions…"
                      : "Rewriting your post…"}
                  </TextShimmer>
                  {generatingMeme ? (
                    <Skeleton className="mt-4 aspect-video max-h-[24rem] w-full rounded-2xl" />
                  ) : (
                    <>
                      <div className="mt-4 space-y-2.5">
                        <Skeleton className="h-4 w-[92%] rounded-md" />
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-[85%] rounded-md" />
                        <Skeleton className="h-4 w-[96%] rounded-md" />
                        <Skeleton className="h-4 w-[70%] rounded-md" />
                      </div>
                      <div className="mt-5 flex gap-2">
                        <Skeleton className="h-4 w-16 rounded-md" />
                        <Skeleton className="h-4 w-14 rounded-md" />
                        <Skeleton className="h-4 w-20 rounded-md" />
                      </div>
                    </>
                  )}
                </div>
              ) : isMeme ? (
                <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
                  {memeNode}
                </div>
              ) : editingActive ? (
                <div className="mt-7 flex min-h-0 flex-1 flex-col gap-4">
                  <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                    <Label htmlFor={`modal-post-content-${post.id}`}>
                      Content
                    </Label>
                    <Textarea
                      id={`modal-post-content-${post.id}`}
                      value={draftContent}
                      onChange={(e) => onDraftContentChange(e.target.value)}
                      disabled={isSaving}
                      className="min-h-0 flex-1 resize-none"
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <Label htmlFor={`modal-post-hashtags-${post.id}`}>
                      Hashtags
                    </Label>
                    <Input
                      id={`modal-post-hashtags-${post.id}`}
                      value={draftHashtags}
                      onChange={(e) => onDraftHashtagsChange(e.target.value)}
                      placeholder="#ai #saas"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
                  <p className="text-base leading-relaxed whitespace-pre-wrap max-md:text-sm">
                    {content}
                  </p>
                  {hashtags.length > 0 && (
                    <p className="mt-5 text-sm leading-relaxed text-sky-500 max-sm:text-xs">
                      {hashtags.join(" ")}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground max-md:text-xs">
                <span className="min-w-0">
                  {transforming ? (
                    <Skeleton className="h-4 w-28 rounded-md" />
                  ) : editingActive ? (
                    `Editing · ${draftCharacterCount} characters`
                  ) : isMeme ? (
                    `Meme draft · ${memeTextLength} characters`
                  ) : (
                    `Draft · ${characterCount} characters`
                  )}
                </span>
                {transforming ? (
                  <div className="flex shrink-0 items-center gap-7">
                    <span className="inline-flex items-center gap-2">
                      <IconHeart className="size-5 opacity-40" />
                      <Skeleton className="h-4 w-8 rounded-md" />
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <IconMessageCircle className="size-5 opacity-40" />
                      <Skeleton className="h-4 w-8 rounded-md" />
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <IconRepeat className="size-5 opacity-40" />
                      <Skeleton className="h-4 w-8 rounded-md" />
                    </span>
                  </div>
                ) : isMeme ? null : (
                  !editingActive && (
                    <div className="flex shrink-0 items-center gap-7">
                      <span className="inline-flex items-center gap-2">
                        <IconHeart className="size-5" />
                        {likePct}%
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <IconMessageCircle className="size-5" />
                        {replyPct}%
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <IconRepeat className="size-5" />
                        {repostPct}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col gap-4 overflow-y-auto bg-muted/20 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Engagement score
              </p>
              {!isMeme && !hasScore && !transforming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRescore}
                  disabled={rescoring || editingActive || actionsExhausted}
                >
                  <IconRefresh
                    className={cn("size-4", rescoring && "animate-spin")}
                  />
                  {rescoring ? "Scoring…" : "Re-score"}
                </Button>
              )}
            </div>

            {transforming ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4">
                <TextShimmer className="text-sm font-medium" duration={1.2}>
                  {generatingMeme
                    ? "Generating your meme…"
                    : "Preparing the rewritten post…"}
                </TextShimmer>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-[3.75rem] w-30 rounded-xl" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-3.5 w-40 rounded-md" />
                  </div>
                </div>
                <div className="flex min-h-[14rem] flex-1 flex-col gap-4 rounded-2xl border border-border bg-background p-4 shadow-xs sm:p-5">
                  <Skeleton className="h-3.5 w-64 rounded-md" />
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-16 rounded-md" />
                        <Skeleton className="h-3.5 w-10 rounded-md" />
                      </div>
                      <Skeleton className="h-2.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ) : isMeme ? (
              <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground shadow-xs">
                Engagement scoring isn&apos;t available for meme posts yet.
              </div>
            ) : (
              <>
            {/* After a transform (or manual edit) the shown draft has no current
                score — invite the user to re-score rather than show a stale one.
                Once a fresh score is present, the panel below speaks for itself. */}
            {stale && !hasScore && (
              <div className="flex items-start gap-3 rounded-2xl border border-sky-400/40 bg-sky-500/10 p-4 text-sm text-sky-900 dark:text-sky-100">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-200">
                  <IconSparkles className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium">You&apos;ve changed this post.</p>
                  <p className="mt-0.5 text-sky-800/90 dark:text-sky-100/90">
                    Its engagement score is out of date — re-score to see how the
                    current version is likely to perform.
                  </p>
                </div>
              </div>
            )}

            {band && typeof score === "number" ? (
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "inline-flex min-w-[7.5rem] items-baseline justify-center gap-1 rounded-xl border px-4 py-3 font-semibold tabular-nums",
                    band.className,
                    stale && "opacity-70",
                  )}
                >
                  <span className="text-xl leading-none">{score}</span>
                  <span className="text-sm opacity-90">/100</span>
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold">{band.label}</p>
                  <p className="text-sm text-muted-foreground">
                    Relative predicted engagement
                  </p>
                </div>
              </div>
            ) : !stale ? (
              <p className="rounded-2xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                No engagement score is available for this post.
              </p>
            ) : null}

            {signals ? (
              <div className="flex min-h-[14rem] flex-1 flex-col rounded-2xl border border-border bg-background p-4 shadow-xs sm:p-5">
                <p className="text-sm text-muted-foreground">
                  How likely an average reader is to take each action.
                </p>
                <SignalBars
                  signals={signals.signals}
                  topDriver={signals.top_driver}
                  className="mt-4 flex-1 justify-evenly gap-3"
                />
              </div>
            ) : !stale && score !== null && score !== undefined ? (
              <p className="rounded-2xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Detailed signal probabilities are not available for this post.
              </p>
            ) : null}

            {/* Explainer only makes sense alongside a real score; when there's
                no score the Re-score button takes its place. */}
            {hasScore && (
              <div className="flex items-start gap-3 rounded-2xl border border-sky-400/40 bg-sky-500/10 p-4 text-sm text-sky-900 dark:text-sky-100">
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-200">
                  <IconInfoCircle className="size-3.5" />
                </span>
                <p>
                  Calculated using X algorithm-inspired engagement weights. It
                  is a relative guide, not a prediction of exact likes or
                  replies.
                </p>
              </div>
            )}
              </>
            )}
          </section>
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t px-5 py-4 sm:px-7">
          {editingActive ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={onSaveEdit} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <DialogClose
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={transforming}
                    />
                  }
                >
                  Close
                </DialogClose>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStartEdit}
                  disabled={isMeme || transforming}
                >
                  <IconPencil className="size-4" />
                  Edit tweet
                </Button>
                <Button size="sm" variant="outline" onClick={onCopyTweet}>
                  {copied ? (
                    <IconCheck className="size-4" />
                  ) : (
                    <IconCopy className="size-4" />
                  )}
                  {copied ? "Copied" : "Copy tweet"}
                </Button>
              </div>
              {statusActions && (
                <div className="ml-auto flex items-center gap-2">
                  {statusActions}
                </div>
              )}
            </>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}

export function PostCard({
  post,
  xAccount,
}: {
  post: GeneratedPost;
  xAccount: XAccount | null;
}) {
  const { summary: aiActions, setSummary: setAiActions } = useAiActions();
  const name = xAccount?.name ?? "Your X account";
  const initials = initialsFrom(name);

  const [copiedTweet, setCopiedTweet] = useState(false);

  // Currently displayed (saved) values — kept in state so the card reflects
  // edits without the parent needing to refetch.
  const [content, setContent] = useState(post.content);
  const [hashtags, setHashtags] = useState<string[]>(post.hashtags);
  const [postType, setPostType] = useState(post.post_type);
  const [originalContent, setOriginalContent] = useState(
    post.original_content ?? post.content,
  );
  const [originalHashtags, setOriginalHashtags] = useState<string[]>(
    post.original_hashtags.length > 0 ? post.original_hashtags : post.hashtags,
  );
  const [edited, setEdited] = useState(post.edited);

  // Engagement score/breakdown, lifted into state so transforms, Undo, and
  // on-demand re-scoring update the modal and header badge in place.
  const [engagementScore, setEngagementScore] = useState<number | null>(
    post.engagement_score,
  );
  const [engagementSignals, setEngagementSignals] = useState<
    EngagementBreakdown | null
  >(post.engagement_signals ?? null);
  // The shown score no longer matches the shown content. Text transforms clear
  // it, Undo restores the original score, and on-demand re-scoring refreshes it.
  const [scoreStale, setScoreStale] = useState(post.edited);
  const [transformingTarget, setTransformingTarget] =
    useState<TransformTarget | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const isTransforming = transformingTarget !== null || isUndoing;
  const [isRescoring, setIsRescoring] = useState(false);

  // Edit-mode state.
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(post.content);
  const [draftHashtags, setDraftHashtags] = useState(post.hashtags.join(" "));
  const [isSaving, setIsSaving] = useState(false);

  // Publish/schedule lifecycle — kept in state so the card reflects the new
  // status in place without the parent needing to refetch.
  const [status, setStatus] = useState(post.status);
  const [tweetId, setTweetId] = useState(post.tweet_id);
  const [scheduledAt, setScheduledAt] = useState(post.scheduled_at);
  const [publishError, setPublishError] = useState(post.publish_error);
  const [isMeme, setIsMeme] = useState(post.is_meme);
  const [memeTemplateId, setMemeTemplateId] = useState(post.meme_template_id);
  const [memeCaptions, setMemeCaptions] = useState<string[]>(
    post.meme_captions,
  );
  const [memeText, setMemeText] = useState(post.meme_text ?? "");

  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isUnscheduling, setIsUnscheduling] = useState(false);
  const [moreInfoOpen, setMoreInfoOpen] = useState(false);

  // Schedule dialog + picked date/time (time as "HH:MM").
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [modalScheduleOpen, setModalScheduleOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | undefined>(undefined);
  const [pickedTime, setPickedTime] = useState("09:00");
  const selectedSlotRef = useRef<HTMLButtonElement>(null);
  const memeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const busy = isPublishing || isScheduling || isUnscheduling;
  // Memes can't be published/scheduled yet (no media pipeline); block it here.
  const publishingDisabled =
    busy || isEditing || isMeme || isTransforming || isRescoring;
  const selectedMemeTemplate =
    getMemeTemplate(memeTemplateId) ?? defaultMemeTemplate();
  const selectedMemeCaptions = fitCaptionsToTemplate(
    memeCaptions.length > 0 ? memeCaptions : selectedMemeTemplate.examples,
    selectedMemeTemplate,
  );
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Default the calendar to today when the dialog opens with nothing picked, so
  // the user lands on a usable state matching the footer's date display.
  const handleScheduleOpenChange = (open: boolean) => {
    if (open && !pickedDate) setPickedDate(new Date());
    setScheduleOpen(open);
  };

  const handleModalScheduleOpenChange = (open: boolean) => {
    if (open && !pickedDate) setPickedDate(new Date());
    setModalScheduleOpen(open);
  };

  // When the picked day is today, only offer slots at least 30 min out: this
  // skips the immediately-next slot (e.g. at 3:27 we disable 3:30 and start
  // selection from 4:00) so the user always has lead time before delivery.
  const pickedIsToday =
    !!pickedDate && pickedDate.toDateString() === new Date().toDateString();
  const isSlotPast = (slot: string) => {
    if (!pickedIsToday) return false;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = slot.split(":").map(Number);
    return h * 60 + m <= nowMinutes + 30;
  };

  // Center the selected time in the list whenever the dialog opens.
  useEffect(() => {
    if (!scheduleOpen) return;
    const raf = requestAnimationFrame(() =>
      selectedSlotRef.current?.scrollIntoView({ block: "center" }),
    );
    return () => cancelAnimationFrame(raf);
  }, [scheduleOpen]);

  // On a 403 the X connection lacks the tweet.write scope; route the user
  // back through the connect flow, returning them to this page afterwards.
  const reconnectForPosting = async () => {
    toast.error("Reconnect X to enable posting");
    try {
      const url = await getTwitterAuthUrl(window.location.pathname);
      window.location.href = url;
    } catch (error) {
      console.error("Failed to start X reconnect:", error);
      toast.error("Could not start X reconnect. Please try again.");
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const updated = await publishPost(post.id);
      setStatus(updated.status);
      setTweetId(updated.tweet_id);
      setPublishError(updated.publish_error);
      toast.success("Post published");
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined;
      if (code === 403) {
        await reconnectForPosting();
        return;
      }
      if (code === 400) {
        toast.error("Connect your X account to publish");
      } else if (code === 502) {
        const data = isAxiosError(error) ? error.response?.data : undefined;
        const message =
          (data?.publish_error as string | undefined) ??
          (data?.post?.publish_error as string | undefined) ??
          "X rejected this post";
        setStatus("failed");
        setPublishError(message);
        toast.error(message);
      } else {
        console.error("Failed to publish post:", error);
        toast.error("Failed to publish post. Please try again.");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!pickedDate) {
      toast.error("Pick a date");
      return;
    }
    const [hours, minutes] = pickedTime.split(":").map(Number);
    const when = new Date(pickedDate);
    when.setHours(hours || 0, minutes || 0, 0, 0);
    if (when.getTime() <= Date.now()) {
      toast.error("Pick a time in the future");
      return;
    }

    setIsScheduling(true);
    try {
      const updated = await schedulePost(post.id, when.toISOString());
      setStatus(updated.status);
      setScheduledAt(updated.scheduled_at);
      setScheduleOpen(false);
      setModalScheduleOpen(false);
      toast.success("Post scheduled");
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined;
      if (code === 403) {
        await reconnectForPosting();
        return;
      }
      if (code === 409) {
        toast.error("This post is already published");
      } else if (code === 400) {
        toast.error("Pick a valid future time");
      } else {
        console.error("Failed to schedule post:", error);
        toast.error("Failed to schedule post. Please try again.");
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUnschedule = async () => {
    setIsUnscheduling(true);
    try {
      const updated = await unschedulePost(post.id);
      setStatus(updated.status);
      setScheduledAt(updated.scheduled_at);
      toast.success("Schedule cancelled");
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined;
      if (code === 409) {
        toast.error("This post is not scheduled");
      } else {
        console.error("Failed to cancel schedule:", error);
        toast.error("Failed to cancel schedule. Please try again.");
      }
    } finally {
      setIsUnscheduling(false);
    }
  };

  const copyToClipboard = async (
    text: string,
    setFlag: (v: boolean) => void,
    successMessage: string,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      toast.success(successMessage);
      setTimeout(() => setFlag(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy");
    }
  };

  const startEditing = () => {
    setDraftContent(content);
    setDraftHashtags(hashtags.join(" "));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleMoreInfoOpenChange = (open: boolean) => {
    if (!open && isEditing && !isSaving) cancelEditing();
    setMoreInfoOpen(open);
  };

  const handleSave = async () => {
    const nextContent = draftContent.trim();
    const nextHashtags = draftHashtags
      .split(/\s+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!nextContent) {
      toast.error("Content must not be empty");
      return;
    }

    // Optimistically reflect the edit in the card.
    setContent(nextContent);
    setHashtags(nextHashtags);
    setIsEditing(false);
    setIsSaving(true);

    try {
      const updated = await updatePost(post.id, {
        content: nextContent,
        hashtags: nextHashtags,
      });
      // Sync with the server's authoritative copy.
      setContent(updated.content);
      setHashtags(updated.hashtags);
      setOriginalContent(updated.original_content ?? originalContent);
      setOriginalHashtags(
        updated.original_hashtags.length > 0
          ? updated.original_hashtags
          : originalHashtags,
      );
      setEdited(updated.edited);
      // A manual edit doesn't re-score, so the shown score is now stale.
      setScoreStale(updated.edited);
      toast.success("Post updated");
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  // Sync all displayed fields from a server post after a transform/undo/rescore.
  // `stale` marks whether the shown score still matches the shown content: a
  // transform clears the score (stale=true → prompt a re-score); undo restores
  // the original's fresh score and re-score refreshes it (stale=false).
  const reconcilePost = (updated: GeneratedPost, stale: boolean) => {
    setContent(updated.content);
    setHashtags(updated.hashtags);
    setPostType(updated.post_type);
    setEngagementScore(updated.engagement_score);
    setEngagementSignals(updated.engagement_signals ?? null);
    setEdited(updated.edited);
    setScoreStale(stale);
    setIsMeme(updated.is_meme);
    setMemeTemplateId(updated.meme_template_id);
    setMemeCaptions(updated.meme_captions);
    setMemeText(updated.meme_text ?? "");
    setOriginalContent(updated.original_content ?? originalContent);
    setOriginalHashtags(
      updated.original_hashtags.length > 0
        ? updated.original_hashtags
        : originalHashtags,
    );
  };

  const handleTransform = async (type: RewriteType) => {
    setTransformingTarget(type);
    try {
      const { post: updated, ai_actions: nextAiActions } = await rewritePost(
        post.id,
        type,
      );
      setAiActions(nextAiActions);
      // Transform clears the score — mark stale so the panel prompts a re-score.
      reconcilePost(updated, true);
      toast.success(`Transformed to ${type} — re-score to update engagement`);
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined;
      const errorCode = isAxiosError(error)
        ? (error.response?.data?.code as string | undefined)
        : undefined;
      const nextAiActions = isAxiosError(error)
        ? (error.response?.data?.ai_actions as
            | DraftAiActionSummary
            | undefined)
        : undefined;
      if (nextAiActions) setAiActions(nextAiActions);
      if (code === 429 && errorCode === "DRAFT_AI_ACTIONS_EXHAUSTED") {
        toast.error("No AI actions left today. Try again tomorrow.");
      } else if (code === 429) {
        toast.error("Too many requests. Please wait and try again.");
      } else if (code === 409) {
        toast.error("Published posts can't be transformed.");
      } else {
        console.error("Failed to transform post:", error);
        toast.error("Failed to transform post. Please try again.");
      }
    } finally {
      setTransformingTarget(null);
    }
  };

  const handleConvertMeme = async () => {
    if (isMeme) return;
    setTransformingTarget("Meme");
    try {
      const { post: updated, ai_actions: nextAiActions } =
        await convertToMeme(post.id);
      setAiActions(nextAiActions);
      // The text score remains stored, but is hidden while meme mode is active.
      reconcilePost(updated, scoreStale);
      toast.success("Meme generated — use the edit button to customize it.");
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined;
      const errorCode = isAxiosError(error)
        ? (error.response?.data?.code as string | undefined)
        : undefined;
      const nextAiActions = isAxiosError(error)
        ? (error.response?.data?.ai_actions as
            | DraftAiActionSummary
            | undefined)
        : undefined;
      if (nextAiActions) setAiActions(nextAiActions);
      if (code === 429 && errorCode === "DRAFT_AI_ACTIONS_EXHAUSTED") {
        toast.error("No AI actions left today. Try again tomorrow.");
      } else if (code === 429) {
        toast.error("Too many requests. Please wait and try again.");
      } else if (code === 409) {
        const message = isAxiosError(error)
          ? (error.response?.data?.error as string | undefined)
          : undefined;
        toast.error(
          message?.includes("already a meme")
            ? "This post is already a meme."
            : "Published posts can't be transformed.",
        );
      } else if (code === 502) {
        toast.error(
          "Couldn't generate a meme for this draft. Please try again.",
        );
      } else {
        console.error("Failed to generate meme:", error);
        toast.error("Failed to generate meme. Please try again.");
      }
    } finally {
      setTransformingTarget(null);
    }
  };

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      const updated = await undoPost(post.id);
      // Undo restores the original draft's own (fresh) score.
      reconcilePost(updated, false);
      toast.success("Restored the original draft");
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined;
      if (code === 409) {
        toast.error("Nothing to undo — this is the original draft.");
      } else {
        console.error("Failed to undo:", error);
        toast.error("Failed to undo. Please try again.");
      }
    } finally {
      setIsUndoing(false);
    }
  };

  const handleRescore = async () => {
    setIsRescoring(true);
    try {
      const { post: updated, ai_actions: nextAiActions } =
        await rescorePost(post.id);
      setAiActions(nextAiActions);
      // Score now matches the shown content — no longer stale.
      reconcilePost(updated, false);
      toast.success("Engagement score updated");
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.status : undefined;
      const errorCode = isAxiosError(error)
        ? (error.response?.data?.code as string | undefined)
        : undefined;
      const nextAiActions = isAxiosError(error)
        ? (error.response?.data?.ai_actions as
            | DraftAiActionSummary
            | undefined)
        : undefined;
      if (nextAiActions) setAiActions(nextAiActions);
      if (code === 429 && errorCode === "DRAFT_AI_ACTIONS_EXHAUSTED") {
        toast.error("No AI actions left today. Try again tomorrow.");
      } else if (code === 429) {
        toast.error("Too many requests. Please wait and try again.");
      } else if (code === 502) {
        toast.error("Couldn't score this post right now. Please try again.");
      } else {
        console.error("Failed to re-score post:", error);
        toast.error("Failed to re-score. Please try again.");
      }
    } finally {
      setIsRescoring(false);
    }
  };

  const hashtagsText = hashtags.join(" ");

  const handleMemeSaved = (updated: GeneratedPost) => {
    setMemeTemplateId(updated.meme_template_id);
    setMemeCaptions(updated.meme_captions);
    setMemeText(updated.meme_text ?? "");
  };

  const handleMemeCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    memeCanvasRef.current = canvas;
  }, []);

  const downloadMeme = () => {
    const canvas = memeCanvasRef.current;
    if (!canvas) {
      toast.error("Meme is still rendering");
      return;
    }

    const link = document.createElement("a");
    link.download = `xenith-meme-${post.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Meme downloaded");
  };

  const copyTweet = () => {
    const tweetText = isMeme
      ? memeText.trim()
      : [content, hashtagsText].filter(Boolean).join("\n\n");
    if (!tweetText) {
      toast.error("No post text to copy");
      return;
    }
    return copyToClipboard(tweetText, setCopiedTweet, "Tweet copied");
  };

  const renderScheduleButton = (
    open: boolean,
    onOpenChange: (open: boolean) => void,
  ) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
        disabled={publishingDisabled}
      >
        <IconCalendar className="size-4" />
        Schedule
      </DialogTrigger>
      <DialogContent className="w-auto max-w-[calc(100%-2rem)] gap-0 p-0">
        <DialogTitle className="sr-only">Schedule post</DialogTitle>
        <div className="flex flex-col sm:flex-row">
          <div className="flex justify-center border-b p-2 sm:border-r sm:border-b-0">
            <Calendar
              mode="single"
              selected={pickedDate}
              onSelect={setPickedDate}
              disabled={{ before: startOfToday }}
              weekStartsOn={1}
              autoFocus
            />
          </div>

          <div className="flex w-full flex-col gap-2 p-3 sm:w-52">
            <p className="px-1 text-sm font-medium">Available times</p>
            <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto pr-0.5 sm:max-h-72">
              {TIME_SLOTS.map((slot) => {
                const selected = slot === pickedTime;
                const past = isSlotPast(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    ref={selected ? selectedSlotRef : undefined}
                    aria-pressed={selected}
                    disabled={past}
                    onClick={() => setPickedTime(slot)}
                    className={cn(
                      "flex items-center justify-center rounded-2xl border px-3 py-2 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      "disabled:cursor-not-allowed disabled:opacity-40",
                      selected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    )}
                  >
                    {formatTime12(slot)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-2xl border border-border bg-background px-3 py-2 text-sm">
              {pickedDate
                ? pickedDate.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select a date"}
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
              {isScheduling ? "Scheduling…" : "Apply"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const modalStatusActions =
    status === "pending" || status === "approved" ? (
      <>
        <Button size="sm" onClick={handlePublish} disabled={publishingDisabled}>
          {isPublishing ? "Publishing…" : "Publish now"}
        </Button>
        {renderScheduleButton(modalScheduleOpen, handleModalScheduleOpenChange)}
      </>
    ) : null;

  const footerActions = !isEditing ? (
    <div className="flex shrink-0 items-center gap-1">
      <CopyButton copied={copiedTweet} label="Copy tweet" onClick={copyTweet} />
    </div>
  ) : null;

  const canUndo = edited || isMeme;

  // The meme view: canvas + an edit-icon overlay that opens the meme editor.
  // Shared between the card body and the "More info" modal's left column.
  const memeNode = (
    <div className="flex flex-col gap-3">
      {memeText.trim() && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {memeText}
        </p>
      )}
      <div className="relative w-fit">
        <MemeCanvas
          template={selectedMemeTemplate}
          captions={selectedMemeCaptions}
          className="max-h-[26rem] rounded-lg bg-muted/30 p-2"
          canvasClassName="shadow-none"
          onReady={handleMemeCanvasReady}
        />
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="rounded-lg shadow-sm"
            onClick={downloadMeme}
            disabled={busy || isTransforming}
            aria-label="Download meme"
          >
            <IconDownload className="size-4" />
          </Button>
          <MemeGeneratorDialog
            postId={post.id}
            currentTemplateId={memeTemplateId}
            currentCaptions={memeCaptions}
            currentMemeText={memeText}
            onSaved={handleMemeSaved}
            disabled={busy || isTransforming}
            triggerRender={
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="rounded-lg shadow-sm"
                aria-label="Edit meme"
              />
            }
            triggerContent={<IconPencil className="size-4" />}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Memes can&apos;t be published to X yet — undo to publish.
      </p>
    </div>
  );

  return (
    <Card size="sm" className="mb-4 break-inside-avoid gap-3 shadow-sm">
      <div className="flex flex-col gap-3 px-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Avatar className="size-9 rounded-full">
            {xAccount?.avatar && (
              <AvatarImage src={xAccount.avatar} alt={name} />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start min-w-0 flex-1 gap-1 text-sm">
            <div className=" flex items-center gap-1">
              <span className="truncate font-semibold">{name}</span>
              <IconRosetteDiscountCheckFilled className="size-4 shrink-0 text-sky-500" />
            </div>
            {xAccount?.username && (
              <span className="truncate text-muted-foreground text-xs">
                @{xAccount.username}
              </span>
            )}
          </div>
          {edited && <EditedBadge className="h-5 px-1.5 text-[11px]" />}
          {!isMeme && (
            <EngagementBadge score={engagementScore} stale={scoreStale} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More actions"
              disabled={isEditing}
              className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <IconDots className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setMoreInfoOpen(true)}>
                <IconInfoCircle className="size-4" />
                More info
              </DropdownMenuItem>
              <DropdownMenuItem onClick={startEditing}>
                <IconPencil className="size-4" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <EngagementInfoDialog
            open={moreInfoOpen}
            onOpenChange={handleMoreInfoOpenChange}
            post={post}
            content={content}
            hashtags={hashtags}
            postType={postType}
            xAccount={xAccount}
            edited={edited}
            stale={scoreStale}
            score={engagementScore}
            signals={engagementSignals}
            aiActions={aiActions}
            isMeme={isMeme}
            memeTextLength={memeText.length}
            memeNode={memeNode}
            transforming={isTransforming}
            transformingTarget={transformingTarget}
            onTransform={handleTransform}
            onConvertMeme={handleConvertMeme}
            onUndo={handleUndo}
            onRescore={handleRescore}
            rescoring={isRescoring}
            canUndo={canUndo}
            copied={copiedTweet}
            onCopyTweet={copyTweet}
            isEditing={isEditing}
            isSaving={isSaving}
            draftContent={draftContent}
            draftHashtags={draftHashtags}
            onDraftContentChange={setDraftContent}
            onDraftHashtagsChange={setDraftHashtags}
            onStartEdit={startEditing}
            onCancelEdit={cancelEditing}
            onSaveEdit={handleSave}
            statusActions={modalStatusActions}
          />
        </div>

        {isMeme && !isEditing && (
          <Badge
            variant="outline"
            className="w-fit gap-1 border-primary/25 bg-primary/10 text-primary"
          >
            <IconMoodSmile className="size-3" />
            Meme
          </Badge>
        )}

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
                {isSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : isMeme ? (
          memeNode
        ) : (
          <>
            {/* Body */}
            <div className="flex flex-col gap-1">
              <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-sky-500">{hashtagsText}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer action bar — status-driven */}
      <div className="border-t px-4 pt-3">
        {(status === "pending" || status === "approved") && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isMeme ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={<span tabIndex={0} className="inline-flex" />}
                    >
                      <Button size="sm" disabled>
                        Publish now
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Meme publishing coming soon — undo to publish
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={publishingDisabled}
                >
                  {isPublishing ? "Publishing…" : "Publish now"}
                </Button>
              )}
              {renderScheduleButton(scheduleOpen, handleScheduleOpenChange)}
            </div>
            {footerActions}
          </div>
        )}

        {status === "scheduled" && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <IconClock className="size-4 shrink-0" />
              <span className="truncate">
                Scheduled for {formatScheduledAt(scheduledAt)}
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={handleUnschedule}
                disabled={busy}
              >
                {isUnscheduling ? "Cancelling…" : "Cancel"}
              </Button>
              {footerActions}
            </div>
          </div>
        )}

        {status === "posted" && (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <IconCheck className="size-4" />
              Posted
            </span>
            <div className="flex shrink-0 items-center gap-2">
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
              {footerActions}
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col gap-2">
            <span className="flex items-start gap-1.5 text-xs text-destructive">
              <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
              {publishError || "Publishing failed."}
            </span>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={publishingDisabled}
                >
                  {isPublishing ? "Retrying…" : "Retry"}
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
              {footerActions}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
