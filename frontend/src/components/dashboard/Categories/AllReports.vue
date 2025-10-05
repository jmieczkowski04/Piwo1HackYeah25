<template>
  <div class="reports">
    <header class="head">
      <h2>Raporty</h2>
      <p class="muted">
        <template v-if="auth.isOrgAdmin">
          Admin organizacji: raport udziału i godzin pracy wolontariuszy w Twoich wydarzeniach.
        </template>
        <template v-else-if="auth.isCoordinator">
          Koordynator: raport dla wolontariuszy, których zgłaszałeś / którymi zarządzasz.
        </template>
        <template v-else> Ten widok jest dostępny dla Koordynatora i Admina organizacji. </template>
      </p>
    </header>

    <section v-if="canUse" class="card controls">
      <div class="row">
        <label class="lbl">Zakres dat</label>
        <div class="range">
          <input class="input" type="date" v-model="dateFrom" />
          <span>—</span>
          <input class="input" type="date" v-model="dateTo" />
        </div>
      </div>

      <div class="row">
        <label class="lbl">Agregacja</label>
        <div class="range">
          <label class="radio">
            <input type="radio" value="VOLUNTEER" v-model="mode" /> według wolontariusza
          </label>
          <label class="radio">
            <input type="radio" value="EVENT" v-model="mode" /> według wydarzenia
          </label>
        </div>
      </div>

      <div class="row">
        <label class="lbl">Akcje</label>
        <div class="actions">
          <button class="btn" @click="recalculate" :disabled="loading">Przelicz</button>
          <button class="btn" @click="exportCsv" :disabled="!rows.length">Eksport CSV</button>
          <button class="btn btn--primary" @click="printView" :disabled="!rows.length">
            Drukuj / PDF
          </button>
        </div>
      </div>
    </section>

    <section v-if="canUse" class="card">
      <div class="card__head">
        <h3>Wyniki</h3>
        <span v-if="loading" class="muted">Liczenie…</span>
      </div>

      <template v-if="rows.length">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr v-if="mode === 'VOLUNTEER'">
                <th>Wolontariusz</th>
                <th class="num">Wydarzenia</th>
                <th class="num">Zmiany</th>
                <th class="num">Godziny</th>
              </tr>
              <tr v-else>
                <th>Wydarzenie</th>
                <th class="num">Wolontariusze</th>
                <th class="num">Zmiany</th>
                <th class="num">Godziny</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.key">
                <td>{{ r.label }}</td>
                <td class="num">{{ r.events }}</td>
                <td class="num">{{ r.shifts }}</td>
                <td class="num">{{ fmtHours(r.hours) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th>Suma</th>
                <th class="num">{{ total.events }}</th>
                <th class="num">{{ total.shifts }}</th>
                <th class="num">{{ fmtHours(total.hours) }}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>

      <p v-else class="muted">Brak danych w wybranym zakresie.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore, ROLE } from '@/stores/auth.js'

// MOCKI – korzystamy z już istniejących
import { mockEventsForUser } from '@/mocks/events.js'
import {
  mockUsers,
  mockEvents as mockFinishedAndMixed,
  mockCoordinatorVolunteers,
  mockOrganizerVolunteers,
} from '@/mocks/certificates.js'

const auth = useAuthStore()
const loading = ref(false)

// Uprawnienia
const canUse = computed(() => auth.isCoordinator || auth.isOrgAdmin)

// Zakres dat
const todayIso = () => new Date().toISOString().slice(0, 10)
const isoShift = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
const dateFrom = ref(isoShift(-30))
const dateTo = ref(todayIso())

// Agregacja
const mode = ref('VOLUNTEER') // 'VOLUNTEER' | 'EVENT'

// Wynik
const rows = ref([])
const total = ref({ events: 0, shifts: 0, hours: 0 })

onMounted(() => {
  recalculate()
})
watch([dateFrom, dateTo, mode, () => auth.currentRole], () => recalculate())

function recalculate() {
  if (!canUse.value) return
  loading.value = true
  setTimeout(() => {
    // W prawdziwym API:
    //  - ORG_ADMIN: GET /events/all/users/me -> ale potrzebujemy eventów organizacji.
    //    Tu w mocku użyjemy mockEvents z certificates.js i ograniczymy do inst-2 & inst-3.
    //  - COORDINATOR: bierzemy jego wolontariuszy i eventy, w których są przypisani.
    const { fromTs, toTs } = range()

    if (auth.isOrgAdmin) {
      // Załóżmy, że admin zarządza wydarzeniami z institution_id inst-2 & inst-3 (mock)
      const instIds = new Set(['inst-2', 'inst-3'])
      const events = mockFinishedAndMixed.filter((e) => instIds.has(e.institution_id))
      buildStatsForOrg(events, fromTs, toTs)
    } else if (auth.isCoordinator) {
      const events = mergeUniqueEvents(mockEventsForUser(), mockFinishedAndMixed)
      const vols = new Set(mockCoordinatorVolunteers(auth.user?.id).map((u) => u.id))
      buildStatsForCoordinator(events, vols, fromTs, toTs)
    }

    loading.value = false
  }, 0)
}

function range() {
  const fromTs = dateFrom.value ? new Date(dateFrom.value + 'T00:00:00').getTime() : 0
  const toTs = dateTo.value ? new Date(dateTo.value + 'T23:59:59').getTime() : Infinity
  return { fromTs, toTs }
}

function inRange(startISO, endISO, fromTs, toTs) {
  const s = new Date(startISO).getTime()
  const e = new Date(endISO).getTime()
  // liczymy overlap z wybranym zakresem
  const start = Math.max(s, fromTs)
  const end = Math.min(e, toTs)
  return end > start ? { ok: true, start, end } : { ok: false }
}

function hoursBetween(start, end) {
  return (end - start) / 3600000
}

function buildStatsForOrg(events, fromTs, toTs) {
  // Agregacja po wolontariuszu lub wydarzeniu – zależnie od mode
  const byVolunteer = new Map()
  const byEvent = new Map()

  for (const ev of events) {
    let eventShifts = 0
    let eventHours = 0
    const eventVolunteerSet = new Set()

    for (const g of ev.groups || []) {
      for (const t of g.tasks || []) {
        const ov = inRange(t.start_date, t.end_date, fromTs, toTs)
        if (!ov.ok) continue
        const h = hoursBetween(ov.start, ov.end)
        const users = t.users || []

        // EVENT agregacja
        eventShifts += 1
        eventHours += h
        users.forEach((u) => eventVolunteerSet.add(u.id))

        // VOLUNTEER agregacja
        for (const u of users) {
          const rec = byVolunteer.get(u.id) || {
            key: u.id,
            label: mockUsers.find((x) => x.id === u.id)?.name || u.id,
            eventsSet: new Set(),
            shifts: 0,
            hours: 0,
          }
          rec.eventsSet.add(ev.id)
          rec.shifts += 1
          rec.hours += h
          byVolunteer.set(u.id, rec)
        }
      }
    }

    if (eventShifts > 0 || eventHours > 0) {
      const recE = {
        key: ev.id,
        label: ev.name,
        events: 1,
        shifts: eventShifts,
        hours: eventHours,
        volunteers: eventVolunteerSet.size,
      }
      byEvent.set(ev.id, recE)
    }
  }

  if (mode.value === 'VOLUNTEER') {
    rows.value = Array.from(byVolunteer.values()).map((r) => ({
      key: r.key,
      label: r.label,
      events: r.eventsSet.size,
      shifts: r.shifts,
      hours: r.hours,
    }))
  } else {
    rows.value = Array.from(byEvent.values()).map((r) => ({
      key: r.key,
      label: r.label,
      events: 1,
      shifts: r.shifts,
      hours: r.hours,
      volunteers: r.volunteers,
    }))
  }

  summarize()
}

function buildStatsForCoordinator(events, volunteerIdSet, fromTs, toTs) {
  const byVolunteer = new Map()
  const byEvent = new Map()

  for (const ev of events) {
    let eventShifts = 0
    let eventHours = 0
    const eventVolunteerSet = new Set()

    for (const g of ev.groups || []) {
      for (const t of g.tasks || []) {
        const ov = inRange(t.start_date, t.end_date, fromTs, toTs)
        if (!ov.ok) continue
        const h = hoursBetween(ov.start, ov.end)
        const users = (t.users || []).filter((u) => volunteerIdSet.has(u.id))
        if (!users.length) continue

        // EVENT
        eventShifts += 1
        eventHours += h
        users.forEach((u) => eventVolunteerSet.add(u.id))

        // VOLUNTEER
        for (const u of users) {
          const rec = byVolunteer.get(u.id) || {
            key: u.id,
            label: mockUsers.find((x) => x.id === u.id)?.name || u.id,
            eventsSet: new Set(),
            shifts: 0,
            hours: 0,
          }
          rec.eventsSet.add(ev.id)
          rec.shifts += 1
          rec.hours += h
          byVolunteer.set(u.id, rec)
        }
      }
    }

    if (eventShifts > 0 || eventHours > 0) {
      byEvent.set(ev.id, {
        key: ev.id,
        label: ev.name,
        events: 1,
        shifts: eventShifts,
        hours: eventHours,
        volunteers: eventVolunteerSet.size,
      })
    }
  }

  if (mode.value === 'VOLUNTEER') {
    rows.value = Array.from(byVolunteer.values()).map((r) => ({
      key: r.key,
      label: r.label,
      events: r.eventsSet.size,
      shifts: r.shifts,
      hours: r.hours,
    }))
  } else {
    rows.value = Array.from(byEvent.values()).map((r) => ({
      key: r.key,
      label: r.label,
      events: 1,
      shifts: r.shifts,
      hours: r.hours,
      volunteers: r.volunteers,
    }))
  }

  summarize()
}

function mergeUniqueEvents(a, b) {
  const map = new Map()
  for (const e of a || []) map.set(e.id, e)
  for (const e of b || []) map.set(e.id, map.get(e.id) ? map.get(e.id) : e)
  return Array.from(map.values())
}

function summarize() {
  const evSum = rows.value.reduce((acc, r) => acc + (mode.value === 'VOLUNTEER' ? r.events : 1), 0)
  const shSum = rows.value.reduce((acc, r) => acc + r.shifts, 0)
  const hSum = rows.value.reduce((acc, r) => acc + r.hours, 0)
  total.value = { events: evSum, shifts: shSum, hours: hSum }
}

function fmtHours(h) {
  // 1 miejsce po przecinku, bez „,00”
  const v = Math.round(h * 10) / 10
  return Number.isInteger(v) ? v.toString() : v.toFixed(1)
}

// --- Eksport / Druk ---
function exportCsv() {
  if (!rows.value.length) return
  const sep = ';'
  const header =
    mode.value === 'VOLUNTEER'
      ? ['Wolontariusz', 'Wydarzenia', 'Zmiany', 'Godziny']
      : ['Wydarzenie', 'Wolontariusze', 'Zmiany', 'Godziny']
  const lines = [header.join(sep)]

  for (const r of rows.value) {
    if (mode.value === 'VOLUNTEER') {
      lines.push(
        [safe(r.label), r.events, r.shifts, fmtHours(r.hours)].map((x) => String(x)).join(sep),
      )
    } else {
      lines.push(
        [safe(r.label), r.volunteers ?? '', r.shifts, fmtHours(r.hours)]
          .map((x) => String(x))
          .join(sep),
      )
    }
  }
  // wiersz sumy
  const sumRow =
    mode.value === 'VOLUNTEER'
      ? ['Suma', total.value.events, total.value.shifts, fmtHours(total.value.hours)]
      : ['Suma', '', total.value.shifts, fmtHours(total.value.hours)]
  lines.push(sumRow.join(sep))

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = csvFileName()
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(a.href)
}

function csvFileName() {
  const role = auth.isOrgAdmin ? 'org' : auth.isCoordinator ? 'coord' : 'user'
  return `raport_${role}_${mode.value.toLowerCase()}_${dateFrom.value}_${dateTo.value}.csv`
}

function safe(s) {
  return String(s || '').replaceAll(';', ',')
}

function printView() {
  window.print()
}
</script>

<style scoped lang="scss">
.head {
  margin-bottom: 0.75rem;
  .muted {
    color: $muted-color;
  }
}

.controls .row {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}
.lbl {
  font-weight: 600;
}

.range {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.radio {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  margin-right: 1rem;
}

.actions {
  display: inline-flex;
  gap: 0.5rem;
}

.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.table-wrap {
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 0.5rem 0.6rem;
    border-bottom: 1px solid $border-color;
  }
  thead th {
    text-align: left;
    background: $surface-hover;
    border-top: 1px solid $border-color;
  }
  tfoot th {
    text-align: left;
    border-top: 2px solid $border-color;
  }
  .num {
    text-align: right;
    width: 120px;
    white-space: nowrap;
  }
}

/* prosta wersja do druku */
@media print {
  .controls,
  .navbar,
  .settings,
  .footer,
  .actions {
    display: none !important;
  }
  .dashboard-field {
    border: none !important;
  }
  .table {
    font-size: 12px;
  }
}
</style>
