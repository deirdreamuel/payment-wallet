import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-aria-components'
import axios from 'axios'
import { api, withBearer } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { CreditCardTile } from '@/components/CreditCardTile'
import type { Payment } from '@/types/Payment'

export function WalletPage() {
  const { getAccessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const token = getAccessToken()
      if (!token) {
        logout()
        navigate('/login', { replace: true })
        return
      }

      try {
        const response = await api.get<Payment[]>('/wallet', {
          headers: withBearer(token),
        })
        if (!cancelled) setPayments(response.data)
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        if (!cancelled) setError('Could not load payment methods.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [getAccessToken, logout, navigate])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Wallet</h1>
        {!loading ? (
          <div className="page-actions">
            <Link href="/add" className="text-link button-link">
              Add
            </Link>
          </div>
        ) : null}
      </div>

      {loading ? <p className="status-text">Loading…</p> : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && payments.length === 0 ? (
        <div className="empty-state">
          <p>No payment methods.</p>
        </div>
      ) : null}

      <div className="wallet-list">
        {payments.map((payment) => (
          <CreditCardTile
            key={payment.id}
            nameOnCard={payment.name}
            lastDigits={payment.last_digits}
            scheme={payment.network}
            expiration={payment.expiration}
          />
        ))}
      </div>
    </div>
  )
}
