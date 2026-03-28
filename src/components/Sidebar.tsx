import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store'

const links = [
  { to: '/',           icon: '⚡', label: 'Dashboard' },
  { to: '/companies',  icon: '🏢', label: 'Companies' },
  { to: '/reports',    icon: '📊', label: 'Reports' },
  { to: '/feed',       icon: '📡', label: 'Intel Feed' },
]

export default function Sidebar() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Nexus <span>Intel</span></div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ marginBottom: 8, color: '#94a3b8' }}>👤 {username ?? 'user'}</div>
        <button className="btn btn-ghost" style={{ width: '100%', fontSize: '0.75rem' }} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
