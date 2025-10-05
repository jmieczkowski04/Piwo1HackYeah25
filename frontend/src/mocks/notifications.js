// frontend/src/mocks/notifications.js
const LS_KEY = 'mock_notifications_v1'

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
function save(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}
function nextId() {
  return 'n-' + Math.random().toString(36).slice(2, 10)
}

export function listMock(userId) {
  const db = load()
  return Object.values(db).filter((n) => n.user_id === userId)
}

export function createMock({ userId, type, condition }) {
  const db = load()
  const id = nextId()
  const rec = { id, user_id: userId, type, condition }
  db[id] = rec
  save(db)
  return JSON.parse(JSON.stringify(rec))
}

export function updateMock({ id, patch }) {
  const db = load()
  if (!db[id]) throw new Error('Not found (mock)')
  db[id] = { ...db[id], ...patch }
  save(db)
  return JSON.parse(JSON.stringify(db[id]))
}

export function deleteMock(id) {
  const db = load()
  delete db[id]
  save(db)
}