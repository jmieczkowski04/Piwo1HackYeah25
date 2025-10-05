import api from './axios.js'
import { ep } from './endpoints.js'

// GET /event/:eventId/user/:userId
export const getCertificate = (eventId, userId, params = {}) =>
  api.get(ep.certificate(eventId, userId), { params })
