// frontend/src/mocks/chat.js
// Mock zgodny ze schematem:
// { chat_id, event_id, participants[{user_id, role, display_name}], last_seen{...}, messages[{id,ts,sender_id,text,meta}] }

const LS_KEY = 'mock_chats_v2'

// Seed: przykładowe dwa wątki
const seed = {
  'evt-krk-002:u-1': {
    chat_id: 'evt-krk-002:u-1',
    event_id: 'evt-krk-002',
    participants: [
      { user_id: 'u-1', role: 'VOLUNTEER', display_name: 'Test User' },
      { user_id: 'org-1', role: 'ORGANIZER', display_name: 'Organizator Kasia' },
    ],
    last_seen: { 'u-1': null, 'org-1': null },
    messages: [
      {
        id: 'm-1',
        ts: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        sender_id: 'u-1',
        text: 'Cześć! Gdzie jutro odbieramy identyfikatory?',
        meta: { delivered: true, read_at: null },
      },
      {
        id: 'm-2',
        ts: new Date(Date.now() - 1000 * 60 * 60 * 5 + 42000).toISOString(),
        sender_id: 'org-1',
        text: 'Hej, w namiocie przy wejściu A, od 8:30.',
        meta: { delivered: true },
      },
      {
        id: 'm-3',
        ts: new Date(Date.now() - 1000 * 60 * 60 * 4 + 120000).toISOString(),
        sender_id: 'u-1',
        text: 'Dzięki!',
        meta: { delivered: true },
      },
    ],
  },
  'evt-krk-001:u-1': {
    chat_id: 'evt-krk-001:u-1',
    event_id: 'evt-krk-001',
    participants: [
      { user_id: 'u-1', role: 'VOLUNTEER', display_name: 'Test User' },
      { user_id: 'org-9', role: 'ORGANIZER', display_name: 'Organizator Marek' },
    ],
    last_seen: { 'u-1': null, 'org-9': null },
    messages: [
      {
        id: 'm-1',
        ts: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        sender_id: 'org-9',
        text: 'Przypominam o kamizelkach odblaskowych :)',
        meta: { delivered: true },
      },
    ],
  },
}

// --- helpers ---
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : { ...seed }
  } catch {
    return { ...seed }
  }
}
function save(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}
function keyOf(eventId, userId) {
  return `${eventId}:${userId}`
}
function nextMsgId(chat) {
  const last = chat.messages[chat.messages.length - 1]
  const n = last ? parseInt((last.id || 'm-0').split('-')[1], 10) + 1 : 1
  return `m-${n}`
}
function ensureChat(db, eventId, userId) {
  const key = keyOf(eventId, userId)
  if (!db[key]) {
    db[key] = {
      chat_id: key,
      event_id: eventId,
      participants: [
        { user_id: userId, role: 'VOLUNTEER', display_name: 'Ty' },
        { user_id: `org-${eventId}`, role: 'ORGANIZER', display_name: 'Organizator' },
      ],
      last_seen: { [userId]: null, [`org-${eventId}`]: null },
      messages: [],
    }
  }
  return db[key]
}
function organizerId(chat) {
  return chat.participants.find((p) => p.role === 'ORGANIZER')?.user_id
}

// --- API MOCK ---
export function getChatMock(eventId, userId) {
  const db = load()
  const chat = ensureChat(db, eventId, userId)
  save(db)
  // deep copy
  return JSON.parse(JSON.stringify(chat))
}

export function postMessageMock({ eventId, userId, text, as = 'ME' }) {
  // as: 'ME' | 'ORGANIZER' (tylko na potrzeby dema)
  const db = load()
  const key = keyOf(eventId, userId)
  const chat = ensureChat(db, eventId, userId)

  const sender_id = as === 'ORGANIZER' ? organizerId(chat) : userId
  const msg = {
    id: nextMsgId(chat),
    ts: new Date().toISOString(),
    sender_id,
    text: text || '',
    meta: { delivered: true },
  }
  chat.messages.push(msg)
  db[key] = chat
  save(db)
  return JSON.parse(JSON.stringify(msg))
}

// Symulacja auto-odpowiedzi organizatora
export function autoReplyMock({ eventId, userId }) {
  const variants = [
    'Dziękuję za wiadomość, sprawdzę i dam znać.',
    'Ok, zanotowane.',
    'Możemy to potwierdzić jutro rano.',
    'Brzmi dobrze!',
    'Poproszę o numer telefonu do kontaktu w dniu wydarzenia.',
  ]
  const text = variants[Math.floor(Math.random() * variants.length)]
  return postMessageMock({ eventId, userId, text, as: 'ORGANIZER' })
}
