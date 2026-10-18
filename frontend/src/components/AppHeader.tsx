import {
  Button,
  Link,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from 'react-aria-components'
import { useAuth } from '@/auth/AuthContext'

export function AppHeader() {
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="app-header">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="app-header-brand">
        <Link href="/" className="brand-company">
          AMUEL
        </Link>
      </div>
      <div className="app-header-utilities">
        <MenuTrigger>
          <Button className="avatar-button" aria-label="Account menu">
            <span className="avatar-label">
              {isAuthenticated && user ? user.email : 'Account'}
            </span>
          </Button>
          <Popover className="user-menu-popover" placement="bottom end">
            {isAuthenticated && user ? (
              <div className="user-menu-profile">
                <div className="user-info">
                  <strong>{user.name || 'Signed in'}</strong>
                  <p>{user.email}</p>
                </div>
              </div>
            ) : null}
            <Menu
              className="user-menu"
              onAction={(key) => {
                if (key === 'logout') logout()
              }}
            >
              {isAuthenticated ? (
                <MenuItem id="logout" className="user-menu-item">
                  Log out
                </MenuItem>
              ) : (
                <MenuItem id="login" href="/login" className="user-menu-item">
                  Log in
                </MenuItem>
              )}
            </Menu>
          </Popover>
        </MenuTrigger>
      </div>
    </header>
  )
}
