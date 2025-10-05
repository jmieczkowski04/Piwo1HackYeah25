import api from './axios.js'
import { ep } from './endpoints.js'

// GET /event/:eventId/user/:userId
export const getCertificate = (eventId, userId, params = {}) =>
  api.get(ep.certificate(eventId, userId), { params })

// Gdy backend zwraca PDF/plik – odbierz jako blob:
export const getCertificateFile = (eventId, userId, params = {}) =>
  api.get(ep.certificate(eventId, userId), { params, responseType: 'blob' })
