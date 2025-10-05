import api from './axios.js'
import { ep } from './endpoints.js'

// POST /institution
export const createInstitution = (body) => api.post(ep.institution(), body)

// GET/PATCH/DEL /institution/:id
export const getInstitution = (id) => api.get(ep.institutionGet(id))
export const updateInstitution = (id, body) => api.patch(ep.institutionGet(id), body)
export const deleteInstitution = (id) => api.delete(ep.institutionGet(id))

// GET /institution/unconfirmed
export const listUnconfirmedInstitutions = (params = {}) =>
  api.get(ep.institutionUnconfirmed(), { params })

// POST /institution/:id/confirm
export const confirmInstitution = (id) => api.post(ep.institutionConfirm(id))

// POST/GET/PATCH/DEL /institution/:institutionId/user/:userId
export const addUserToInstitution = (institutionId, userId, body = {}) =>
  api.post(ep.institutionUser(institutionId, userId), body)

export const getInstitutionUser = (institutionId, userId) =>
  api.get(ep.institutionUser(institutionId, userId))

export const updateInstitutionUser = (institutionId, userId, body) =>
  api.patch(ep.institutionUser(institutionId, userId), body)

export const removeUserFromInstitution = (institutionId, userId) =>
  api.delete(ep.institutionUser(institutionId, userId))
