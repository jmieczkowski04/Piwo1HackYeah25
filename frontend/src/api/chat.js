import api from './axios.js'
import { ep } from './endpoints.js'

// GET /event/:eventId/user/:userId/chat
export const getChat = (eventId, userId, params = {}) =>
  api.get(ep.chat(eventId, userId), { params })

// POST /event/:eventId/user/:userId/chat
export const sendChatMessage = (eventId, userId, body) => api.post(ep.chat(eventId, userId), body)
