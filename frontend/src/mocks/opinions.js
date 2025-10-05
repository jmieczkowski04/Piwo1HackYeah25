// frontend/src/mocks/opinions.js
const LS_KEY = 'mock_opinions_v1'

// Struktura rekordu:
// { id, user_id, group_id, rating, comment }

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
  return 'op-' + Math.random().toString(36).slice(2, 10)
}

// kilka przykładowych opinii powiązanych z grupami z mocków wydarzeń
function seed() {
  const db = {}
  const put = (rec) => (db[rec.id] = rec)
  put({
    id: 'op-1',
    user_id: 'u-3',
    group_id: 'grp-b', // Zbiórka Żywności / Sklep A
    rating: 5,
    comment: 'Świetna współpraca, punktualność, bardzo pomocna.',
  })
  put({
    id: 'op-2',
    user_id: 'u-4',
    group_id: 'grp-b',
    rating: 3.5,
    comment: 'Ok, choć wymaga wsparcia przy pierwszych zadaniach.',
  })
  put({
    id: 'op-3',
    user_id: 'u-1',
    group_id: 'grp-a', // Porządkowanie Parku / Strefa wschodnia
    rating: 4.5,
    comment: 'Zaangażowany, dobre tempo pracy.',
  })
  return db
}

export function listByUser(userId) {
  const db = load()
  return Object.values(db)
    .filter((o) => o.user_id === userId)
    .sort((a, b) => (a.id > b.id ? -1 : 1))
}

export function create({ userId, groupId, rating, comment }) {
  const db = load()
  const id = nextId()
  const rec = {
    id,
    user_id: userId,
    group_id: groupId,
    rating: Number(rating) || 0,
    comment: String(comment || ''),
  }
  db[id] = rec
  save(db)
  return JSON.parse(JSON.stringify(rec))
}

export function update({ id, patch }) {
  const db = load()
  if (!db[id]) throw new Error('Opinion not found (mock)')
  db[id] = {
    ...db[id],
    ...(patch.group_id ? { group_id: patch.group_id } : {}),
    ...(patch.rating != null ? { rating: Number(patch.rating) } : {}),
    ...(patch.comment != null ? { comment: String(patch.comment) } : {}),
  }
  save(db)
  return JSON.parse(JSON.stringify(db[id]))
}

export function remove(id) {
  const db = load()
  delete db[id]
  save(db)
}