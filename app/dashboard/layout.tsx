import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { BackendStatusGate } from '@/components/backend-status-gate'
import { fetchBillingStatus } from '@/lib/services/billing'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { DashboardSidebar } from './components/DashboardSidebar'
import { DashboardMobileHeader } from './components/DashboardMobileHeader'
import { TwitterConnectGate } from './components/TwitterConnectGate'

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

  const billing = await fetchBillingStatus(session.access_token)
  if (billing.kind === 'unauthorized') redirect('/signout')
  if (billing.kind === 'error' || !billing.data.has_access) redirect('/onboarding')

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
