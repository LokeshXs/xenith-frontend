import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { AdminTrialRequestsClient } from './AdminTrialRequestsClient'

export const metadata: Metadata = {
  title: 'Trial requests',
  robots: { index: false, follow: false },
}

export default async function AdminTrialRequestsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    redirect('/login?redirectTo=%2Fadmin%2Ftrial-requests')
  }

  return <AdminTrialRequestsClient />
}
