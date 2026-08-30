'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  username: string
  name: string
  role: string
}

interface AppState {
  // Admin auth
  admin: AdminUser | null
  setAdmin: (admin: AdminUser | null) => void
  logout: () => void

  // View mode: 'public' | 'admin'
  view: 'public' | 'admin'
  setView: (view: 'public' | 'admin') => void

  // Admin login modal
  showAdminLogin: boolean
  setShowAdminLogin: (show: boolean) => void

  // Enquiry modal
  showEnquiry: boolean
  setShowEnquiry: (show: boolean) => void

  // Virtual tour modal
  showTour: boolean
  setShowTour: (show: boolean) => void

  // Active section for nav highlighting
  activeSection: string
  setActiveSection: (section: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      admin: null,
      setAdmin: (admin) => set({ admin }),
      logout: () => set({ admin: null, view: 'public' }),

      view: 'public',
      setView: (view) => set({ view }),

      showAdminLogin: false,
      setShowAdminLogin: (show) => set({ showAdminLogin: show }),

      showEnquiry: false,
      setShowEnquiry: (show) => set({ showEnquiry: show }),

      showTour: false,
      setShowTour: (show) => set({ showTour: show }),

      activeSection: 'home',
      setActiveSection: (section) => set({ activeSection: section }),
    }),
    {
      name: 'spis-app-store',
      partialize: (state) => ({ admin: state.admin, view: state.view }),
    }
  )
)
