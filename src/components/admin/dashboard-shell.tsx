'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  Bell,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SCHOOL } from '@/lib/school-data'
import Image from 'next/image'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Leads', href: '/dashboard/leads', icon: Users },
  { label: 'Students', href: '/dashboard/students', icon: GraduationCap },
  { label: 'Classes', href: '/dashboard/classes', icon: BookOpen },
  { label: 'Fees', href: '/dashboard/fees', icon: DollarSign },
  { label: 'Notices', href: '/dashboard/notices', icon: Bell },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Users', href: '/dashboard/users', icon: UserCog },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface DashboardShellProps {
  user: {
    id: string
    username: string
    name: string
    email: string | null
    role: string
  }
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const currentNav = NAV_ITEMS.find((item) =>
    item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
  )

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-foreground text-background z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-background/10 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-accent/30">
                <Image
                  src={SCHOOL.logo}
                  alt="SP International School"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-sm">SPIS Admin</div>
                <div className="text-xs text-background/60">CRM Portal</div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-full bg-background/10 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scroll">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-background/70 hover:bg-background/10 hover:text-background'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-3 border-t border-background/10 space-y-1">
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-background/70 hover:bg-background/10 hover:text-background transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Site
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* User info */}
          <div className="p-3 border-t border-background/10">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name}</div>
                <div className="text-xs text-background/60 truncate">{user.username} · {user.role}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                {currentNav && <currentNav.icon className="w-5 h-5 text-primary" />}
                {currentNav?.label || 'Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground">
                SP International School — Admission CRM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Admissions Open 2026-27
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Public Site
              </Button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
