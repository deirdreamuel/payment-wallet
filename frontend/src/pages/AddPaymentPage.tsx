import { Link } from 'react-aria-components'
import { AddPaymentForm } from '@/components/AddPaymentForm'

export function AddPaymentPage() {
  return (
    <div className="page">
      <Link href="/" className="text-link back-link">
        Back
      </Link>
      <div className="page-header">
        <h1 className="page-title">Add method</h1>
      </div>
      <AddPaymentForm />
    </div>
  )
}
