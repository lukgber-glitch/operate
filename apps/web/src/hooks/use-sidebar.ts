'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarStore {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
}

export const useSidebar = create<SidebarStore>()(
  persist(
    (set) => ({
      isOpen: false, // Collapsed by default - icon-only sidebar
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
)
