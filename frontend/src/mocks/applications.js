// frontend/src/mocks/applications.js
import { mockEventsForUser } from '@/mocks/events.js'
import { mockUsers } from '@/mocks/certificates.js'

const LS_KEY = 'mock_applications_v1'
// Rekord: { id, status: 'PENDING'|'APPROVED'|'REJECTED', event_id, group_id, user_id, note, created_at }

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : seed()
  } catch {
    return seed()
  }
}
function save(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}
function nextId() {
  return 'app-' + Math.random().toString(36).slice(2, 9)
}
function seed() {
  const events = mockEventsForUser()
  const db = {}
  // spróbujmy wziąć pierwsze dwa eventy i po 1-2 grupy
  const picks = []
  for (const ev of events.slice(0, 2)) {
    for (const g of (ev.groups || []).slice(0, 2)) {
      picks.push({ ev, g })
    }
  }
  const candidates = mockUsers.filter((u) => !['u-1'].includes(u.id)) // nie zgłaszamy aktualnego usera
  const notes = [
    'Mogę pracować popołudniami.',
    'Doświadczenie przy rejestracji uczestników.',
    'Język angielski B2.',
    'Mieszkam blisko miejsca wydarzenia.',
  ]
  let i = 0
  for (const pick of picks) {
    const user = candidates[(i * 3) % candidates.length]
    const id = nextId()
    db[id] = {
      id,
      status: 'PENDING',
      event_id: pick.ev.id,
      group_id: pick.g.id,
      user_id: user.id,
      note: notes[i % notes.length],
      created_at: new Date(Date.now() - (i + 1) * 3600e3).toISOString(),
    }
    i++
  }
  save(db)
  return db
}

export function listPending({ eventId, groupId } = {}) {
  const db = load()
  return Object.values(db).filter(
    (r) =>
      r.status === 'PENDING' &&
      (!eventId || r.event_id === eventId) &&
      (!groupId || r.group_id === groupId),
  )
}

export function approve(id) {
  const db = load()
  const rec = db[id]
  if (!rec) throw new Error('Zgłoszenie nie istnieje (mock)')
  rec.status = 'APPROVED'
  save(db)
  // Usuwamy z kolejki, ale zwracamy rekord do dalszej akcji (dodanie do grupy)
  return JSON.parse(JSON.stringify(rec))
}

export function reject(id) {
  const db = load()
  const rec = db[id]
  if (!rec) throw new Error('Zgłoszenie nie istnieje (mock)')
  rec.status = 'REJECTED'
  save(db)
}

export function create({ event_id, group_id, user_id, note = '' }) {
  const db = load()
  const id = nextId()
  db[id] = {
    id,
    status: 'PENDING',
    event_id,
    group_id,
    user_id,
    note,
    created_at: new Date().toISOString(),
  }
  save(db)
  return JSON.parse(JSON.stringify(db[id]))
}
