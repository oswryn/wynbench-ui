import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Alignment,
  Button,
  Classes,
  Icon,
  Menu,
  MenuItem,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  NavbarHeading,
  PopoverNext,
  PopoverInteractionKind,
  Tag,
  type IntentProps,
} from '@blueprintjs/core'
import type { IconName } from '@blueprintjs/icons'
import { testBackendConnection } from '../api/client'
import { useStore } from '../state/store'

const navItems: { to: string; label: string; icon: IconName }[] = [
  { to: '/connections', label: 'Connections', icon: 'link' },
  { to: '/workflows', label: 'Workflows', icon: 'exchange' },
  { to: '/results', label: 'Results', icon: 'history' },
  { to: '/settings', label: 'Settings', icon: 'cog' },
]

type ActionMenuItem =
  | { to: string; label: string }
  | { label: string; children: Array<{ to: string; label: string }> }

const actionsMenu: ActionMenuItem[] = [
  { to: '/actions?mode=http', label: 'HTTP' },
  { to: '/actions?mode=kafka', label: 'Kafka' },
  {
    label: 'SQL',
    children: [
      { to: '/actions?mode=sql-postgres', label: 'PostgreSQL' },
      { to: '/actions?mode=sql-mssql', label: 'MSSQL' },
    ],
  },
]

function TopNav() {
  const { connections, agentStatus, setAgentStatus, colorMode, setColorMode } = useStore()
  const [isTesting, setIsTesting] = useState(false)
  const [backendStatusText, setBackendStatusText] = useState('status unknown')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (agentStatus === 'online') {
      setBackendStatusText('online')
    } else if (agentStatus === 'offline') {
      setBackendStatusText('offline')
    } else {
      setBackendStatusText('checking')
    }
  }, [agentStatus])

  async function handleTestConnection() {
    setIsTesting(true)

    const result = await testBackendConnection()
    setAgentStatus(result.ok ? 'online' : 'offline')
    setBackendStatusText(result.ok ? `online (${result.url})` : 'offline (test failed)')

    setIsTesting(false)
  }

  const statusIntent: IntentProps['intent'] =
    agentStatus === 'online' ? 'success' : agentStatus === 'offline' ? 'danger' : 'none'

  return (
    <Navbar className="app-navbar">
      <NavbarGroup align={Alignment.START} className="nav-group-primary">
        <Link to="/" title="Wynbench home" className="brand-link">
          <NavbarHeading className="brand-mark">
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-label">Wynbench</span>
          </NavbarHeading>
        </Link>
        <NavbarDivider />
        <PopoverNext
          interactionKind={PopoverInteractionKind.HOVER}
          hoverOpenDelay={100}
          hoverCloseDelay={200}
          placement="bottom-start"
          positioningStrategy="fixed"
          rootBoundary="document"
          popoverClassName="navbar-popover"
          content={
            <Menu>
              {actionsMenu.map((item) =>
                'children' in item ? (
                  <MenuItem key={item.label} text={item.label}>
                    {item.children.map((child) => (
                      <MenuItem key={child.to} text={child.label} onClick={() => navigate(child.to)} />
                    ))}
                  </MenuItem>
                ) : (
                  <MenuItem key={item.to} text={item.label} onClick={() => navigate(item.to)} />
                ),
              )}
            </Menu>
          }
        >
          <Button
            minimal
            className={`${Classes.BUTTON} ${Classes.MINIMAL} nav-link${location.pathname === '/actions' ? ` ${Classes.ACTIVE}` : ''}`}
            icon="build"
            text="Actions"
          />
        </PopoverNext>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={item.label}
            className={({ isActive }) =>
              `${Classes.BUTTON} ${Classes.MINIMAL} nav-link${isActive ? ` ${Classes.ACTIVE}` : ''}`
            }
          >
            <Icon icon={item.icon} />
            <span className={Classes.BUTTON_TEXT}>{item.label}</span>
          </NavLink>
        ))}
      </NavbarGroup>

      <NavbarGroup align={Alignment.END} className="nav-group-secondary">
        <span className={`${Classes.TEXT_MUTED} nav-meta-text`}>{connections.length} connection(s)</span>
        <NavbarDivider />
        <Tag intent={statusIntent} minimal title={`Backend: ${backendStatusText}`}>
          <span className="nav-meta-text">Backend: </span>
          {backendStatusText}
        </Tag>
        <Button variant="minimal" icon="refresh" text="Test" loading={isTesting} onClick={handleTestConnection} />
        <NavbarDivider />
        <Button
          variant="minimal"
          icon={colorMode === 'dark' ? 'lightbulb' : 'moon'}
          title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color mode"
          onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
        />
      </NavbarGroup>
    </Navbar>
  )
}

export default TopNav
