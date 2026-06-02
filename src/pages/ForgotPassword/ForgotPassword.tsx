import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../services/authApi'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Something went wrong. Please try again.'
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

        {sent ? (
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-base mb-2">Check your inbox</h2>
            <p className="text-xs mb-6" style={{ color: 'var(--color-text-muted)' }}>
              If an account exists for <span style={{ color: 'var(--color-gold)' }}>{email}</span>, a reset link has been sent. Check your spam folder too.
            </p>
            <Link
              to="/login"
              className="text-xs font-semibold hover:underline"
              style={{ color: 'var(--color-gold)' }}
            >
              ← Back to login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-white font-semibold text-base text-center mb-1">Forgot password?</h2>
            <p className="text-xs text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

              <button type="submit" disabled={loading} className="auth-btn mt-1">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p className="text-center text-xs mt-6">
              <Link
                to="/login"
                className="font-semibold hover:underline"
                style={{ color: 'var(--color-gold)' }}
              >
                ← Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
