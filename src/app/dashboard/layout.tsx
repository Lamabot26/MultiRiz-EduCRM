import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'
import { DashboardShell } from '@/components/admin/dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  if (!user) {
    redirect('/login?callbackUrl=/dashboard')
  }

  return <DashboardShell user={user}>{children}</DashboardShell>
}
