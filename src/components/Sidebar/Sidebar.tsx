import { NavLink, useNavigate } from 'react-router-dom'

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const NAV_ITEMS = [
  {
    to: '/accueil',
    label: 'Browse',
    icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
    matchPaths: ['/accueil', '/films', '/series', '/ma-liste'],
  },
  {
    to: '/direct',
    label: 'Live Guide',
    icon: 'M21 3H3v14h18V3zM8 21h8M12 17v4',
  },
  {
    to: '/library',
    label: 'Library',
    icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  },
  {
    to: '/downloads',
    label: 'Downloads',
    icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  },
  {
    to: '/history',
    label: 'History',
    icon: 'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z M12 6v6l4 2',
  },
]

export function Sidebar() {
  const navigate = useNavigate()
  const currentPath = window.location.pathname

  function handleLogout() {
    navigate('/login')
  }

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (item.matchPaths) return item.matchPaths.some(p => currentPath.startsWith(p))
    return currentPath === item.to || currentPath.startsWith(item.to)
  }

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen"
      style={{ width: '200px', background: '#0d0d0d', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <img src="/logo.png" alt="EmergingStream" style={{ width: '140px', height: 'auto' }} />
      </div>

      {/* Nav */}
      <nav className="flex flex-col px-2 gap-0.5 flex-1 pt-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                color: active ? 'white' : '#666',
                background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                borderLeft: active ? '2px solid var(--color-gold)' : '2px solid transparent',
              }}
            >
              <span style={{ color: active ? 'var(--color-gold)' : undefined }}>
                <Icon d={item.icon} />
              </span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* 4K Upgrade */}
      <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[9px] tracking-widest uppercase mb-1" style={{ color: '#444' }}>Level One</p>
        <p className="text-[11px] text-white leading-snug mb-2.5">Upgrade to 4K Cinema Quality</p>
        <button
          className="w-full text-xs font-bold py-2 rounded-lg transition-colors"
          style={{ background: 'var(--color-gold)', color: '#000' }}
        >
          Upgrade to 4K
        </button>
      </div>

      {/* Bottom */}
      <div className="px-2 pb-4 flex flex-col gap-0.5">
        <NavLink
          to="/support"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: '#555', borderLeft: '2px solid transparent' }}
        >
          <Icon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          Support
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left hover:text-red-400"
          style={{ color: '#555', borderLeft: '2px solid transparent' }}
        >
          <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
          Logout
        </button>
      </div>
    </aside>
  )
}
