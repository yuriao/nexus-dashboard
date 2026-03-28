import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  access: string | null
  refresh: string | null
  username: string | null
  setTokens: (access: string, refresh: string, username: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      access: null,
      refresh: null,
      username: null,
      setTokens: (access, refresh, username) => {
        localStorage.setItem('nexus_access', access)
        localStorage.setItem('nexus_refresh', refresh)
        set({ access, refresh, username })
      },
      logout: () => {
        localStorage.removeItem('nexus_access')
        localStorage.removeItem('nexus_refresh')
        set({ access: null, refresh: null, username: null })
      },
      isAuthenticated: () => !!get().access,
    }),
    { name: 'nexus-auth' }
  )
)
