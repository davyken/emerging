import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('emerging-auth')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`
    } catch {}
  }
  return config
})

export interface UserData {
  id: string
  name: string
  email: string
  avatar: string
  language: 'en' | 'fr'
  plan: string
  bio: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: UserData
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>('/auth/register', { name, email, password }),

  login: (identifier: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { identifier, password }),

  getProfile: () => api.get<UserData>('/user/profile'),

  updateProfile: (data: Partial<Pick<UserData, 'name' | 'email' | 'bio' | 'language' | 'avatar'>>) =>
    api.put<UserData>('/user/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/user/password', { currentPassword, newPassword }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post(`/auth/reset-password/${token}`, { password }),
}
