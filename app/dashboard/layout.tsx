import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { BackendStatusGate } from '@/components/backend-status-gate'
import { fetchBillingStatus } from '@/lib/services/billing'
import { fetchOnboardingStatus } from '@/lib/services/onboarding-status'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { DashboardSidebar } from './components/DashboardSidebar'
import { DashboardMobileHeader } from './components/DashboardMobileHeader'
import { TwitterConnectGate } from './components/TwitterConnectGate'

// Cascades to every /dashboard/* route: the app shell is private, so keep it
// out of search indexes. Individual pages still set their own `title`.
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) redirect('/login?redirectTo=%2Fdashboard')

  const [onboarding, billing] = await Promise.all([
    fetchOnboardingStatus(session.access_token),
    fetchBillingStatus(session.access_token),
  ])
  if (billing.kind === 'unauthorized' || onboarding.kind === 'unauthorized')
    redirect('/signout')
  if (billing.kind === 'error' || onboarding.kind === 'error') {
    redirect('/onboarding')
  }

  const hasRequiredOnboardingState =
    onboarding.data.steps.preferences &&
    onboarding.data.steps.xAccount &&
    onboarding.data.steps.styleProfile
  const hasActiveSubscription =
    billing.data.has_access && billing.data.status === 'active'

  if (!hasRequiredOnboardingState || !hasActiveSubscription) {
    redirect('/onboarding')
  }

  // The sidebar persists its open/collapsed state in this cookie; read it on the
  // server so the initial render matches and there's no flash on reload.
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

  return (
    <BackendStatusGate>
      <SidebarProvider defaultOpen={defaultOpen}>
        <DashboardSidebar />
        <SidebarInset>
          <TwitterConnectGate />
          <DashboardMobileHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </BackendStatusGate>
  )
}
