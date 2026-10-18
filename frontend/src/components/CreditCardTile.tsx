import { Button } from 'react-aria-components'
import { PaymentNetworkLogo } from '@/components/PaymentNetworkLogo'

type CreditCardTileProps = {
  nameOnCard: string
  lastDigits: string
  scheme: string
  expiration: string
}

export function CreditCardTile({
  nameOnCard,
  lastDigits,
  scheme,
  expiration,
}: CreditCardTileProps) {
  return (
    <Button className="credit-card-tile">
      <div className="credit-card-container">
        <PaymentNetworkLogo network={scheme} />
        <div className="credit-card-meta">
          <strong>•••• {lastDigits}</strong>
          <p>{nameOnCard}</p>
          <p className="exp">Expires {expiration}</p>
        </div>
      </div>
    </Button>
  )
}
