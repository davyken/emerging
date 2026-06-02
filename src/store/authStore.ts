import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserData } from '../services/authApi'

interface AuthState {
  token: string | null
  user: UserData | null
  setAuth: (token: string, user: UserData) => void
  updateUser: (user: UserData) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'emerging-auth' }
  )
)
