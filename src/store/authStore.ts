import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  serverUrl: string | null
  username: string | null
  setAuth: (token: string, serverUrl: string, username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      serverUrl: null,
      username: null,
      setAuth: (token, serverUrl, username) => set({ token, serverUrl, username }),
      logout: () => set({ token: null, serverUrl: null, username: null }),
    }),
    { name: 'emerging-auth' }
  )
)
