import { NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuthStore } from '../../store/authStore'

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const NAV_ICONS = [
  { to: '/accueil', key: 'browse' as const, icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', matchPaths: ['/accueil', '/films', '/series', '/ma-liste'] },
  { to: '/direct',    key: 'liveGuide' as const,  icon: 'M21 3H3v14h18V3zM8 21h8M12 17v4' },
  { to: '/library',   key: 'library' as const,    icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
  { to: '/downloads', key: 'downloads' as const,  icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3' },
  { to: '/history',   key: 'history' as const,    icon: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z M12 6v6l4 2' },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onToggleCollapse: () => void
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const logout = useAuthStore((s) => s.logout)
  const currentPath = window.location.pathname

  function handleLogout() {
    onCloseMobile()
    logout()
    navigate('/login')
  }

  function isActive(item: typeof NAV_ICONS[0]) {
    if (item.matchPaths) return item.matchPaths.some(p => currentPath.startsWith(p))
    return currentPath === item.to || currentPath.startsWith(item.to)
  }

  const sidebarWidth = collapsed ? '64px' : '200px'

  return (
    <>
      <aside
        className={[
          'flex flex-col flex-shrink-0 h-screen',
          'fixed lg:relative z-50 lg:z-auto',
          'transition-all duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        style={{
          width: sidebarWidth,
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Header: logo + toggle buttons */}
        <div
          className="flex items-center px-3 pt-4 pb-3 gap-2"
          style={{ minHeight: '60px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
        >
          {!collapsed && (
            <img
              src="/logo.png"
              alt="EmergingStream"
              className="flex-1 min-w-0"
              style={{ height: '26px', width: 'auto', objectFit: 'contain', objectPosition: 'left' }}
            />
          )}

          {/* Desktop collapse/expand toggle */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 transition-colors hover:bg-white/10"
            style={{ color: '#555', marginLeft: collapsed ? 'auto' : undefined, marginRight: collapsed ? 'auto' : undefined }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {collapsed
                ? <path d="M9 18l6-6-6-6" />
                : <path d="M15 18l-6-6 6-6" />
              }
            </svg>
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 hover:bg-white/10 transition-colors"
            style={{ color: '#888', marginLeft: 'auto' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col px-2 gap-0.5 flex-1 pt-2">
          {NAV_ICONS.map((item) => {
            const active = isActive(item)
            const label = t.sidebar[item.key]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                title={collapsed ? label : undefined}
                className="flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: active ? 'white' : '#666',
                  background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                  borderLeft: active ? '2px solid var(--color-gold)' : '2px solid transparent',
                  paddingLeft: collapsed ? '0' : '0.75rem',
                  paddingRight: collapsed ? '0' : '0.75rem',
                  justifyContent: collapsed ? 'center' : undefined,
                }}
              >
                <span style={{ color: active ? 'var(--color-gold)' : undefined, flexShrink: 0 }}>
                  <Icon d={item.icon} />
                </span>
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* 4K Upgrade card — hidden when collapsed */}
        {!collapsed && (
          <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: '#444' }}>{t.sidebar.levelOne}</p>
            <p className="text-[11px] text-white leading-snug mb-2.5">{t.sidebar.upgradeDesc}</p>
            <button
              className="w-full text-xs font-bold py-2 rounded-lg transition-colors"
              style={{ background: 'var(--color-gold)', color: '#000' }}
            >
              {t.sidebar.upgrade4k}
            </button>
          </div>
        )}

        {/* Collapsed: small upgrade icon */}
        {collapsed && (
          <div className="mx-2 mb-3 flex justify-center">
            <button
              title={t.sidebar.upgrade4k}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--color-gold)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="12,2 15,8.5 22,9.3 17,14 18.2,21 12,17.8 5.8,21 7,14 2,9.3 9,8.5" />
              </svg>
            </button>
          </div>
        )}

        {/* Bottom */}
        <div className="px-2 pb-4 flex flex-col gap-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem' }}>
          <NavLink
            to="/support"
            onClick={onCloseMobile}
            title={collapsed ? t.sidebar.support : undefined}
            className="flex items-center gap-3 py-2 rounded-lg text-sm transition-colors hover:text-white"
            style={{
              color: '#555',
              borderLeft: '2px solid transparent',
              paddingLeft: collapsed ? '0' : '0.75rem',
              paddingRight: collapsed ? '0' : '0.75rem',
              justifyContent: collapsed ? 'center' : undefined,
            }}
          >
            <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            {!collapsed && t.sidebar.support}
          </NavLink>
          <button
            onClick={handleLogout}
            title={collapsed ? t.sidebar.logout : undefined}
            className="flex items-center gap-3 py-2 rounded-lg text-sm transition-colors text-left hover:text-red-400"
            style={{
              color: '#555',
              borderLeft: '2px solid transparent',
              paddingLeft: collapsed ? '0' : '0.75rem',
              paddingRight: collapsed ? '0' : '0.75rem',
              justifyContent: collapsed ? 'center' : undefined,
            }}
          >
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
            {!collapsed && t.sidebar.logout}
          </button>
        </div>
      </aside>
    </>
  )
}
