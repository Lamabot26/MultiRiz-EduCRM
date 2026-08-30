'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, UserPlus, FileText, Users, School, CalendarCheck,
  ReceiptIndianRupee, Layers, IndianRupee, Percent, Undo2, BarChart3,
  Megaphone, UserCog, ScrollText, Settings, GraduationCap, Menu, LogOut,
  type LucideIcon,
} from 'lucide-react';
import { can, canAny, PERMISSIONS, ROLE_LABELS, type PermissionKey } from '@/lib/rbac';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ShellUser = { id: string; name: string; email: string; roles: string[] };

type NavItem = { href: string; label: string; icon: LucideIcon; perms: PermissionKey[] };
type NavSection = { title: string; items: NavItem[] };

// Nav items are filtered by RBAC permissions via can() (client-safe — rbac
// imports only constants, no server modules).
const NAV: NavSection[] = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, perms: [] },
      { href: '/dashboard/leads', label: 'Leads', icon: UserPlus, perms: [PERMISSIONS.LEADS_READ_ALL, PERMISSIONS.LEADS_READ_ASSIGNED, PERMISSIONS.LEADS_WRITE] },
      { href: '/dashboard/applications', label: 'Applications', icon: FileText, perms: [PERMISSIONS.APPLICATIONS_MANAGE] },
      { href: '/dashboard/students', label: 'Students', icon: Users, perms: [PERMISSIONS.STUDENTS_READ_ALL, PERMISSIONS.STUDENTS_READ_LIMITED] },
      { href: '/dashboard/classes', label: 'Classes', icon: School, perms: [PERMISSIONS.CLASSES_MANAGE] },
      { href: '/dashboard/attendance', label: 'Attendance', icon: CalendarCheck, perms: [PERMISSIONS.ATTENDANCE_MARK, PERMISSIONS.ATTENDANCE_READ] },
    ],
  },
  {
    title: 'Fees',
    items: [
      { href: '/dashboard/fees/invoices', label: 'Invoices', icon: ReceiptIndianRupee, perms: [PERMISSIONS.FEES_PAYMENTS_READ, PERMISSIONS.FEES_INVOICES_GENERATE] },
      { href: '/dashboard/fees/structures', label: 'Fee Structures', icon: Layers, perms: [PERMISSIONS.FEES_STRUCTURES_MANAGE] },
      { href: '/dashboard/fees/payments', label: 'Collections', icon: IndianRupee, perms: [PERMISSIONS.FEES_PAYMENTS_OFFLINE] },
      { href: '/dashboard/fees/concessions', label: 'Concessions', icon: Percent, perms: [PERMISSIONS.FEES_CONCESSION_REQUEST, PERMISSIONS.FEES_CONCESSION_APPROVE] },
      { href: '/dashboard/fees/refunds', label: 'Refunds', icon: Undo2, perms: [PERMISSIONS.FEES_REFUND_REQUEST, PERMISSIONS.FEES_REFUND_APPROVE] },
    ],
  },
  {
    title: 'Administration',
    items: [
      { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, perms: [PERMISSIONS.REPORTS_READ] },
      { href: '/dashboard/notices', label: 'Notices', icon: Megaphone, perms: [PERMISSIONS.NOTICES_MANAGE] },
      { href: '/dashboard/users', label: 'Users', icon: UserCog, perms: [PERMISSIONS.USERS_MANAGE] },
      { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: ScrollText, perms: [PERMISSIONS.AUDIT_READ] },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings, perms: [PERMISSIONS.SETTINGS_MANAGE] },
    ],
  },
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

function NavList({ user, onNavigate }: { user: ShellUser; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto px-3 py-4">
      {NAV.map((section) => {
        const items = section.items.filter((it) => it.perms.length === 0 || canAny(user.roles, it.perms));
        if (items.length === 0) return null;
        return (
          <div key={section.title} className="mb-4">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.title}
            </p>
            <ul className="space-y-1">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[40px]',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function UserBlock({ user, onSignOut }: { user: ShellUser; onSignOut: () => void }) {
  const roleLabel = user.roles.length > 0 ? (ROLE_LABELS[user.roles[0]] ?? user.roles[0]) : 'Staff';
  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground"
          aria-hidden
        >
          {initialsOf(user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/60">{roleLabel}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="h-8 w-8 shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
        <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
          SP International School
        </p>
        <span className="inline-block rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-sidebar-accent-foreground">
          ERP
        </span>
      </div>
    </div>
  );
}

export function DashboardShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const signOutNow = () => void signOut({ callbackUrl: '/' });

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop fixed navy sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Brand />
        <NavList user={user} />
        <UserBlock user={user} onSignOut={signOutNow} />
      </aside>

      {/* Mobile top bar with drawer trigger */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              className="h-10 w-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <div className="flex h-full flex-col">
              <Brand />
              <NavList user={user} onNavigate={() => setMobileOpen(false)} />
              <UserBlock user={user} onSignOut={signOutNow} />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 items-center gap-2">
          <GraduationCap className="h-5 w-5 shrink-0" aria-hidden />
          <span className="truncate text-sm font-semibold">SP International School</span>
          <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-bold tracking-widest">ERP</span>
        </div>
      </header>

      {/* Content area */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
