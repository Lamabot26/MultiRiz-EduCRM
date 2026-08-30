'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  GraduationCap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/app-store'
import { SCHOOL } from '@/lib/school-data'
import Image from 'next/image'
import { AdminDashboard } from './admin-dashboard'
import { LeadsManager } from './leads-manager'
import { ReportsView } from './reports-view'

type AdminPage = 'dashboard' | 'leads' | 'reports' | 'settings'

const NAV_ITEMS: { id: AdminPage; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Lead Management', icon: Users },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function AdminApp() {
  const { admin, logout, setView } = useAppStore()
  const [currentPage, setCurrentPage] = useState<AdminPage>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setView('public')
  }

  const handleBackToSite = () => {
    setView('public')
  }

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
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-accent/30">
                <Image
                  src={SCHOOL.logo}
                  alt="SP International School"
                  fill
                  sizes="100%"
                  className="object-cover"
                />
              </div>
              <div>
                <div className="font-bold text-sm">SPIS Admin</div>
                <div className="text-xs text-background/60">CRM Portal</div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-8 h-8 rounded-full bg-background/10 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scroll">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-background/70 hover:bg-background/10 hover:text-background'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Bottom actions */}
          <div className="p-3 border-t border-background/10 space-y-1">
            <button
              onClick={handleBackToSite}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-background/70 hover:bg-background/10 hover:text-background transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Site
            </button>
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
                {admin?.name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{admin?.name || 'Administrator'}</div>
                <div className="text-xs text-background/60 truncate">{admin?.username}</div>
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
              <h1 className="text-lg font-bold text-foreground capitalize">
                {NAV_ITEMS.find((n) => n.id === currentPage)?.label}
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
            <Button
              onClick={handleBackToSite}
              variant="outline"
              size="sm"
              className="hidden sm:flex"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Public Site
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentPage === 'dashboard' && <AdminDashboard onNavigate={setCurrentPage} />}
              {currentPage === 'leads' && <LeadsManager />}
              {currentPage === 'reports' && <ReportsView />}
              {currentPage === 'settings' && (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">Settings</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      School settings, user management, and system configuration will be available here.
                    </p>
                    <div className="bg-white rounded-xl p-6 border border-border max-w-md mx-auto text-left">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">School Name:</span>
                          <span className="font-medium">{SCHOOL.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal:</span>
                          <span className="font-medium">{SCHOOL.principal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Admin User:</span>
                          <span className="font-medium">{admin?.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Campuses:</span>
                          <span className="font-medium">2 (City + Residential)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
