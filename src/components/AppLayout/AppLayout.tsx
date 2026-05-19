import { Outlet } from 'react-router-dom'
import { Sidebar } from '../Sidebar/Sidebar'
import { TopNav } from '../TopNav/TopNav'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
