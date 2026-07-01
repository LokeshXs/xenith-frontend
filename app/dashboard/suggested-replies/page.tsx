import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { SuggestedRepliesList } from '../components/SuggestedRepliesList'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Suggested replies' }

export default async function SuggestedRepliesPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // proxy.ts gates this route, but a missing token here means the session
  // vanished between middleware and render — bounce to login.
  if (!session?.access_token) {
    redirect('/login')
  }

  // Replies are fetched client-side on view-open via GET
  // /suggested-replies/generate — it serves a cached batch when fresh and only
  // regenerates when needed, so the list owns its own loading state.
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto">
      <SuggestedRepliesList />
    </div>
  )
}
