"use client";

import { useEffect, useRef } from "react";

import type { MemeTemplate, MemeTextBox } from "@/lib/meme-templates";
import { cn } from "@/lib/utils";

function templateSrc(file: string): string {
  return `/meme/${encodeURIComponent(file)}`;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth || !line) {
      line = testLine;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawTextBox(
  ctx: CanvasRenderingContext2D,
  box: MemeTextBox,
  rawText: string,
) {
  const text = (box.uppercase ?? true) ? rawText.toUpperCase() : rawText;
  const padding = 10;
  const maxWidth = box.width - padding * 2;
  const maxHeight = box.height - padding * 2;
  const minFont = box.fontMin ?? 18;
  const maxFont = box.fontMax ?? Math.min(42, box.height * 0.42);

  let fontSize = maxFont;
  let lines: string[] = [];

  while (fontSize >= minFont) {
    ctx.font = `900 ${fontSize}px Impact, Arial Black, Arial, sans-serif`;
    lines = wrapText(ctx, text, maxWidth);
    if (lines.length * fontSize * 1.12 <= maxHeight) break;
    fontSize -= 2;
  }

  ctx.font = `900 ${fontSize}px Impact, Arial Black, Arial, sans-serif`;
  ctx.textAlign = box.align ?? "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const lineHeight = fontSize * 1.12;
  const totalHeight = lines.length * lineHeight;
  const startY = box.y + box.height / 2 - totalHeight / 2 + lineHeight / 2;
  const x =
    ctx.textAlign === "left"
      ? box.x + padding
      : ctx.textAlign === "right"
        ? box.x + box.width - padding
        : box.x + box.width / 2;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    if (box.stroke !== "transparent") {
      ctx.lineWidth = Math.max(4, fontSize * 0.14);
      ctx.strokeStyle = box.stroke ?? "#000000";
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = box.color ?? "#ffffff";
    ctx.fillText(line, x, y);
  });
}

export function MemeCanvas({
  template,
  captions,
  className,
  canvasClassName,
  onReady,
}: {
  template: MemeTemplate;
  captions: string[];
  className?: string;
  canvasClassName?: string;
  onReady?: (canvas: HTMLCanvasElement) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    image.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = template.width;
      canvas.height = template.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, template.width, template.height);
      template.boxes.forEach((box, index) => {
        drawTextBox(ctx, box, captions[index] ?? "");
      });
      onReady?.(canvas);
    };
    image.src = templateSrc(template.file);
  }, [captions, onReady, template]);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-auto",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className={cn(
          "max-h-full max-w-full rounded-lg border bg-background shadow-sm",
          canvasClassName,
        )}
      />
    </div>
  );
}

export function memeTemplateSrc(file: string): string {
  return templateSrc(file);
}
