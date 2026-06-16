import { useState, FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../services/authApi'

export function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(null)
    setLoading(true)
    try {
      const { data } = await authApi.resetPassword(token!, password)
      setDone(true)
      if (data.token) {
        // auto-login after reset if server returns a token
        setTimeout(() => navigate('/login'), 2000)
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Reset failed. The link may have expired.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 80% at 50% 110%, #2a1c00 0%, #140e00 35%, #0a0a0a 65%),
            linear-gradient(180deg, #0a0a0a 0%, #0f0a00 100%)
          `,
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div
            key={`l${i}`}
            className="absolute bottom-0 left-1/2 origin-bottom"
            style={{
              width: '1px',
              height: '100%',
              background: `linear-gradient(to top, rgba(180,130,40,${0.12 - i * 0.02}) 0%, transparent 60%)`,
              transform: `translateX(${-(i + 1) * 80}px) rotate(${-(i + 1) * 3}deg)`,
            }}
          />
        ))}
        {[...Array(5)].map((_, i) => (
          <div
            key={`r${i}`}
            className="absolute bottom-0 left-1/2 origin-bottom"
            style={{
              width: '1px',
              height: '100%',
              background: `linear-gradient(to top, rgba(180,130,40,${0.12 - i * 0.02}) 0%, transparent 60%)`,
              transform: `translateX(${(i + 1) * 80}px) rotate(${(i + 1) * 3}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-xs px-4">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="EmergingStream" style={{ width: '200px', height: 'auto' }} />
        </div>

        {done ? (
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-base mb-2">Password updated!</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Redirecting you to login…
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-white font-semibold text-base text-center mb-1">Set new password</h2>
            <p className="text-xs text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Choose a strong password for your account.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  New password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    className="auth-input"
                    style={{ paddingRight: '2.75rem' }}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    }
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Confirm password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

              <button type="submit" disabled={loading} className="auth-btn mt-1">
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>

            <p className="text-center text-xs mt-6">
              <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>
                ← Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
