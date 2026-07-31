import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server-client'
import { ContactSupportClient } from '../components/ContactSupportClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contact support' }

export default async function ContactSupportPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    redirect('/login')
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col p-4 sm:p-6 md:p-8">
      <ContactSupportClient />
    </div>
  )
}
