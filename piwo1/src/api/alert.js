import api from './axios.js'
import { ep } from './endpoints.js'

// POST /event/:eventId/alert
export const createAlert = (eventId, body) => api.post(ep.alert(eventId), body)

// GET/PATCH/DEL /event/:eventId/alert/:alertId
export const getAlert = (eventId, alertId) => api.get(ep.alertGet(eventId, alertId))
export const updateAlert = (eventId, alertId, body) =>
  api.patch(ep.alertGet(eventId, alertId), body)
export const deleteAlert = (eventId, alertId) => api.delete(ep.alertGet(eventId, alertId))
