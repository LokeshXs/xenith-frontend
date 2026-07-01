import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { ResetPasswordForm } from './reset-password-form'

const RECOVERY_COOKIE = 'xenith-password-recovery'

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage() {
  const cookieStore = await cookies()
  const isRecoveryFlow = cookieStore.get(RECOVERY_COOKIE)?.value === '1'
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (!isRecoveryFlow || error || !data.user) {
    redirect('/forgot-password?error=invalid-link')
  }

  return <ResetPasswordForm />
}
