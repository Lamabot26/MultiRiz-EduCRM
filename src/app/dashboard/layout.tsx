import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth-guard';
import { DashboardShell } from '@/components/dashboard/shell';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'SP International School staff dashboard',
};

// Staff dashboard layout — requires login, wraps children in the
// navy-sidebar shell (fixed sidebar on lg+, Sheet drawer on mobile).
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
