import api from './axios.js'
import { ep } from './endpoints.js'

// GET /group/:groupId/user/free
export const listFreeUsersForGroup = (groupId, params = {}) =>
  api.get(ep.groupUsersFree(groupId), { params })

// POST /group/:groupId/task
export const createTask = (groupId, body) => api.post(ep.task(groupId), body)

// GET/PATCH/DEL /group/:groupId/task/:taskId
export const getTask = (groupId, taskId) => api.get(ep.taskGet(groupId, taskId))
export const updateTask = (groupId, taskId, body) => api.patch(ep.taskGet(groupId, taskId), body)
export const deleteTask = (groupId, taskId) => api.delete(ep.taskGet(groupId, taskId))

// POST /group/:groupId/task/:taskId/user   (body: { user_id })
export const addUserToTask = (groupId, taskId, userId) =>
  api.post(ep.taskUser(groupId, taskId), { user_id: userId })

// GET/DEL /group/:groupId/task/:taskId/user/:userId
export const getUserOnTask = (groupId, taskId, userId) =>
  api.get(ep.taskUserGet(groupId, taskId, userId))
export const removeUserFromTask = (groupId, taskId, userId) =>
  api.delete(ep.taskUserGet(groupId, taskId, userId))
