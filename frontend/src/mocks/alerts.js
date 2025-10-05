// frontend/src/mocks/alerts.js
const LS_KEY = 'mock_alerts_v1'

// Struktura: { [id]: { id, user_id, event_id, type, condition } }

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
  return 'a-' + Math.random().toString(36).slice(2, 10)
}

export function listMock({ eventId, userId }) {
  const db = load()
  return Object.values(db).filter(
    (a) => (!eventId || a.event_id === eventId) && (!userId || a.user_id === userId),
  )
}

export function createMock({ eventId, userId, type, condition }) {
  const db = load()
  const id = nextId()
  const rec = { id, user_id: userId, event_id: eventId, type, condition }
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