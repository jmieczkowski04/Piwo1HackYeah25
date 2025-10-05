import api from './axios.js'
import { ep } from './endpoints.js'

// POST /event
export const createEvent = (body) => api.post(ep.event(), body)

// GET/PATCH/DEL /event/:eventId
export const getEvent = (eventId) => api.get(ep.eventGet(eventId))
export const updateEvent = (eventId, body) => api.patch(ep.eventGet(eventId), body)
export const deleteEvent = (eventId) => api.delete(ep.eventGet(eventId))

// GET /event/unconfirmed
export const listUnconfirmedEvents = (params = {}) => api.get(ep.eventUnconfirmed(), { params })

// POST /event/:eventId/confirm
export const confirmEvent = (eventId) => api.post(ep.eventConfirm(eventId))
