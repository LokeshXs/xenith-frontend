import { redirect } from 'next/navigation'

import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { fetchBillingStatus } from '@/lib/services/billing'
import { fetchUserPreferences } from '@/lib/services/preferences'
import type { UserPreferences } from '@/lib/services/preferences'
import { SettingsForm } from './SettingsForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

// What we hand to the form when the user has never saved preferences (404).
// Keeps the form usable instead of bouncing them back to onboarding.
const EMPTY_PREFERENCES: UserPreferences = {
  niche: [],
  inspirationAccounts: [],
  postsPerDay: '1',
  replyCount: '5',
  deliveryTime: '08:00',
}

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // proxy.ts gates this route, but a missing token here means the session
  // vanished between middleware and render — bounce to login.
  if (!session?.access_token) {
    redirect('/login')
  }

  const [result, billing] = await Promise.all([
    fetchUserPreferences(session.access_token),
    fetchBillingStatus(session.access_token),
  ])

  if (result.kind === 'unauthorized' || billing.kind === 'unauthorized') {
    redirect('/signout')
  }

  const headerNode = (
    <header className="flex flex-col gap-1 pb-2">
      <h1 className="text-2xl max-sm:text-xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground">
        Tune what we write, how often, and when it lands.
      </p>
    </header>
  )

  if (result.kind === 'error') {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 p-4 sm:p-6 md:p-8">
        {headerNode}
        <p className="pt-6 text-sm text-destructive">
          Something went wrong loading your preferences. Please try again.
        </p>
      </div>
    )
  }

  const initialPreferences: UserPreferences =
    result.kind === 'ok'
      ? {
          niche: result.data.niche,
          inspirationAccounts: result.data.inspirationAccounts,
          postsPerDay: result.data.postsPerDay,
          replyCount: result.data.replyCount,
          deliveryTime: result.data.deliveryTime,
        }
      : EMPTY_PREFERENCES

  // The full list of niche chips to render comes from the API; the form falls
  // back to its built-in defaults when absent (e.g. the 404 / empty case).
  const suggestedNiches = result.kind === 'ok' ? result.data.suggestedNiches : []

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 p-4 sm:p-6 md:p-8">
      {headerNode}
      <SettingsForm
        initialPreferences={initialPreferences}
        suggestedNiches={suggestedNiches}
        replyCredits={billing.kind === 'ok' ? billing.data.reply_credits : null}
      />
    </div>
  )
}
