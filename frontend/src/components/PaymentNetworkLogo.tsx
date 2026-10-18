import mastercardLogo from '@/assets/mastercard-logo.png'
import visaLogo from '@/assets/visa-logo.png'

export function PaymentNetworkLogo({ network }: { network: string }) {
  const normalized = network?.toLowerCase()

  if (normalized === 'visa') {
    return <img width={50} src={visaLogo} alt="Visa" />
  }

  if (normalized === 'mastercard') {
    return <img width={50} src={mastercardLogo} alt="Mastercard" />
  }

  return <p className="network-fallback">{network}</p>
}
