import api from './axios.js'
import { ep } from './endpoints.js'

// POST /user/:userId/notification
export const createNotification = (userId, body) => api.post(ep.notification(userId), body)

// GET/PATCH/DEL /user/:userId/notification/:id
export const getNotification = (userId, id) => api.get(ep.notificationGet(userId, id))
export const updateNotification = (userId, id, body) =>
  api.patch(ep.notificationGet(userId, id), body)
export const deleteNotification = (userId, id) => api.delete(ep.notificationGet(userId, id))
