import { redirect } from 'next/navigation'

import { fetchUserRequirementsStatus } from '@/lib/services/user-requirements'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'

// Entitled users land on today's working set. Read-only users land on their
// archive so the first dashboard view contains the content they still own.
export default async function Page() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    redirect('/login?redirectTo=%2Fdashboard')
  }

  const requirements = await fetchUserRequirementsStatus(session.access_token)

  if (requirements.kind === 'unauthorized') redirect('/signout')
  if (requirements.kind === 'error') redirect('/dashboard/posts')

  redirect(
    requirements.data.requirements.subscription.hasAccess
      ? '/dashboard/todays-posts'
      : '/dashboard/posts',
  )
}
