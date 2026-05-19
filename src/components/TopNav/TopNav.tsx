import { useRef, useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { t, lang, toggle } = useLanguage()
  const navigate = useNavigate()
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const NAV_LINKS = [
    { to: '/accueil', label: t.topNav.home },
    { to: '/films', label: t.topNav.films },
    { to: '/series', label: t.topNav.tvShows },
    { to: '/direct', label: t.topNav.liveTV },
    { to: '/ma-liste', label: t.topNav.myList },
  ]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    if (showProfile) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfile])

  function handleLogout() {
    setShowProfile(false)
    navigate('/login')
  }

  return (
    <div
      className="flex items-center gap-3 px-3 lg:px-6 h-11 flex-shrink-0 relative"
      style={{
        background: 'rgba(10,10,10,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-colors hover:bg-white/10"
        style={{ color: '#888' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Nav links — hidden on mobile */}
      <div className="hidden lg:flex items-center gap-5">
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `text-xs font-medium transition-colors pb-0.5 whitespace-nowrap ${
                isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { borderBottom: '2px solid var(--color-gold)', color: 'var(--color-gold)' }
                : { borderBottom: '2px solid transparent' }
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className="flex-1" />

      {/* Search — hidden on small mobile */}
      <div className="relative hidden sm:block">
        <input
          type="text"
          placeholder={t.topNav.search}
          className="text-xs pl-7 pr-3 py-1.5 rounded-lg outline-none w-28 focus:w-40 transition-all"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'white',
          }}
        />
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* Language toggle */}
      <button
        onClick={toggle}
        className="text-xs font-bold px-2 py-1 rounded-md transition-colors flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-gold)', border: '1px solid rgba(201,168,76,0.25)', letterSpacing: '0.05em' }}
        title={lang === 'en' ? 'Switch to French' : 'Passer en anglais'}
      >
        {lang === 'en' ? 'FR' : 'EN'}
      </button>

      {/* Bell — hidden on mobile */}
      <button className="hidden sm:block text-gray-500 hover:text-white transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {/* Settings — hidden on mobile */}
      <button className="hidden lg:block text-gray-500 hover:text-white transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
        </svg>
      </button>

      {/* Avatar + profile dropdown */}
      <div ref={profileRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowProfile(v => !v)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold cursor-pointer transition-all"
          style={{
            background: showProfile ? 'var(--color-gold)' : 'var(--color-gold)',
            color: '#000',
            outline: showProfile ? '2px solid rgba(201,168,76,0.5)' : 'none',
            outlineOffset: '2px',
          }}
        >
          A
        </button>

        {/* Profile panel */}
        {showProfile && (
          <div
            className="absolute right-0 top-full mt-2 rounded-xl z-50 overflow-hidden"
            style={{
              width: '280px',
              background: '#111',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-black flex-shrink-0" style={{ background: 'var(--color-gold)', color: '#000' }}>
                  A
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">Alex Martin</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: '#666' }}>alex.martin@email.com</p>
                </div>
              </div>
            </div>

            {/* Subscription info */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] tracking-widest uppercase" style={{ color: '#555' }}>{t.profile.subscription}</p>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--color-gold)', border: '1px solid rgba(201,168,76,0.3)' }}
                >
                  {t.profile.status}
                </span>
              </div>

              <div className="rounded-lg px-3 py-2.5 mb-3" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2">
                    <polygon points="12,2 15,8.5 22,9.3 17,14 18.2,21 12,17.8 5.8,21 7,14 2,9.3 9,8.5" />
                  </svg>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>{t.profile.plan}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>{t.profile.memberSince}</p>
                  <p className="text-[11px] font-semibold text-white leading-tight">{t.profile.memberSinceValue}</p>
                </div>
                <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#555' }}>{t.profile.renewal}</p>
                  <p className="text-[11px] font-semibold text-white leading-tight">{t.profile.renewalValue}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-2 py-2">
              <button
                onClick={() => setShowProfile(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5 text-left"
                style={{ color: '#888' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                {t.profile.accountSettings}
              </button>
              <button
                onClick={() => setShowProfile(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5 text-left"
                style={{ color: '#888' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {t.profile.help}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-red-500/10 text-left"
                style={{ color: '#ef4444' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t.profile.logout}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
