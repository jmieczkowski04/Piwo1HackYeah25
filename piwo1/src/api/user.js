import api from './axios.js'
import { ep } from './endpoints.js'

// /user/me
export const getMe = () => api.get(ep.me())

// /user/:id
export const getUser = (id) => api.get(ep.user(id))

// GET/POST /user/:id/localization
export const getUserLocalization = (id) => api.get(ep.userLocalization(id))
export const setUserLocalization = (id, body) => api.post(ep.userLocalization(id), body)

// GET /events/all/users/:id
export const listEventsForUser = (userId, params = {}) =>
  api.get(ep.eventsForUser(userId), { params })
