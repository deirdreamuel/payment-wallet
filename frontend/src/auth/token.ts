import { jwtDecode } from 'jwt-decode'

export type AuthUser = {
  name: string
  email: string
  picture: string
}

type JwtPayload = {
  name?: string
  email?: string
  picture?: string
  exp?: number
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  try {
    const { exp } = jwtDecode<JwtPayload>(token)
    if (!exp) return true
    return Date.now() >= (exp - skewSeconds) * 1000
  } catch {
    return true
  }
}

export function userFromToken(token: string): AuthUser | null {
  try {
    if (isTokenExpired(token)) return null
    const decoded = jwtDecode<JwtPayload>(token)
    if (!decoded.email) return null
    return {
      name: decoded.name ?? '',
      email: decoded.email,
      picture: decoded.picture ?? '',
    }
  } catch {
    return null
  }
}
