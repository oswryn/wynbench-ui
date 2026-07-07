import { NavLink } from 'react-router-dom'
import { useStore } from '../state/store'

const navItems = [
  { to: '/connections', label: 'Connections' },
  { to: '/actions', label: 'Actions' },
  { to: '/workflows', label: 'Workflows' },
  { to: '/results', label: 'Results' },
]

function Sidebar() {
  const { connections, agentStatus } = useStore()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <p className="eyebrow">Wynbench</p>
        <h1>Agent UI</h1>
        <p>React + Vite starter for connection management, actions, workflows, and live results.</p>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <dl className="sidebar-meta">
        <div>
          <dt>Connections</dt>
          <dd>{connections.length}</dd>
        </div>
        <div>
          <dt>Agent</dt>
          <dd>{agentStatus}</dd>
        </div>
      </dl>
    </aside>
  )
}

export default Sidebar
