import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID

export function GoogleLogin() {
  const buttonRef = useRef<HTMLDivElement>(null)
  const { setAccessToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return

    const onSignIn = (response: google.accounts.id.CredentialResponse) => {
      if (!response.credential) return
      setAccessToken(response.credential)
      navigate('/', { replace: true })
    }

    const render = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return

      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: onSignIn,
        cancel_on_tap_outside: false,
      })

      buttonRef.current.replaceChildren()
      google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        width: 320,
      })

      google.accounts.id.prompt()
    }

    if (window.google?.accounts?.id) {
      render()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-gsi]',
    )
    if (existing) {
      existing.addEventListener('load', render)
      return () => existing.removeEventListener('load', render)
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.dataset.googleGsi = 'true'
    script.addEventListener('load', render)
    document.head.appendChild(script)

    return () => script.removeEventListener('load', render)
  }, [navigate, setAccessToken])

  if (!CLIENT_ID) {
    return (
      <p className="form-error" role="alert">
        Missing VITE_GOOGLE_OAUTH_CLIENT_ID
      </p>
    )
  }

  return <div className="signin-tile-content" ref={buttonRef} />
}
