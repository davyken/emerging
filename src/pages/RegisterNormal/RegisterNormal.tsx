import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'

export function RegisterNormal() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError(t.registerNormal.passwordMismatch); return }
    setError(null)
    setLoading(true)
    setTimeout(() => navigate('/accueil'), 600)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 60% 80% at 50% 110%, #2a1c00 0%, #140e00 35%, #0a0a0a 65%), linear-gradient(180deg,#0a0a0a 0%,#0f0a00 100%)'
      }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_,i)=>(
          <div key={`l${i}`} className="absolute bottom-0 left-1/2 origin-bottom" style={{ width:'1px', height:'100%', background:`linear-gradient(to top,rgba(180,130,40,${0.1-i*0.015}) 0%,transparent 60%)`, transform:`translateX(${-(i+1)*90}px) rotate(${-(i+1)*3.5}deg)` }} />
        ))}
        {[...Array(5)].map((_,i)=>(
          <div key={`r${i}`} className="absolute bottom-0 left-1/2 origin-bottom" style={{ width:'1px', height:'100%', background:`linear-gradient(to top,rgba(180,130,40,${0.1-i*0.015}) 0%,transparent 60%)`, transform:`translateX(${(i+1)*90}px) rotate(${(i+1)*3.5}deg)` }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="EmergingStream" style={{ width: '200px', height: 'auto' }} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color:'var(--color-text-muted)' }}>{t.registerNormal.fullName}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input className="auth-input" type="text" placeholder="Jean Dupont" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color:'var(--color-text-muted)' }}>{t.registerNormal.email}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <input className="auth-input" type="email" placeholder="jean@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color:'var(--color-text-muted)' }}>{t.registerNormal.password}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input className="auth-input" style={{ paddingRight:'2.75rem' }} type={showPass?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
              <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {showPass ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color:'var(--color-text-muted)' }}>{t.registerNormal.confirm}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              <input className="auth-input" type={showPass?'text':'password'} placeholder="••••••••" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn mt-1">
            {loading ? t.registerNormal.creating : t.registerNormal.createAccount}
          </button>
        </form>

        <p className="text-center text-xs mt-5" style={{ color:'var(--color-text-muted)' }}>
          {t.registerNormal.alreadyAccount}{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color:'var(--color-gold)' }}>{t.registerNormal.signIn}</Link>
        </p>
        <p className="text-center text-xs mt-2" style={{ color:'var(--color-text-muted)' }}>
          {t.registerNormal.exclusiveInvite}{' '}
          <Link to="/invite" className="font-semibold hover:underline" style={{ color:'var(--color-teal)' }}>{t.registerNormal.activateHere}</Link>
        </p>
        <p className="text-center mt-6 text-[10px] tracking-widest uppercase" style={{ color:'var(--color-text-dim)' }}>
          {t.registerNormal.copyright}
        </p>
      </div>
    </div>
  )
}
