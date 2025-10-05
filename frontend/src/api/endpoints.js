export const ep = {
  //User
  me: () => '/user/me',
  user: (id) => `/user/${id}`,
  userLocalization: (id) => `/user/${id}/localization`,
  eventsForUser: (id) => `/events/all/users/${id}`,

  // Opinions
  opinion: (userId) => `/user/${userId}/opinion`,
  opinionGet: (userId, opinionId) => `/user/${userId}/opinion/${opinionId}`,

  // Notifications
  notification: (userId) => `/user/${userId}/notification`,
  notificationGet: (userId, id) => `/user/${userId}/notification/${id}`,

  // Tasks
  task: (groupId) => `/group/${groupId}/task`,
  taskGet: (groupId, taskId) => `/group/${groupId}/task/${taskId}`,
  taskUser: (groupId, taskId) => `/group/${groupId}/task/${taskId}/user`,
  taskUserGet: (groupId, taskId, userId) => `/group/${groupId}/task/${taskId}/user/${userId}`,
  groupUsersFree: (groupId) => `/group/${groupId}/user/free`,

  // Certificates / Chat
  certificate: (eventId, userId) => `/event/${eventId}/user/${userId}`,
  chat: (eventId, userId) => `/event/${eventId}/user/${userId}/chat`,

  // Events
  event: () => `/event`,
  eventGet: (eventId) => `/event/${eventId}`,
  eventUnconfirmed: () => `/event/unconfirmed`,
  eventConfirm: (eventId) => `/event/${eventId}/confirm`,

  // Groups
  eventGroup: (eventId) => `/event/${eventId}/group`,
  eventGroupGet: (eventId, groupId) => `/event/${eventId}/group/${groupId}`,
  eventGroupUser: (eventId, groupId) => `/event/${eventId}/group/${groupId}/user`,
  eventGroupUserGet: (eventId, groupId, userId) =>
    `/event/${eventId}/group/${groupId}/user/${userId}`,

  // Alerts
  alert: (eventId) => `/event/${eventId}/alert`,
  alertGet: (eventId, alertId) => `/event/${eventId}/alert/${alertId}`,

  // Institution
  institution: () => `/institution`,
  institutionGet: (id) => `/institution/${id}`,
  institutionUnconfirmed: () => `/institution/unconfirmed`,
  institutionConfirm: (id) => `/institution/${id}/confirm`,
  institutionUser: (institutionId, userId) => `/institution/${institutionId}/user/${userId}`,
}
