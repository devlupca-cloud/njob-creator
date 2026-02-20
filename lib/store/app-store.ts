import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CreatorData, LoginData } from '@/lib/types/database'

// ─────────────────────────────────────────────────────────────────
// App Store — replaces Flutter's FFAppState
// ─────────────────────────────────────────────────────────────────

interface AppState {
  // Creator profile (loaded after login)
  creator: CreatorData | null

  // Login form state (persisted for "remember me")
  login: LoginData

  // Guest mode — user browsing without an account
  isGuest: boolean

  // Actions
  setCreator: (data: CreatorData) => void
  clearCreator: () => void
  setLogin: (data: Partial<LoginData>) => void
  clearLogin: () => void
  setGuest: (value: boolean) => void
}

const defaultLogin: LoginData = {
  email: '',
  password: '',
  remember: false,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      creator: null,
      login: defaultLogin,
      isGuest: false,

      setCreator: (data) => set({ creator: data }),
      clearCreator: () => set({ creator: null }),

      setLogin: (data) =>
        set((state) => ({ login: { ...state.login, ...data } })),
      clearLogin: () => set({ login: defaultLogin }),
      setGuest: (value) => set({ isGuest: value }),
    }),
    {
      name: 'njob-app-state',
      // Only persist login if remember is checked
      partialize: (state) =>
        state.login.remember
          ? { login: { email: state.login.email, password: '', remember: true } }
          : {},
    }
  )
)

// ─── Selector helpers ──────────────────────────────────────────────

export const useCreator = () => useAppStore((s) => s.creator)
export const useLogin = () => useAppStore((s) => s.login)
export const useIsGuest = () => useAppStore((s) => s.isGuest)
