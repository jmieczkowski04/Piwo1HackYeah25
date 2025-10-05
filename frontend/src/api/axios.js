import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false, // TODO zmień na true jeśli backend ustawia cookies
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const status = error?.response?.status
    const message =
      error?.response?.data?.message || error?.message || `${status || ''} request error`
    return Promise.reject(new Error(message))
  },
)

export default api
