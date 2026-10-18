import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isTokenExpired, userFromToken, type AuthUser } from '@/auth/token'

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAccessToken: (token: string) => void
  logout: () => void
  getAccessToken: () => string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // In-memory only — not written to localStorage/sessionStorage
  const [token, setToken] = useState<string | null>(() => {
    // Clear legacy tokens from the previous Svelte app if present
    try {
      localStorage.removeItem('access_token')
    } catch {
      /* ignore */
    }
    return null
  })

  const user = useMemo(() => (token ? userFromToken(token) : null), [token])
  const isAuthenticated = Boolean(token && user && !isTokenExpired(token))

  const setAccessToken = useCallback((next: string) => {
    if (isTokenExpired(next)) {
      setToken(null)
      return
    }
    setToken(next)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
  }, [])

  const getAccessToken = useCallback(() => {
    if (!token || isTokenExpired(token)) {
      setToken(null)
      return null
    }
    return token
  }, [token])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      setAccessToken,
      logout,
      getAccessToken,
    }),
    [token, user, isAuthenticated, setAccessToken, logout, getAccessToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
