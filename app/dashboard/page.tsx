import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { fetchPostsToday } from '@/lib/services/posts'
import { DashboardClient } from './components/DashboardClient'

export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // proxy.ts gates this route, but a missing token here means the session
  // vanished between middleware and render — bounce to login.
  if (!session?.access_token) {
    redirect('/login')
  }

  const result = await fetchPostsToday(session.access_token)

  if (result.kind === 'unauthorized') {
    // Cookies can't be mutated from an RSC; /signout clears the Supabase
    // session and 307s to /login.
    redirect('/signout')
  }

  if (result.kind === 'error') {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto">
        <p className="text-sm text-destructive text-center">
          Something went wrong loading your posts. Please try again.
        </p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <DashboardClient
        initialPosts={result.data.posts}
        timezone={result.data.timezone}
        xAccount={result.data.xAccount}
      />
    </Suspense>
  )
}
