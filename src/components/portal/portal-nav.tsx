'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Receipt, Bell, UserRound, LogOut } from 'lucide-react';

const LINKS = [
  { href: '/portal', label: 'Home', icon: LayoutDashboard },
  { href: '/portal/fees', label: 'Fees', icon: Receipt },
  { href: '/portal/notices', label: 'Notices', icon: Bell },
  { href: '/portal/profile', label: 'Profile', icon: UserRound },
];

export function PortalNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="flex items-center gap-1" aria-label="Portal">
      <div className="hidden sm:flex items-center gap-1">
        {LINKS.map((l) => {
          const active = l.href === '/portal' ? pathname === '/portal' : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href} href={l.href}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          );
        })}
      </div>
      {/* mobile icons only */}
      <div className="flex sm:hidden items-center gap-1">
        {LINKS.map((l) => {
          const active = l.href === '/portal' ? pathname === '/portal' : pathname.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href} aria-label={l.label}
              className={`flex h-10 w-10 items-center justify-center rounded-md ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              <l.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
      <Button variant="ghost" size="icon" className="h-10 w-10 ml-1" title={`Sign out (${userName})`} aria-label="Sign out"
        onClick={() => signOut({ callbackUrl: '/' })}>
        <LogOut className="h-4 w-4" />
      </Button>
    </nav>
  );
}
