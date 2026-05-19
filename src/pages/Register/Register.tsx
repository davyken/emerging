import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (!accepted) {
      setError("Vous devez accepter les conditions d'utilisation.")
      return
    }
    setError(null)
    setLoading(true)
    setTimeout(() => navigate('/accueil'), 600)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-8 px-4">
      {/* Theater background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 0%, #1a1200 0%, #0d0900 40%, #080604 100%)
          `,
        }}
      />

      {/* Cinema seat rows — diagonal lines suggesting an auditorium */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0"
            style={{
              top: `${8 + i * 8}%`,
              height: '1px',
              background: `linear-gradient(90deg, transparent 0%, rgba(100,70,10,${0.06 + i * 0.005}) 20%, rgba(100,70,10,${0.06 + i * 0.005}) 80%, transparent 100%)`,
              transform: `perspective(800px) rotateX(${20 + i * 3}deg)`,
            }}
          />
        ))}
        {/* Screen glow at top */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-20"
          style={{
            width: '80%',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)',
          }}
        />
        {/* Vignette overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)',
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="flex justify-center mb-3">
            <img src="/logo.png" alt="EmergingStream" style={{ width: '200px', height: 'auto' }} />
          </div>
          <p className="text-white font-semibold text-base mb-1">Bienvenue dans l'Exclusivité</p>
          <p className="text-xs leading-relaxed px-4" style={{ color: 'var(--color-text-muted)' }}>
            Vous avez été invité à rejoindre{' '}
            <span style={{ color: 'var(--color-gold)' }}>EmergingStream</span>, la destination ultime du cinéma privé.
          </p>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span
            className="text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide"
            style={{
              background: 'var(--color-teal)',
              color: '#0a0a0a',
              letterSpacing: '0.05em',
            }}
          >
            ✦ OFFRE EXCLUSIVE - ESSAI GRATUIT 24H
          </span>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-xl p-6"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Full name */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Nom complet
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
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Adresse Email
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
                placeholder="infos@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password + Confirm side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '2.25rem', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                Confirmation
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  style={{ paddingLeft: '2.25rem', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded accent-[#C9A84C]"
            />
            <span className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              J'accepte les conditions d'utilisation et je souhaite activer mon essai gratuit de 24 heures immédiatement après l'inscription.
            </span>
          </label>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          {/* Submit */}
          <button type="submit" disabled={loading} className="auth-btn mt-1">
            {loading ? 'Création…' : <>CRÉER MON COMPTE &nbsp;→</>}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-xs mt-5" style={{ color: 'var(--color-text-muted)' }}>
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-gold)' }}>
            Se connecter
          </Link>
        </p>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>Sécurisé SSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            <span className="text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>4K HDR Ready</span>
          </div>
        </div>
      </div>
    </div>
  )
}
