"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import type { DraftAiActionSummary } from "@/lib/services/posts";

type AiActionsContextValue = {
  summary: DraftAiActionSummary;
  setSummary: (summary: DraftAiActionSummary) => void;
};

const AiActionsContext = createContext<AiActionsContextValue | null>(null);

export function AiActionsProvider({
  initialSummary,
  children,
}: {
  initialSummary: DraftAiActionSummary;
  children: ReactNode;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const value = useMemo(() => ({ summary, setSummary }), [summary]);

  return (
    <AiActionsContext.Provider value={value}>
      {children}
    </AiActionsContext.Provider>
  );
}

export function useAiActions(): AiActionsContextValue {
  const context = useContext(AiActionsContext);
  if (!context) {
    throw new Error("useAiActions must be used within AiActionsProvider");
  }
  return context;
}
