import { mockEventsForUser } from './events.js'

// Zwraca spłaszczoną listę grup (z eventami) widocznych dla koordynatora.
// W mocku używamy tych samych eventów, co w kalendarzu.
export function mockGroupsForCoordinator(coordinatorId = 'u-1') {
  // Używamy listy eventów z mocka; w realu – zapytanie do backendu.
  const events = mockEventsForUser()
  const list = []
  for (const ev of events) {
    for (const g of ev.groups || []) {
      list.push({
        eventId: ev.id,
        eventName: ev.name,
        groupId: g.id,
        groupName: g.name,
      })
    }
  }
  return list
}
