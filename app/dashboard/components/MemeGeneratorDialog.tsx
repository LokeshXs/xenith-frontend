"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { IconCheck, IconDownload, IconPhoto } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MEME_TEMPLATES,
  defaultMemeTemplate,
  fitCaptionsToTemplate,
  getMemeTemplate,
  type MemeTemplate,
} from "@/lib/meme-templates";
import { updatePostMeme } from "@/lib/services/posts-client";
import type { GeneratedPost } from "@/lib/services/posts";
import { cn } from "@/lib/utils";
import { MemeCanvas, memeTemplateSrc } from "./MemeCanvas";

function sameCaptions(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function MemeGeneratorDialog({
  postId,
  currentTemplateId,
  currentCaptions,
  currentMemeText,
  onSaved,
  disabled,
}: {
  postId: number;
  currentTemplateId: string | null;
  currentCaptions: string[];
  currentMemeText: string;
  onSaved: (post: GeneratedPost) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initialRef = useRef<{
    templateId: string;
    captions: string[];
    memeText: string;
  } | null>(null);

  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(
    currentTemplateId ?? defaultMemeTemplate().id,
  );
  const selectedTemplate = useMemo(
    () => getMemeTemplate(templateId) ?? defaultMemeTemplate(),
    [templateId],
  );
  const [captions, setCaptions] = useState<string[]>(() =>
    fitCaptionsToTemplate(
      currentCaptions.length ? currentCaptions : selectedTemplate.examples,
      selectedTemplate,
    ),
  );
  const [memeText, setMemeText] = useState(currentMemeText);
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges =
    initialRef.current !== null &&
    (templateId !== initialRef.current.templateId ||
      memeText !== initialRef.current.memeText ||
      !sameCaptions(captions, initialRef.current.captions));

  const initializeFromCurrent = () => {
    const template =
      getMemeTemplate(currentTemplateId) ?? defaultMemeTemplate();
    const nextCaptions = fitCaptionsToTemplate(
      currentCaptions.length ? currentCaptions : template.examples,
      template,
    );
    const nextMemeText = currentMemeText;

    initialRef.current = {
      templateId: template.id,
      captions: nextCaptions,
      memeText: nextMemeText,
    };
    setTemplateId(template.id);
    setCaptions(nextCaptions);
    setMemeText(nextMemeText);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) initializeFromCurrent();
    setOpen(nextOpen);
  };

  const selectTemplate = (template: MemeTemplate) => {
    setTemplateId(template.id);
    setCaptions((current) => fitCaptionsToTemplate(current, template));
  };

  const updateCaption = (index: number, value: string) => {
    setCaptions((current) =>
      current.map((caption, captionIndex) =>
        captionIndex === index ? value : caption,
      ),
    );
  };

  const resetLocalChanges = () => {
    if (!initialRef.current) return;
    setTemplateId(initialRef.current.templateId);
    setCaptions(initialRef.current.captions);
    setMemeText(initialRef.current.memeText);
  };

  const handleSave = async () => {
    const nextCaptions = fitCaptionsToTemplate(captions, selectedTemplate).map(
      (caption) => caption.trim(),
    );
    if (nextCaptions.some((caption) => !caption)) {
      toast.error("Meme captions must not be empty");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updatePostMeme(postId, {
        meme_template_id: selectedTemplate.id,
        meme_captions: nextCaptions,
        meme_text: memeText.trim(),
      });
      onSaved(updated);
      toast.success("Meme saved");
      setOpen(false);
    } catch (error) {
      console.error("Failed to save meme:", error);
      toast.error("Failed to save meme");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  const downloadMeme = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Meme is still rendering");
      return;
    }

    const link = document.createElement("a");
    link.download = `xenith-meme-${postId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Meme downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" />}
        disabled={disabled}
      >
        <IconPhoto className="size-4" />
        Edit meme
      </DialogTrigger>

      <DialogContent className="grid h-[90vh] max-h-none w-[94vw] max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0">
        <header className="border-b px-5 py-4 sm:px-6">
          <DialogHeader className="gap-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <IconPhoto className="size-5" />
              Edit meme
            </DialogTitle>
            <DialogDescription>
              Pick a template, edit the text, and save this meme for the post.
            </DialogDescription>
          </DialogHeader>
        </header>

        <div className="grid min-h-0 md:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <aside className="min-h-0 overflow-y-auto border-b p-4 md:border-r md:border-b-0">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Templates
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
              {MEME_TEMPLATES.map((template) => {
                const selected = template.id === selectedTemplate.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectTemplate(template)}
                    className={cn(
                      "group overflow-hidden rounded-lg border bg-background text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      selected
                        ? "border-primary shadow-sm"
                        : "border-border hover:border-foreground/30",
                    )}
                  >
                    <span className="block aspect-[4/3] bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={memeTemplateSrc(template.file)}
                        alt=""
                        className="size-full object-cover"
                      />
                    </span>
                    <span className="flex items-start justify-between gap-2 px-2 py-1.5">
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium">
                          {template.name}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
                          {template.description}
                        </span>
                      </span>
                      {selected && (
                        <IconCheck className="mt-0.5 size-3.5 shrink-0" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col gap-3 overflow-auto bg-muted/30 p-4">
            {memeText.trim() && (
              <p className="mx-auto w-full max-w-2xl whitespace-pre-wrap rounded-lg border bg-background p-3 text-sm leading-relaxed">
                {memeText}
              </p>
            )}
            <MemeCanvas
              template={selectedTemplate}
              captions={captions}
              className="min-h-0 flex-1"
              onReady={handleCanvasReady}
            />
          </section>

          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-t p-4 md:border-t-0 md:border-l">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Meme text
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Optional text shown above the meme.
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`meme-text-${postId}`}>Text</Label>
              <Textarea
                id={`meme-text-${postId}`}
                value={memeText}
                onChange={(event) => setMemeText(event.target.value)}
                maxLength={280}
                rows={4}
                placeholder="Add optional text above the meme"
              />
              <p className="text-xs text-muted-foreground tabular-nums">
                {memeText.length}/280
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Captions
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {selectedTemplate.description}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {selectedTemplate.boxes.map((box, index) => (
                <div
                  key={`${selectedTemplate.id}-${index}`}
                  className="grid gap-1.5"
                >
                  <Label htmlFor={`meme-caption-${postId}-${index}`}>
                    Caption {index + 1}
                  </Label>
                  <Input
                    id={`meme-caption-${postId}-${index}`}
                    value={captions[index] ?? ""}
                    onChange={(event) =>
                      updateCaption(index, event.target.value)
                    }
                    maxLength={110}
                  />
                </div>
              ))}
            </div>
          </aside>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
          <p className="text-xs text-muted-foreground">
            {selectedTemplate.width}x{selectedTemplate.height} PNG
          </p>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetLocalChanges}
                disabled={isSaving}
              >
                Reset
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadMeme}
            >
              <IconDownload className="size-4" />
              Download PNG
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save meme"}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
