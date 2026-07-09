import { create } from 'zustand'

interface MemeCaptionState {
  captionsByKey: Record<string, string[]>
  loadingByKey: Record<string, boolean>
  errorByKey: Record<string, string | null>
  setCaptions: (key: string, captions: string[]) => void
  setLoading: (key: string, loading: boolean) => void
  setError: (key: string, error: string | null) => void
  clearPost: (postId: number) => void
}

export const useMemeCaptionStore = create<MemeCaptionState>((set) => ({
  captionsByKey: {},
  loadingByKey: {},
  errorByKey: {},
  setCaptions: (key, captions) =>
    set((state) => ({
      captionsByKey: { ...state.captionsByKey, [key]: captions },
    })),
  setLoading: (key, loading) =>
    set((state) => ({
      loadingByKey: { ...state.loadingByKey, [key]: loading },
    })),
  setError: (key, error) =>
    set((state) => ({
      errorByKey: { ...state.errorByKey, [key]: error },
    })),
  clearPost: (postId) =>
    set((state) => {
      const prefix = `${postId}:`
      const captionsByKey = Object.fromEntries(
        Object.entries(state.captionsByKey).filter(([key]) => !key.startsWith(prefix)),
      )
      const loadingByKey = Object.fromEntries(
        Object.entries(state.loadingByKey).filter(([key]) => !key.startsWith(prefix)),
      )
      const errorByKey = Object.fromEntries(
        Object.entries(state.errorByKey).filter(([key]) => !key.startsWith(prefix)),
      )

      return { captionsByKey, loadingByKey, errorByKey }
    }),
}))
