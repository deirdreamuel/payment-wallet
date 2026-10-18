import { Outlet } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { RouterProvider } from 'react-aria-components'
import { useNavigate, useHref } from 'react-router-dom'
import type { NavigateOptions } from 'react-router-dom'

declare module 'react-aria-components' {
  interface RouterConfig {
    routerOptions: NavigateOptions
  }
}

export function AppLayout() {
  const navigate = useNavigate()

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <div className="app-shell">
        <AppHeader />
        <main id="main" className="app-content">
          <Outlet />
        </main>
      </div>
    </RouterProvider>
  )
}
