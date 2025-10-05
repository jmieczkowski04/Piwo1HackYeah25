<template>
  <div class="apps">
    <header class="head">
      <h2>Zarządzanie zgłoszeniami</h2>
      <p class="muted">
        Zaakceptuj lub odrzuć prośby wolontariuszy o dołączenie do grupy. Po akceptacji wolontariusz
        będzie dostępny do przypisywania do zadań w tej grupie.
      </p>
    </header>

    <section class="card controls">
      <div class="row">
        <label class="lbl">Wydarzenie</label>
        <select class="select" v-model="selectedEventId" @change="reload">
          <option disabled value="">— wybierz —</option>
          <option v-for="e in eventOptions" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
      </div>

      <div class="row" v-if="selectedEventId">
        <label class="lbl">Grupa (opcjonalnie)</label>
        <select class="select" v-model="selectedGroupId" @change="reload">
          <option value="">— wszystkie grupy —</option>
          <option v-for="g in groupsForSelectedEvent" :key="g.id" :value="g.id">
            {{ g.name || g.id }}
          </option>
        </select>
      </div>

      <div class="row">
        <label class="lbl">Akcje</label>
        <div class="actions">
          <button class="btn" @click="reload" :disabled="loading">Odśwież</button>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card__head">
        <h3>Oczekujące zgłoszenia</h3>
        <span v-if="loading" class="muted">Ładowanie…</span>
        <span v-if="ok" class="ok">{{ ok }}</span>
        <span v-if="error" class="err">{{ error }}</span>
      </div>

      <template v-if="rows.length">
        <ul class="list">
          <li v-for="a in rows" :key="a.id" class="row item">
            <div class="left">
              <div class="title">
                <strong>{{ nameOf(a.user_id) }}</strong>
                <span class="muted">• {{ groupLabel(a.group_id) }}</span>
              </div>
              <div class="sub muted">
                Zgłoszono: {{ d(a.created_at) }} {{ t(a.created_at) }}
                <template v-if="a.note">• uwaga: „{{ a.note }}”</template>
              </div>
            </div>

            <div class="right">
              <button class="btn" @click="toggle(a.id)">
                {{ opened.has(a.id) ? 'Zwiń' : 'Opinie' }}
              </button>
              <button class="btn btn--primary" :disabled="actingId === a.id" @click="accept(a)">
                {{ actingId === a.id && actingType === 'accept' ? 'Akceptowanie…' : 'Akceptuj' }}
              </button>
              <button class="btn btn--danger" :disabled="actingId === a.id" @click="rejectApp(a)">
                {{ actingId === a.id && actingType === 'reject' ? 'Odrzucanie…' : 'Odrzuć' }}
              </button>
            </div>

            <div class="details" v-if="opened.has(a.id)">
              <div v-if="opinions[a.user_id]?.loading" class="muted">Ładowanie opinii…</div>
              <template v-else>
                <div class="opinions__head">
                  <span class="badge">
                    Śr. ocena:
                    <strong>
                      {{
                        opinions[a.user_id]?.avg != null ? fmtRating(opinions[a.user_id].avg) : '—'
                      }}
                    </strong>
                    ({{ opinions[a.user_id]?.count || 0 }})
                  </span>
                </div>
                <div v-if="opinions[a.user_id]?.items?.length" class="table-wrap">
                  <table class="table">
                    <thead>
                      <tr>
                        <th class="num">Ocena</th>
                        <th>Komentarz</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="o in opinions[a.user_id].items" :key="o.id">
                        <td class="num">{{ o.rating }}</td>
                        <td>{{ o.comment || '—' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p v-else class="muted">Brak opinii.</p>
              </template>
            </div>
          </li>
        </ul>
      </template>

      <p v-else class="muted">Brak oczekujących zgłoszeń w tym zakresie.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { listEventsForUser } from '@/api/user.js'
import { addUserToEventGroup } from '@/api/group.js'
import { mockEventsForUser } from '@/mocks/events.js'
import { listPending, approve, reject } from '@/mocks/applications.js'
import { listByUser as listOpinionsMock } from '@/mocks/opinions.js'
import { mockUsers } from '@/mocks/certificates.js'

const auth = useAuthStore()

const eventOptions = ref([])
const selectedEventId = ref('')
const selectedGroupId = ref('')

const rows = ref([])
const loading = ref(false)
const error = ref('')
const ok = ref('')

const opened = ref(new Set())
const actingId = ref('')
const actingType = ref('') // 'accept' | 'reject'

// cache opinii { [userId]: { loading, items, avg, count } }
const opinions = ref({})

onMounted(async () => {
  await loadEvents()
  await reload()
})

async function loadEvents() {
  try {
    const uid = auth.user?.id || 'me'
    const resp = await listEventsForUser(uid)
    const arr = Array.isArray(resp) ? resp : resp?.events
    if (!arr) throw new Error('no events')
    eventOptions.value = arr
  } catch {
    eventOptions.value = mockEventsForUser()
  }
  selectedEventId.value ||= eventOptions.value[0]?.id || ''
}

const groupsForSelectedEvent = computed(() => {
  const ev = eventOptions.value.find((e) => e.id === selectedEventId.value)
  if (!ev) return []
  return (ev.groups || []).map((g) => ({ id: g.id, name: g.name || g.id }))
})

async function reload() {
  loading.value = true
  error.value = ''
  ok.value = ''
  rows.value = []
  opened.value = new Set()
  opinions.value = {}
  try {
    const list = listPending({
      eventId: selectedEventId.value || undefined,
      groupId: selectedGroupId.value || undefined,
    })
    // najnowsze na górze
    rows.value = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (e) {
    error.value = e?.message || 'Nie udało się pobrać zgłoszeń.'
  } finally {
    loading.value = false
  }
}

function toggle(id) {
  const s = new Set(opened.value)
  if (s.has(id)) s.delete(id)
  else {
    s.add(id)
    preloadOpinionsForApp(id)
  }
  opened.value = s
}

function preloadOpinionsForApp(appId) {
  const a = rows.value.find((x) => x.id === appId)
  if (!a) return
  if (!opinions.value[a.user_id]) opinions.value[a.user_id] = { loading: true, items: [] }
  // Mock – szybkie pobranie
  const items = listOpinionsMock(a.user_id)
  const avg =
    items.length === 0
      ? null
      : items.reduce((acc, it) => acc + (Number(it.rating) || 0), 0) / items.length
  opinions.value[a.user_id] = {
    loading: false,
    items,
    avg,
    count: items.length,
  }
}

async function accept(a) {
  if (
    !confirm(
      `Zaakceptować zgłoszenie wolontariusza „${nameOf(a.user_id)}” do grupy „${groupLabel(a.group_id)}”?`,
    )
  )
    return
  actingId.value = a.id
  actingType.value = 'accept'
  error.value = ''
  ok.value = ''

  try {
    // 1) oznacz jako zaakceptowane (mock)
    const rec = approve(a.id)
    // 2) spróbuj realnego przypisania do grupy (API)
    try {
      await addUserToEventGroup(rec.event_id, rec.group_id, rec.user_id)
      ok.value = 'Dodano wolontariusza do grupy.'
    } catch (e) {
      console.warn(
        'POST /event/:eventId/group/:groupId/user failed, keeping local state. Reason:',
        e?.message || e,
      )
      ok.value = 'Zgłoszenie zaakceptowane (mock).'
    }
    // 3) zdejmij z listy
    rows.value = rows.value.filter((x) => x.id !== a.id)
    opened.value.delete(a.id)
  } catch (e) {
    error.value = e?.message || 'Nie udało się zaakceptować zgłoszenia.'
  } finally {
    actingId.value = ''
    actingType.value = ''
  }
}

async function rejectApp(a) {
  if (!confirm(`Odrzucić zgłoszenie wolontariusza „${nameOf(a.user_id)}”?`)) return
  actingId.value = a.id
  actingType.value = 'reject'
  error.value = ''
  ok.value = ''
  try {
    reject(a.id)
    rows.value = rows.value.filter((x) => x.id !== a.id)
    opened.value.delete(a.id)
    ok.value = 'Zgłoszenie odrzucone.'
  } catch (e) {
    error.value = e?.message || 'Nie udało się odrzucić zgłoszenia.'
  } finally {
    actingId.value = ''
    actingType.value = ''
  }
}

// --- helpers (etykiety) ---
function nameOf(userId) {
  const m = mockUsers.find((u) => u.id === userId)
  return m?.name || userId
}
function groupLabel(groupId) {
  const ev = eventOptions.value.find((e) => e.id === selectedEventId.value)
  const g = ev?.groups?.find((x) => x.id === groupId)
  return g?.name || groupId || '—'
}
function d(iso) {
  const x = new Date(iso)
  return x.toLocaleDateString()
}
function t(iso) {
  const x = new Date(iso)
  return x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function fmtRating(v) {
  const r = Math.round(v * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
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
  grid-template-columns: 220px 1fr;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}
.lbl {
  font-weight: 600;
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
.ok {
  color: $blue-color;
}
.err {
  color: $red-color;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.item.row {
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: $surface;
  padding: 0.6rem 0.6rem;
  & + .row {
    margin-top: 0.5rem;
  }
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
}
.left {
  min-width: 0;
}
.title {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}
.sub {
  font-size: 0.92rem;
}

.right {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.details {
  grid-column: 1 / -1;
  margin-top: 0.5rem;
  border-top: 1px dashed $border-color;
  padding-top: 0.5rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: $radius-sm;
  border: 1px solid $border-color;
  background: $surface-hover;
  color: $muted-color;
  font-weight: 600;
  font-size: 0.85rem;
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
  .num {
    text-align: right;
    white-space: nowrap;
    width: 80px;
  }
}
</style>