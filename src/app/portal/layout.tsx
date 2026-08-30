import { requireUser } from '@/lib/auth-guard';
import { redirect } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { getSchoolSettings } from '@/lib/settings';
import { GraduationCap } from 'lucide-react';

export const metadata = { title: 'Parent & Student Portal' };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!user.roles.includes('PARENT') && !user.roles.includes('STUDENT')) {
    redirect('/dashboard');
  }
  const settings = await getSchoolSettings();

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <a href="/portal" className="flex items-center gap-2 min-w-0">
            <span className="h-8 w-8 rounded-lg sp-hero-gradient flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <span className="font-semibold text-sm truncate">{settings.schoolName}</span>
          </a>
          <PortalNav userName={user.name} />
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {settings.schoolName}</span>
          <span>{settings.phonePrimary} · {settings.emailPrimary}</span>
        </div>
      </footer>
    </div>
  );
}
