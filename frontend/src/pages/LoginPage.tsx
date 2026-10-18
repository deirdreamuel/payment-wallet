import { Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { GoogleLogin } from '@/components/GoogleLogin'

export function LoginPage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="login-page">
      <div className="login-brand">AMUEL</div>
      <p className="login-copy">Sign in to manage your payment methods.</p>
      <GoogleLogin />
    </div>
  )
}
