// Uproszczone mocki pod certyfikaty.
// Zakładamy, że certyfikat można wygenerować dla zakończonych eventów,
// w których dany user brał udział (jest na przynajmniej 1 tasku).

const now = new Date()
const day = 24 * 60 * 60 * 1000
const iso = (d) => new Date(d).toISOString()

export const mockUsers = [
  { id: 'u-1', name: 'Test User' }, // nasz zalogowany
  { id: 'u-2', name: 'Wolontariusz Kowalski' },
  { id: 'u-3', name: 'Wolontariusz Anna' },
  { id: 'u-4', name: 'Wolontariusz Bartek' },
  { id: 'u-8', name: 'Wolontariusz Ola' },
]

export const mockEvents = [
  {
    id: 'evt-100',
    name: 'Porządkowanie Parku',
    description: 'Akcja sprzątania po weekendzie.',
    status: 'FINISHED',
    institution_id: 'inst-3',
    start_date: iso(now.getTime() - 7 * day),
    end_date: iso(now.getTime() - 7 * day + 3 * 60 * 60 * 1000),
    groups: [
      {
        id: 'grp-a',
        name: 'Strefa wschodnia',
        tasks: [
          {
            id: 'tsk-a1',
            name: 'Zbieranie odpadów',
            start_date: iso(now.getTime() - 7 * day),
            end_date: iso(now.getTime() - 7 * day + 3 * 60 * 60 * 1000),
            users: [{ id: 'u-1' }, { id: 'u-8' }],
          },
        ],
      },
    ],
  },
  {
    id: 'evt-101',
    name: 'Zbiórka Żywności',
    description: 'Akcja w kilku sklepach.',
    status: 'FINISHED',
    institution_id: 'inst-2',
    start_date: iso(now.getTime() - 3 * day),
    end_date: iso(now.getTime() - 3 * day + 6 * 60 * 60 * 1000),
    groups: [
      {
        id: 'grp-b',
        name: 'Sklep A',
        tasks: [
          {
            id: 'tsk-b1',
            name: 'Zmiana poranna',
            start_date: iso(now.getTime() - 3 * day),
            end_date: iso(now.getTime() - 3 * day + 3 * 60 * 60 * 1000),
            users: [{ id: 'u-3' }],
          },
          {
            id: 'tsk-b2',
            name: 'Zmiana popołudniowa',
            start_date: iso(now.getTime() - 3 * day + 3 * 60 * 60 * 1000),
            end_date: iso(now.getTime() - 3 * day + 6 * 60 * 60 * 1000),
            users: [{ id: 'u-4' }],
          },
        ],
      },
    ],
  },
  // Do podglądu – event bieżący (nie generujemy z niego certyfikatów)
  {
    id: 'evt-102',
    name: 'Bieg Charytatywny',
    description: 'Park Jordana.',
    status: 'CONFIRMED',
    institution_id: 'inst-1',
    start_date: iso(now.getTime() + 2 * day),
    end_date: iso(now.getTime() + 2 * day + 4 * 60 * 60 * 1000),
    groups: [
      {
        id: 'grp-c',
        name: 'Strefa Startu',
        tasks: [
          {
            id: 'tsk-c1',
            name: 'Rejestracja',
            start_date: iso(now.getTime() + 2 * day),
            end_date: iso(now.getTime() + 2 * day + 2 * 60 * 60 * 1000),
            users: [{ id: 'u-1' }, { id: 'u-3' }],
          },
        ],
      },
    ],
  },
]

// Zwraca listę eventów FINISHED, w których brał udział userId
export function mockEligibleEventsForUser(userId) {
  const finished = mockEvents.filter((e) => new Date(e.end_date).getTime() < Date.now())
  return finished.filter((e) =>
    (e.groups || []).some((g) =>
      (g.tasks || []).some((t) => (t.users || []).some((u) => u.id === userId)),
    ),
  )
}

// Koordynator – przykładowo ma „pod sobą” u-3 i u-4
export function mockCoordinatorVolunteers(coordinatorId) {
  // coordinatorId nieużywany w mocku – zawsze ci sami
  return mockUsers.filter((u) => ['u-3', 'u-4'].includes(u.id))
}

// Organizator – zwracamy wolontariuszy, którzy uczestniczyli w jego eventach (tu: inst-2)
export function mockOrganizerVolunteers(organizerId) {
  // organizerId nieużywany w mocku – uproszczenie
  const involvedIds = new Set()
  mockEvents
    .filter((e) => e.institution_id === 'inst-2' || e.institution_id === 'inst-3')
    .forEach((e) =>
      e.groups.forEach((g) =>
        g.tasks.forEach((t) => t.users.forEach((u) => involvedIds.add(u.id))),
      ),
    )
  return mockUsers.filter((u) => involvedIds.has(u.id))
}

// Admin – wszyscy
export function mockAllVolunteers() {
  return mockUsers
}

// Fallback: „generujemy” pseudo-PDF (właściwie zwykły blob z tekstem)
export function mockCertificateBlob({ event, user }) {
  const text = `
CERTYFIKAT UCZESTNICTWA
Uczestnik: ${user?.name || user?.id}
Wydarzenie: ${event?.name} (${event?.id})
Data: ${new Date().toLocaleString()}

To jest przykładowy mock certyfikatu (PDF placeholder).
`
  return new Blob([text], { type: 'application/pdf' })
}
