import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Form,
  Heading,
  Input,
  Label,
  Text,
  TextField,
  FieldError,
} from 'react-aria-components'
import axios from 'axios'
import valid from 'card-validator'
import * as yup from 'yup'
import { api, withBearer } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { encryptPaymentPayload } from '@/lib/encryption'

const schema = yup.object({
  name: yup.string().required('Name is required'),
  card_number: yup
    .string()
    .required('Card number is required')
    .test('card-number', 'Payment card number is invalid', (value) =>
      Boolean(value && valid.number(value).isValid),
    ),
  card_expiration: yup.string().required('Expiration is required'),
  address_line_1: yup.string().required('Address line 1 is required'),
  address_line_2: yup.string().optional(),
  address_city: yup.string().required('City is required'),
  address_state: yup.string().required('State is required'),
  address_country: yup.string().required('Country is required'),
  address_postal_code: yup
    .string()
    .required('Postal code is required')
    .test('postal-code', 'Postal code is invalid', (value) =>
      Boolean(value && valid.postalCode(value).isValid),
    ),
})

type FormValues = yup.InferType<typeof schema>
type FormErrors = Partial<Record<keyof FormValues, string>>

const emptyValues: FormValues = {
  name: '',
  card_number: '',
  card_expiration: '',
  address_line_1: '',
  address_line_2: '',
  address_city: '',
  address_state: '',
  address_country: '',
  address_postal_code: '',
}

export function AddPaymentForm() {
  const { getAccessToken, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadKey = async () => {
      const token = getAccessToken()
      if (!token) {
        logout()
        navigate('/login', { replace: true })
        return
      }

      try {
        const response = await api.get<{ public_key: string }>('/publickey', {
          headers: withBearer(token),
        })
        if (!cancelled) setPublicKey(response.data.public_key)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        if (!cancelled) setSubmitError('Could not load encryption key.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadKey()
    return () => {
      cancelled = true
    }
  }, [getAccessToken, logout, navigate])

  const setField = (name: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    try {
      const parsed = await schema.validate(values, { abortEarly: false })
      setErrors({})

      const token = getAccessToken()
      if (!token || !publicKey) {
        setSubmitError('Missing session or encryption key.')
        return
      }

      setCreating(true)
      const encrypted = await encryptPaymentPayload(publicKey, {
        name: parsed.name,
        card: {
          number: parsed.card_number,
          expiration: parsed.card_expiration,
        },
        address: {
          line_1: parsed.address_line_1,
          line_2: parsed.address_line_2 || undefined,
          city: parsed.address_city,
          state: parsed.address_state,
          country: parsed.address_country,
          postal_code: parsed.address_postal_code,
        },
      })

      await api.post(
        '/wallet',
        { encrypted_payload: encrypted },
        { headers: withBearer(token) },
      )
      setValues(emptyValues)
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const next: FormErrors = {}
        for (const issue of error.inner) {
          if (issue.path) next[issue.path as keyof FormValues] = issue.message
        }
        setErrors(next)
        return
      }

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }

      setSubmitError(
        error instanceof Error && !axios.isAxiosError(error)
          ? error.message
          : 'Could not add payment method.',
      )
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <p className="status-text">Loading...</p>
  }

  return (
    <Form className="payment-form" onSubmit={onSubmit}>
      <Disclosure className="form-disclosure" defaultExpanded>
        <Heading>
          <Button slot="trigger" className="disclosure-trigger">
            Billing
          </Button>
        </Heading>
        <DisclosurePanel className="form-fields">
          <Field
            label="Address Line 1"
            description="Enter address line"
            placeholder="123 Main St."
            value={values.address_line_1}
            error={errors.address_line_1}
            onChange={(v) => setField('address_line_1', v)}
            isRequired
          />
          <Field
            label="Address Line 2 (Optional)"
            description="Enter unit or apartment"
            placeholder="APT 123"
            value={values.address_line_2 ?? ''}
            error={errors.address_line_2}
            onChange={(v) => setField('address_line_2', v)}
          />
          <Field
            label="City"
            description="Enter city"
            placeholder="New York"
            value={values.address_city}
            error={errors.address_city}
            onChange={(v) => setField('address_city', v)}
            isRequired
          />
          <Field
            label="State"
            description="Enter state"
            placeholder="NY"
            value={values.address_state}
            error={errors.address_state}
            onChange={(v) => setField('address_state', v)}
            isRequired
          />
          <Field
            label="Country"
            description="Enter country"
            placeholder="US"
            value={values.address_country}
            error={errors.address_country}
            onChange={(v) => setField('address_country', v)}
            isRequired
          />
          <Field
            label="Postal Code"
            description="Enter postal code"
            placeholder="10036"
            value={values.address_postal_code}
            error={errors.address_postal_code}
            onChange={(v) => setField('address_postal_code', v)}
            isRequired
          />
        </DisclosurePanel>
      </Disclosure>

      <Disclosure className="form-disclosure" defaultExpanded>
        <Heading>
          <Button slot="trigger" className="disclosure-trigger">
            Payment Details
          </Button>
        </Heading>
        <DisclosurePanel className="form-fields">
          <Field
            label="Name"
            description="Enter name displayed on payment card"
            placeholder="Jane Doe"
            value={values.name}
            error={errors.name}
            onChange={(v) => setField('name', v)}
            isRequired
          />
          <Field
            label="Card number"
            description="Enter payment card number"
            placeholder="•••• •••• •••• ••••"
            value={values.card_number}
            error={errors.card_number}
            onChange={(v) => setField('card_number', v)}
            autoComplete="cc-number"
            isRequired
          />
          <Field
            label="Expiration"
            description="Enter payment card expiration"
            placeholder="MM/YYYY"
            value={values.card_expiration}
            error={errors.card_expiration}
            onChange={(v) => setField('card_expiration', v)}
            autoComplete="cc-exp"
            isRequired
          />
        </DisclosurePanel>
      </Disclosure>

      {submitError ? (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      {creating ? (
        <p className="status-text">Adding payment method...</p>
      ) : (
        <Button type="submit" className="primary-button">
          Submit
        </Button>
      )}
    </Form>
  )
}

function Field({
  label,
  description,
  placeholder,
  value,
  error,
  onChange,
  isRequired,
  autoComplete,
}: {
  label: string
  description: string
  placeholder: string
  value: string
  error?: string
  onChange: (value: string) => void
  isRequired?: boolean
  autoComplete?: string
}) {
  return (
    <TextField
      className="text-field"
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isInvalid={Boolean(error)}
      autoComplete={autoComplete}
    >
      <Label className="field-label">{label}</Label>
      <Input className="field-input" placeholder={placeholder} />
      <Text slot="description" className="field-description">
        {description}
      </Text>
      <FieldError className="field-error">{error}</FieldError>
    </TextField>
  )
}
