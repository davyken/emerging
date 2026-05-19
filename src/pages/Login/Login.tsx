import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'

export function Login() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => navigate('/accueil'), 600)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic corridor background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 80% at 50% 110%, #2a1c00 0%, #140e00 35%, #0a0a0a 65%),
            linear-gradient(180deg, #0a0a0a 0%, #0f0a00 100%)
          `,
        }}
      />

      {/* Corridor pillars / depth lines */}
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
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: '-20%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Form card */}
      <div className="relative z-10 w-full max-w-xs px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="EmergingStream" style={{ width: '200px', height: 'auto' }} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Email / Username */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {t.login.emailLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                className="auth-input"
                type="text"
                placeholder={t.login.emailPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {t.login.passwordLabel}
              </label>
              <button
                type="button"
                className="text-xs hover:underline"
                style={{ color: 'var(--color-gold)' }}
              >
                {t.login.forgotPassword}
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-[#C9A84C]"
            />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {t.login.rememberMe}
            </span>
          </label>

          {/* Submit */}
          <button type="submit" disabled={loading} className="auth-btn mt-1">
            {loading ? t.login.signingIn : t.login.signIn}
          </button>
        </form>

        {/* Register links */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          {t.login.noAccount}{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>
            {t.login.createAccount}
          </Link>
        </p>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          {t.login.exclusiveInvite}{' '}
          <Link to="/invite" className="font-semibold hover:underline" style={{ color: 'var(--color-teal)' }}>
            {t.login.activateHere}
          </Link>
        </p>

        {/* Social icons */}
        <div className="flex justify-center gap-4 mt-5">
          <button className="text-gray-600 hover:text-gray-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </button>
          <button className="text-gray-600 hover:text-gray-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </button>
        </div>

        {/* Copyright */}
        <p className="text-center mt-8 text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-text-dim)' }}>
          {t.login.copyright}
        </p>
      </div>
    </div>
  )
}
