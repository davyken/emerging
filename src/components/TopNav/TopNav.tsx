import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'

interface TopNavProps {
  onMenuClick: () => void
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const { t, lang, toggle } = useLanguage()
  const initial = 'U'

  const NAV_LINKS = [
    { to: '/accueil', label: t.topNav.home },
    { to: '/films', label: t.topNav.films },
    { to: '/series', label: t.topNav.tvShows },
    { to: '/direct', label: t.topNav.liveTV },
    { to: '/ma-liste', label: t.topNav.myList },
  ]

  return (
    <div
      className="flex items-center gap-3 px-3 lg:px-6 h-11 flex-shrink-0"
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

      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold cursor-pointer flex-shrink-0"
        style={{ background: 'var(--color-gold)', color: '#000' }}
      >
        {initial}
      </div>
    </div>
  )
}
