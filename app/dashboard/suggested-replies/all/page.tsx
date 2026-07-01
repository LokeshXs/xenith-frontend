import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { AllSuggestedReplies } from '../../components/AllSuggestedReplies'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'All suggested replies' }

export default async function AllSuggestedRepliesPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // proxy.ts gates this route, but a missing token here means the session
  // vanished between middleware and render — bounce to login.
  if (!session?.access_token) {
    redirect('/login')
  }

  // The full reply history is fetched client-side with infinite-scroll
  // pagination (GET /suggested-replies), so the list owns its own loading state.
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto">
      <AllSuggestedReplies />
    </div>
  )
}
