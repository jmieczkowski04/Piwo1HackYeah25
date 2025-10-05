import api from './axios.js'
import { ep } from './endpoints.js'

// POST /event/:eventId/group
export const createGroupForEvent = (eventId, body) => api.post(ep.eventGroup(eventId), body)

// GET/PATCH/DEL /event/:eventId/group/:groupId
export const getEventGroup = (eventId, groupId) => api.get(ep.eventGroupGet(eventId, groupId))
export const updateEventGroup = (eventId, groupId, body) =>
  api.patch(ep.eventGroupGet(eventId, groupId), body)
export const deleteEventGroup = (eventId, groupId) => api.delete(ep.eventGroupGet(eventId, groupId))

// POST /event/:eventId/group/:groupId/user  (body: { user_id })
// GET/DEL /event/:eventId/group/:groupId/user/:userId
export const addUserToEventGroup = (eventId, groupId, userId) =>
  api.post(ep.eventGroupUser(eventId, groupId), { user_id: userId })

export const getUserInEventGroup = (eventId, groupId, userId) =>
  api.get(ep.eventGroupUserGet(eventId, groupId, userId))

export const removeUserFromEventGroup = (eventId, groupId, userId) =>
  api.delete(ep.eventGroupUserGet(eventId, groupId, userId))
