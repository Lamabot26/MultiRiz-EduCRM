'use client'

import { create } from 'zustand'

interface AppState {
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

export const useAppStore = create<AppState>()((set) => ({
  showEnquiry: false,
  setShowEnquiry: (show) => set({ showEnquiry: show }),

  showTour: false,
  setShowTour: (show) => set({ showTour: show }),

  activeSection: 'home',
  setActiveSection: (section) => set({ activeSection: section }),
}))