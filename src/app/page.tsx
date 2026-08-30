'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/app-store'
import { PublicSite } from '@/components/public/public-site'
import { AdminApp } from '@/components/admin/admin-app'

export default function Home() {
  const view = useAppStore((s) => s.view)
  const admin = useAppStore((s) => s.admin)

  // Sync view with admin state on mount
  useEffect(() => {
    if (!admin && view === 'admin') {
      useAppStore.getState().setView('public')
    }
  }, [admin, view])

  // Scroll to top when switching views
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view])

  if (view === 'admin' && admin) {
    return <AdminApp />
  }

  return <PublicSite />
}
