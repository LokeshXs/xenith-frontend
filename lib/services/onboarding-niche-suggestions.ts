export interface OnboardingNicheSuggestions {
  personalized: boolean
  suggestedNiches: string[]
  preselectedNiches: string[]
  generatedAt: string | null
}

export type OnboardingNicheSuggestionsResult =
  | { kind: 'ok'; data: OnboardingNicheSuggestions }
  | { kind: 'unauthorized' }
  | { kind: 'error' }

export async function fetchOnboardingNicheSuggestions(
  accessToken: string,
): Promise<OnboardingNicheSuggestionsResult> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/niche-suggestions`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      },
    )

    if (res.status === 401) return { kind: 'unauthorized' }
    if (!res.ok) return { kind: 'error' }

    const data = (await res.json()) as OnboardingNicheSuggestions
    return {
      kind: 'ok',
      data: {
        personalized: data.personalized,
        suggestedNiches: data.suggestedNiches ?? [],
        preselectedNiches: data.preselectedNiches ?? [],
        generatedAt: data.generatedAt ?? null,
      },
    }
  } catch {
    return { kind: 'error' }
  }
}
