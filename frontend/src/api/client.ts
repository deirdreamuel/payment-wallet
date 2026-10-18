import axios from 'axios'

const baseURL = import.meta.env.VITE_PAYMENTS_API_BASE_URL

export const api = axios.create({
  baseURL,
  withCredentials: false,
})

export function withBearer(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}
