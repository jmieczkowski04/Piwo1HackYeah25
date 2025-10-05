import api from './axios.js'
import { ep } from './endpoints.js'

// POST /user/:userId/opinion
export const createOpinion = (userId, body) => api.post(ep.opinion(userId), body)

// GET/PATCH/DEL /user/:userId/opinion/:opinionId
export const getOpinion = (userId, opinionId) => api.get(ep.opinionGet(userId, opinionId))
export const updateOpinion = (userId, opinionId, body) =>
  api.patch(ep.opinionGet(userId, opinionId), body)
export const deleteOpinion = (userId, opinionId) => api.delete(ep.opinionGet(userId, opinionId))
