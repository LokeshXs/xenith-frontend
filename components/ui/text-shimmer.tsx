"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type PolymorphicTextProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
};

const PolymorphicText = React.forwardRef<HTMLElement, PolymorphicTextProps>(
  function PolymorphicText({ as: Component = "p", ...props }, ref) {
    return <Component ref={ref} {...props} />;
  },
);

const MotionText = motion.create(PolymorphicText);

export type TextShimmerProps = {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  baseColor?: string;
  shimmerColor?: string;
  style?: React.CSSProperties;
};

function TextShimmerComponent({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  baseColor,
  shimmerColor,
  style,
}: TextShimmerProps) {
  const shouldReduceMotion = useReducedMotion();

  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  return (
    <MotionText
      as={Component}
      className={cn(
        "relative inline-block bg-size-[250%_100%,auto] bg-clip-text",
        "[-webkit-text-fill-color:transparent]",
        "[background-repeat:no-repeat,padding-box] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className,
      )}
      initial={shouldReduceMotion ? false : { backgroundPosition: "100% center" }}
      animate={
        shouldReduceMotion ? undefined : { backgroundPosition: "0% center" }
      }
      transition={{
        repeat: Infinity,
        duration,
        ease: "linear",
      }}
      style={
        {
          ...style,
          "--spread": `${dynamicSpread}px`,
          "--base-color":
            baseColor ?? "color-mix(in oklab, currentColor 55%, transparent)",
          "--base-gradient-color": shimmerColor ?? "currentColor",
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
        } as React.CSSProperties
      }
    >
      {children}
    </MotionText>
  );
}

export const TextShimmer = React.memo(TextShimmerComponent);
