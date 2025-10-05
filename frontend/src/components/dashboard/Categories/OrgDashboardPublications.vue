<template>
  <div class="adverts">
    <header class="head">
      <h2>Publikacja ogłoszeń (wydarzenia + drzewo grup)</h2>
      <p class="muted">
        Dodawaj/edytuj wydarzenia. Buduj drzewo grup z nieograniczonym zagnieżdżeniem, zarządzaj
        adminami „na swoim poziomie i niżej” oraz zadaniami.
      </p>
    </header>

    <!-- Dostęp -->
    <section v-if="!canUse" class="card">
      <p class="muted">
        Brak uprawnień. Moduł dostępny dla Administratora organizacji i Admina rządowego.
      </p>
    </section>

    <template v-else>
      <!-- Zakładki -->
      <div class="tabs">
        <button class="btn" :class="{ 'btn--primary': tab === 'EVENTS' }" @click="tab = 'EVENTS'">
          Wydarzenia
        </button>
        <button class="btn" :class="{ 'btn--primary': tab === 'GROUPS' }" @click="tab = 'GROUPS'">
          Drzewo grup
        </button>
      </div>

      <!-- ======= ZAKŁADKA: WYDARZENIA ======= -->
      <section v-if="tab === 'EVENTS'" class="card">
        <div class="card__head">
          <h3>Twoje wydarzenia</h3>
          <div class="actions">
            <button class="btn" @click="reloadEvents" :disabled="loading.events">Odśwież</button>
            <button class="btn btn--primary" @click="startCreateEvent">Dodaj wydarzenie</button>
          </div>
        </div>

        <div v-if="loading.events" class="muted">Ładowanie…</div>

        <template v-else>
          <p v-if="events.length === 0" class="muted">Brak wydarzeń.</p>

          <ul v-else class="list">
            <li v-for="e in eventsSorted" :key="e.id" class="row">
              <div class="left">
                <div class="title">
                  <strong>{{ e.name || 'Bez nazwy' }}</strong>
                  <span class="badge" :class="badgeClass(e.status)">{{ e.status || '—' }}</span>
                </div>
                <div class="sub muted">
                  ID: {{ e.id }} • instytucja: {{ e.institution_id || '—' }} •
                  {{ d(e.start_date) }} {{ tt(e.start_date) }} → {{ d(e.end_date) }}
                  {{ tt(e.end_date) }}
                </div>
              </div>
              <div class="right">
                <button class="btn" @click="editEvent(e)">Edytuj</button>
                <button class="btn btn--danger" @click="removeEvent(e)">Usuń</button>
                <button
                  class="btn"
                  :class="{ 'btn--primary': selectedEventId === e.id }"
                  @click="
                    tab = 'GROUPS'
                    selectEvent(e.id)
                  "
                  title="Zarządzaj drzewem grup"
                >
                  {{ selectedEventId === e.id ? 'Wybrane' : 'Grupy' }}
                </button>
              </div>
            </li>
          </ul>
        </template>
      </section>

      <!-- Formularz wydarzenia (create / edit) -->
      <section class="card" v-if="isEditingEvent">
        <div class="card__head">
          <h3>{{ eventForm.id ? 'Edytuj wydarzenie' : 'Dodaj wydarzenie' }}</h3>
          <span v-if="loading.eventSave" class="muted">Zapisywanie…</span>
        </div>

        <form class="form" @submit.prevent="saveEvent">
          <div class="row">
            <label class="lbl" for="evName">Nazwa</label>
            <input id="evName" class="input" v-model.trim="eventForm.name" required />
          </div>

          <div class="row">
            <label class="lbl" for="evDesc">Opis</label>
            <textarea id="evDesc" class="textarea" rows="3" v-model.trim="eventForm.description" />
          </div>

          <div class="row">
            <label class="lbl" for="evInst">Instytucja</label>
            <input
              id="evInst"
              class="input"
              v-model.trim="eventForm.institution_id"
              :placeholder="isGov ? 'inst-…' : 'automatycznie z Twojej organizacji'"
              :disabled="!isGov"
            />
          </div>

          <div class="row">
            <label class="lbl" for="evStatus">Status</label>
            <select id="evStatus" class="select" v-model="eventForm.status">
              <option value="DRAFT">DRAFT</option>
              <option value="UNCONFIRMED">UNCONFIRMED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="FINISHED">FINISHED</option>
            </select>
          </div>

          <div class="row">
            <label class="lbl" for="evStart">Start</label>
            <input id="evStart" class="input" type="datetime-local" v-model="eventFormStart" />
          </div>

          <div class="row">
            <label class="lbl" for="evEnd">Koniec</label>
            <input id="evEnd" class="input" type="datetime-local" v-model="eventFormEnd" />
          </div>

          <div class="actions">
            <button class="btn btn--primary" :disabled="loading.eventSave || !canSaveEvent">
              Zapisz
            </button>
            <button
              class="btn"
              type="button"
              :disabled="loading.eventSave"
              @click="cancelEventEdit"
            >
              Anuluj
            </button>
            <span v-if="error" class="err">{{ error }}</span>
            <span v-if="ok" class="ok">{{ ok }}</span>
          </div>
        </form>
      </section>

      <!-- ======= ZAKŁADKA: DRZEWO GRUP ======= -->
      <section v-if="tab === 'GROUPS'" class="card">
        <div class="card__head">
          <h3>Drzewo grup</h3>
          <div class="actions">
            <label class="lbl" for="evPick" style="font-weight: 600">Wydarzenie:</label>
            <select id="evPick" class="select" v-model="selectedEventId" @change="reloadEventTree">
              <option disabled value="">— wybierz —</option>
              <option v-for="e in eventsSorted" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>

            <button class="btn" @click="reloadEventTree" :disabled="loading.tree">Odśwież</button>
            <button class="btn btn--primary" @click="addRootGroup" :disabled="!selectedEventId">
              Dodaj grupę (root)
            </button>
          </div>
        </div>

        <template v-if="!selectedEventId">
          <p class="muted">Wybierz wydarzenie, aby zarządzać grupami.</p>
        </template>

        <template v-else>
          <div class="bar">
            <span>
              <strong>{{ selectedEvent?.name || selectedEventId }}</strong>
              <span class="badge" :class="badgeClass(selectedEvent?.status)">
                {{ selectedEvent?.status || '—' }}
              </span>
            </span>
            <div class="actions">
              <button
                class="btn"
                v-if="selectedEvent?.status === 'UNCONFIRMED'"
                @click="sendForVerification"
              >
                Wyślij do weryfikacji
              </button>
            </div>
          </div>

          <div v-if="loading.tree" class="muted">Ładowanie drzewa…</div>

          <template v-else>
            <p v-if="rootGroups.length === 0" class="muted">Brak grup w tym wydarzeniu.</p>
            <ul v-else class="tree">
              <TreeNode
                v-for="g in rootGroups"
                :key="g.id"
                :node="g"
                :level="0"
                :can-manage-admins="canManageAdmins(g)"
                @save="onSaveGroup"
                @add-child="onAddChild"
                @remove="onRemoveGroup"
                @add-admin="onAddAdmin"
                @remove-admin="onRemoveAdmin"
                @create-task="onCreateTask"
                @update-task="onUpdateTask"
                @delete-task="onDeleteTask"
              />
            </ul>
          </template>
        </template>
      </section>
    </template>
  </div>
</template>

<script setup>
/**
 * VolCon – Publikacja ogłoszeń
 * - Jeden <script setup>, bez JSX.
 * - API -> fallback do mocków (localStorage).
 */
import { defineComponent, h, reactive, ref, computed, onMounted, watch } from 'vue'
import { useAuthStore, ROLE } from '@/stores/auth.js'
import { listEventsForUser } from '@/api/user.js'
import { createEvent, updateEvent, deleteEvent, confirmEvent, getEvent } from '@/api/event.js'
import { createGroupForEvent, updateEventGroup, deleteEventGroup } from '@/api/group.js'
import { createTask, updateTask, deleteTask } from '@/api/task.js'
import { mockEventsForUser } from '@/mocks/events.js'

// --- Uprawnienia
const auth = useAuthStore()
const canUse = computed(() => auth.isOrgAdmin || auth.isGovAdmin)
const isGov = computed(() => auth.isGovAdmin)
const meId = computed(() => auth.user?.id || 'u-1')

// --- Zakładki
const tab = ref('EVENTS') // 'EVENTS' | 'GROUPS'

// --- Stany ogólne
const loading = reactive({
  events: false,
  eventSave: false,
  tree: false,
})
const error = ref('')
const ok = ref('')

// --- Lista wydarzeń
const events = ref([])
// Dla porządku – trzymamy LS z eventami, by create/update/delete przetrwały odświeżenie
const LS_EVENTS = 'mock_events_v1'

// Helpers LS
function lsGet(key, def) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : def
  } catch {
    return def
  }
}
function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

// Zasilanie listy z LS + mock
function loadEventsFromLSFallback() {
  const fromLs = lsGet(LS_EVENTS, null)
  if (Array.isArray(fromLs) && fromLs.length) {
    events.value = fromLs
    return
  }
  // seed: mock
  const mock = mockEventsForUser()
  events.value = Array.isArray(mock) ? mock : []
  lsSet(LS_EVENTS, events.value)
}

async function reloadEvents() {
  loading.events = true
  error.value = ''
  try {
    const uid = auth.user?.id || 'me'
    const res = await listEventsForUser(uid)
    const arr = Array.isArray(res) ? res : res?.events
    if (!arr) throw new Error('no events')
    events.value = arr
    lsSet(LS_EVENTS, events.value)
  } catch {
    // fallback
    loadEventsFromLSFallback()
  } finally {
    loading.events = false
  }
}

const eventsSorted = computed(() =>
  (events.value || []).slice().sort((a, b) => new Date(a.start_date) - new Date(b.start_date)),
)

const selectedEventId = ref('')
const selectedEvent = computed(
  () => events.value.find((e) => e.id === selectedEventId.value) || null,
)
function selectEvent(id) {
  selectedEventId.value = id || ''
  if (selectedEventId.value) reloadEventTree()
}

// --- Formularz wydarzenia (lokalny stan, by nie odnosić się do null)
const isEditingEvent = ref(false)
const eventForm = reactive({
  id: '',
  name: '',
  description: '',
  institution_id: '',
  status: 'UNCONFIRMED',
  start_date: '', // ISO
  end_date: '', // ISO
})

const eventFormStart = ref('') // 'YYYY-MM-DDTHH:mm'
const eventFormEnd = ref('')

function toLocalDT(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}
function fromLocalDT(local) {
  return local ? new Date(local).toISOString() : ''
}

const canSaveEvent = computed(() => {
  if (!eventForm.name.trim()) return false
  const s = new Date(eventFormStart.value).getTime()
  const e = new Date(eventFormEnd.value).getTime()
  return Number.isFinite(s) && Number.isFinite(e) && s <= e
})

function startCreateEvent() {
  isEditingEvent.value = true
  error.value = ''
  ok.value = ''
  eventForm.id = ''
  eventForm.name = ''
  eventForm.description = ''
  eventForm.institution_id = isGov.value ? '' : selectedEvent.value?.institution_id || ''
  eventForm.status = 'UNCONFIRMED'
  const now = Date.now()
  eventForm.start_date = new Date(now + 3600e3).toISOString()
  eventForm.end_date = new Date(now + 3 * 3600e3).toISOString()
  eventFormStart.value = toLocalDT(eventForm.start_date)
  eventFormEnd.value = toLocalDT(eventForm.end_date)
}

function editEvent(e) {
  isEditingEvent.value = true
  error.value = ''
  ok.value = ''
  eventForm.id = e.id
  eventForm.name = e.name || ''
  eventForm.description = e.description || ''
  eventForm.institution_id = e.institution_id || ''
  eventForm.status = e.status || 'UNCONFIRMED'
  eventForm.start_date = e.start_date
  eventForm.end_date = e.end_date
  eventFormStart.value = toLocalDT(e.start_date)
  eventFormEnd.value = toLocalDT(e.end_date)
}

function cancelEventEdit() {
  isEditingEvent.value = false
  error.value = ''
  ok.value = ''
}

async function saveEvent() {
  if (!canSaveEvent.value) return
  loading.eventSave = true
  error.value = ''
  ok.value = ''

  const payload = {
    name: eventForm.name,
    description: eventForm.description,
    institution_id: eventForm.institution_id || undefined,
    status: eventForm.status || 'UNCONFIRMED',
    start_date: fromLocalDT(eventFormStart.value),
    end_date: fromLocalDT(eventFormEnd.value),
  }

  try {
    if (eventForm.id) {
      // UPDATE
      let saved
      try {
        saved = await updateEvent(eventForm.id, payload)
      } catch {
        // fallback – zaktualizuj lokalnie
        saved = { ...events.value.find((x) => x.id === eventForm.id), ...payload }
      }
      const i = events.value.findIndex((x) => x.id === eventForm.id)
      if (i !== -1) events.value[i] = saved
      lsSet(LS_EVENTS, events.value)
      ok.value = 'Zapisano zmiany.'
    } else {
      // CREATE
      let created
      try {
        created = await createEvent(payload)
      } catch {
        created = {
          ...payload,
          id: `evt-${Math.random().toString(36).slice(2, 10)}`,
          groups: [],
        }
      }
      events.value = [created, ...events.value]
      lsSet(LS_EVENTS, events.value)
      selectedEventId.value = created.id
      ok.value = 'Utworzono wydarzenie.'
    }
    isEditingEvent.value = false
  } catch (e) {
    error.value = e?.message || 'Nie udało się zapisać wydarzenia.'
  } finally {
    loading.eventSave = false
  }
}

async function removeEvent(e) {
  if (!confirm(`Usunąć wydarzenie „${e.name || e.id}”?`)) return
  try {
    try {
      await deleteEvent(e.id)
    } catch {
      // fallback – OK
    }
    events.value = events.value.filter((x) => x.id !== e.id)
    lsSet(LS_EVENTS, events.value)
    if (selectedEventId.value === e.id) selectedEventId.value = ''
    // usuń drzewo z mock LS
    dropEventTreeLS(e.id)
  } catch (err) {
    alert(err?.message || 'Nie udało się usunąć wydarzenia.')
  }
}

// --- Weryfikacja (status -> CONFIRMED)
async function sendForVerification() {
  if (!selectedEventId.value) return
  if (!confirm('Wysłać wydarzenie do weryfikacji?')) return
  try {
    try {
      await confirmEvent(selectedEventId.value)
    } catch {
      // fallback – ustaw lokalnie jako CONFIRMED
    }
    const ev = events.value.find((x) => x.id === selectedEventId.value)
    if (ev) ev.status = 'CONFIRMED'
    lsSet(LS_EVENTS, events.value)
  } catch (e) {
    alert(e?.message || 'Nie udało się wysłać do weryfikacji.')
  }
}

// --- Formatery
function d(iso) {
  const x = new Date(iso)
  return x.toLocaleDateString()
}
function tt(iso) {
  const x = new Date(iso)
  return x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function badgeClass(status) {
  return status === 'CONFIRMED' ? 'badge--ok' : status === 'FINISHED' ? 'badge--muted' : ''
}

// ======== DRZEWO GRUP (mock LS + API fallback) ========

const LS_GROUPS = 'mock_evt_groups_v2'
// Struktura LS: { [eventId]: [{ id, name, description, parent_group_id:'', location:{lat,lng}|null, admins:[{id}], tasks:[{id,name,start_date,end_date,location}]}] }

function loadTreeLS(eventId) {
  const db = lsGet(LS_GROUPS, {})
  return Array.isArray(db[eventId]) ? db[eventId] : []
}
function saveTreeLS(eventId, arr) {
  const db = lsGet(LS_GROUPS, {})
  db[eventId] = arr
  lsSet(LS_GROUPS, db)
}
function dropEventTreeLS(eventId) {
  const db = lsGet(LS_GROUPS, {})
  delete db[eventId]
  lsSet(LS_GROUPS, db)
}

// ujednolicenie z dowolnego formatu (drzewo/płasko)
function normalizeGroups(groupsMaybeTree) {
  const out = []
  const walk = (arr, parent = '') => {
    for (const g of arr || []) {
      const id = g.id || `g-${Math.random().toString(36).slice(2, 8)}`
      out.push({
        id,
        name: g.name || id,
        description: g.description || '',
        parent_group_id: g.parent_group_id || parent || '',
        location: g.location || null,
        admins: g.admins || (g.admin_id ? [{ id: g.admin_id }] : []),
        tasks: (g.tasks || []).map((t) => ({
          id: t.id || `tsk-${Math.random().toString(36).slice(2, 8)}`,
          name: t.name || 'Zadanie',
          description: t.description || '',
          group_id: id,
          start_date: t.start_date || null,
          end_date: t.end_date || null,
          location: t.location || null,
          users: Array.isArray(t.users) ? t.users : [],
        })),
      })
      const kids = g.groups || g.children || []
      if (kids?.length) walk(kids, id)
    }
  }
  if (Array.isArray(groupsMaybeTree)) walk(groupsMaybeTree, '')
  return out
}

const flatGroups = ref([])

const rootGroups = computed(() => {
  const byId = new Map()
  ;(flatGroups.value || []).forEach((g) => byId.set(g.id, { ...g, children: [] }))
  const roots = []
  for (const g of byId.values()) {
    if (g.parent_group_id) {
      const p = byId.get(g.parent_group_id)
      if (p) p.children.push(g)
      else roots.push(g)
    } else roots.push(g)
  }
  return roots
})

async function reloadEventTree() {
  if (!selectedEventId.value) return
  loading.tree = true
  try {
    // 1) spróbuj z API
    let fromApi = null
    try {
      const ev = await getEvent(selectedEventId.value)
      fromApi = ev?.groups || []
    } catch {
      // OK
    }

    if (fromApi && fromApi.length) {
      flatGroups.value = normalizeGroups(fromApi)
      saveTreeLS(selectedEventId.value, flatGroups.value)
      return
    }

    // 2) fallback z LS
    const fromLs = loadTreeLS(selectedEventId.value)
    if (fromLs.length) {
      flatGroups.value = fromLs
      return
    }

    // 3) fallback z listy eventów (seed z mocku eventów)
    const seed = normalizeGroups(selectedEvent.value?.groups || [])
    flatGroups.value = seed
    saveTreeLS(selectedEventId.value, seed)
  } finally {
    loading.tree = false
  }
}

function upsertGroupLocal(group) {
  const arr = flatGroups.value.slice()
  const i = arr.findIndex((x) => x.id === group.id)
  if (i !== -1) arr[i] = { ...arr[i], ...group }
  else arr.push(group)
  flatGroups.value = arr
  saveTreeLS(selectedEventId.value, flatGroups.value)
}

function removeGroupLocal(groupId) {
  // usuń węzeł i całe poddrzewo
  const idsToRemove = new Set([groupId])
  let added = true
  while (added) {
    added = false
    for (const g of flatGroups.value) {
      if (g.parent_group_id && idsToRemove.has(g.parent_group_id) && !idsToRemove.has(g.id)) {
        idsToRemove.add(g.id)
        added = true
      }
    }
  }
  flatGroups.value = flatGroups.value.filter((g) => !idsToRemove.has(g.id))
  saveTreeLS(selectedEventId.value, flatGroups.value)
}

function findGroup(groupId) {
  return flatGroups.value.find((g) => g.id === groupId) || null
}

async function addRootGroup() {
  if (!selectedEventId.value) return
  const name = prompt('Nazwa nowej grupy (root):')
  if (!name) return
  const payload = { name, description: '', parent_group_id: '' }
  try {
    let created
    try {
      created = await createGroupForEvent(selectedEventId.value, payload)
    } catch {
      created = {
        id: `g-${Math.random().toString(36).slice(2, 10)}`,
        ...payload,
        location: null,
        admins: [{ id: meId.value }],
        tasks: [],
      }
    }
    upsertGroupLocal(created)
  } catch (e) {
    alert(e?.message || 'Nie udało się dodać grupy.')
  }
}

// ===== Zasada uprawnień: admin „na swoim poziomie i niżej” =====
const myAdminGroups = computed(() =>
  (flatGroups.value || []).filter((g) => (g.admins || []).some((a) => a.id === meId.value)),
)

function isDescendant(candidateId, ancestorId) {
  let cur = findGroup(candidateId)
  while (cur && cur.parent_group_id) {
    if (cur.parent_group_id === ancestorId) return true
    cur = findGroup(cur.parent_group_id)
  }
  return false
}
function canManageAdmins(groupNode) {
  if (auth.isGovAdmin || auth.isOrgAdmin) return true
  const target = groupNode
  // dowolna z moich grup admina daje uprawnienie:
  // - target jest tym samym węzłem
  // - target jest w poddrzewie mojej grupy
  // - target ma tego samego parenta (sibling „na tym samym poziomie”)
  for (const g of myAdminGroups.value) {
    if (g.id === target.id) return true
    if (isDescendant(target.id, g.id)) return true
    if (g.parent_group_id && g.parent_group_id === target.parent_group_id) return true
  }
  return false
}

// ===== Handlery z TreeNode (API -> fallback) =====
async function onSaveGroup(payload) {
  // payload: { id, name, description, location{lat,lng}|null }
  try {
    try {
      await updateEventGroup(selectedEventId.value, payload.id, {
        name: payload.name,
        description: payload.description,
        location: payload.location,
        parent_group_id: findGroup(payload.id)?.parent_group_id || '',
        admins: findGroup(payload.id)?.admins || [],
      })
    } catch {
      // OK
    }
    upsertGroupLocal({ ...findGroup(payload.id), ...payload })
  } catch (e) {
    alert(e?.message || 'Nie udało się zapisać grupy.')
  }
}

async function onAddChild(parentId, name) {
  if (!name) return
  try {
    let created
    try {
      created = await createGroupForEvent(selectedEventId.value, {
        name,
        description: '',
        parent_group_id: parentId,
      })
    } catch {
      created = {
        id: `g-${Math.random().toString(36).slice(2, 10)}`,
        name,
        description: '',
        parent_group_id: parentId,
        location: null,
        admins: [],
        tasks: [],
      }
    }
    upsertGroupLocal(created)
  } catch (e) {
    alert(e?.message || 'Nie udało się dodać podgrupy.')
  }
}

async function onRemoveGroup(groupId, groupName) {
  if (!confirm(`Usunąć grupę „${groupName || groupId}” i jej podgrupy?`)) return
  try {
    try {
      await deleteEventGroup(selectedEventId.value, groupId)
    } catch {
      // OK
    }
    removeGroupLocal(groupId)
  } catch (e) {
    alert(e?.message || 'Nie udało się usunąć grupy.')
  }
}

async function onAddAdmin(groupId, userId) {
  const g = findGroup(groupId)
  if (!g) return
  const next = [...(g.admins || [])]
  if (!next.some((a) => a.id === userId)) next.push({ id: userId })
  try {
    try {
      await updateEventGroup(selectedEventId.value, groupId, { admins: next })
    } catch {
      // OK
    }
    upsertGroupLocal({ ...g, admins: next })
  } catch (e) {
    alert(e?.message || 'Nie udało się dodać admina.')
  }
}

async function onRemoveAdmin(groupId, userId) {
  const g = findGroup(groupId)
  if (!g) return
  const next = (g.admins || []).filter((a) => a.id !== userId)
  try {
    try {
      await updateEventGroup(selectedEventId.value, groupId, { admins: next })
    } catch {
      // OK
    }
    upsertGroupLocal({ ...g, admins: next })
  } catch (e) {
    alert(e?.message || 'Nie udało się usunąć admina.')
  }
}

// --- Taski (skrót)
async function onCreateTask(groupId, taskDraft) {
  const g = findGroup(groupId)
  if (!g) return
  const body = {
    name: taskDraft.name,
    description: taskDraft.description || '',
    start_date: taskDraft.start_date || null,
    end_date: taskDraft.end_date || null,
    location:
      taskDraft.lat || taskDraft.lng
        ? { lat: Number(taskDraft.lat) || 0, lng: Number(taskDraft.lng) || 0 }
        : null,
  }
  let created
  try {
    created = await createTask(groupId, body)
  } catch {
    created = {
      id: `tsk-${Math.random().toString(36).slice(2, 10)}`,
      ...body,
      group_id: groupId,
      users: [],
    }
  }
  const next = [...(g.tasks || []), created]
  upsertGroupLocal({ ...g, tasks: next })
}

async function onUpdateTask(groupId, taskId, patch) {
  const g = findGroup(groupId)
  if (!g) return
  let saved = null
  try {
    try {
      saved = await updateTask(groupId, taskId, patch)
    } catch {
      // OK – zapis lokalny
    }
    const next = (g.tasks || []).map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    upsertGroupLocal({ ...g, tasks: next })
  } catch (e) {
    alert(e?.message || 'Nie udało się zapisać zadania.')
  }
}

async function onDeleteTask(groupId, taskId) {
  const g = findGroup(groupId)
  if (!g) return
  if (!confirm('Usunąć to zadanie?')) return
  try {
    try {
      await deleteTask(groupId, taskId)
    } catch {
      // OK
    }
    const next = (g.tasks || []).filter((t) => t.id !== taskId)
    upsertGroupLocal({ ...g, tasks: next })
  } catch (e) {
    alert(e?.message || 'Nie udało się usunąć zadania.')
  }
}

// ====== Rekurencyjny węzeł drzewa (bez JSX) ======
const TreeNode = defineComponent({
  name: 'TreeNode',
  props: {
    node: { type: Object, required: true },
    level: { type: Number, default: 0 },
    canManageAdmins: { type: Boolean, default: false },
  },
  emits: [
    'save',
    'add-child',
    'remove',
    'add-admin',
    'remove-admin',
    'create-task',
    'update-task',
    'delete-task',
  ],
  setup(props, { emit }) {
    const open = ref(true)
    const editing = ref(false)
    const draft = reactive({
      name: props.node.name,
      description: props.node.description || '',
      lat: props.node.location?.lat ?? '',
      lng: props.node.location?.lng ?? '',
    })
    const newAdminId = ref('')

    // Task editing (po jednym naraz w danym węźle)
    const addTaskOpen = ref(false)
    const taskEditingId = ref('')
    const taskDraft = reactive({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      lat: '',
      lng: '',
    })

    watch(
      () => props.node,
      (n) => {
        editing.value = false
        taskEditingId.value = ''
        addTaskOpen.value = false
        draft.name = n.name
        draft.description = n.description || ''
        draft.lat = n.location?.lat ?? ''
        draft.lng = n.location?.lng ?? ''
      },
      { deep: true },
    )

    function header() {
      return h('div', { class: 'node__head' }, [
        h('div', { class: 'node__title' }, [
          h('strong', null, props.node.name),
          h('span', { class: 'node__level' }, `poziom ${props.level}`),
        ]),
        h('div', { class: 'node__actions' }, [
          h(
            'button',
            { class: 'btn', onClick: () => (open.value = !open.value) },
            open.value ? 'Zwiń' : 'Rozwiń',
          ),
          h('button', { class: 'btn', onClick: () => (editing.value = true) }, 'Edytuj'),
          h('button', { class: 'btn', onClick: () => addChild() }, 'Dodaj podgrupę'),
          h(
            'button',
            {
              class: 'btn btn--danger',
              onClick: () => emit('remove', props.node.id, props.node.name),
            },
            'Usuń',
          ),
        ]),
      ])
    }

    function viewBody() {
      // Admini
      const adminsBar = h('div', { class: 'node__admins' }, [
        h('span', { class: 'chip' }, `Admini: ${(props.node.admins || []).length}`),
        ...(props.node.admins || []).map((a) =>
          h('span', { class: 'chip', title: a.id }, [
            a.id,
            props.canManageAdmins
              ? h(
                  'button',
                  {
                    class: 'btn',
                    title: 'Usuń admina',
                    style: 'padding:0 0.25rem',
                    onClick: () => emit('remove-admin', props.node.id, a.id),
                  },
                  '✕',
                )
              : null,
          ]),
        ),
        props.canManageAdmins
          ? h('input', {
              class: 'input',
              placeholder: 'user-id nowego admina',
              style: 'max-width:200px',
              value: newAdminId.value,
              onInput: (e) => (newAdminId.value = e.target.value),
            })
          : null,
        props.canManageAdmins
          ? h(
              'button',
              {
                class: 'btn',
                title: props.canManageAdmins ? 'Dodaj admina' : 'Brak uprawnień (poziom wyższy)',
                disabled: !props.canManageAdmins,
                onClick: () => {
                  const id = (newAdminId.value || '').trim()
                  if (!id) return
                  emit('add-admin', props.node.id, id)
                  newAdminId.value = ''
                },
              },
              'Dodaj admina',
            )
          : null,
      ])

      // Opis + lokalizacja
      const meta = h('div', { class: 'grid-gap', style: 'margin-top:0.5rem' }, [
        h('div', null, [h('strong', null, 'Opis: '), props.node.description || '—']),
        h('div', null, [
          h('strong', null, 'Lokalizacja: '),
          props.node.location
            ? `lat=${props.node.location.lat} lng=${props.node.location.lng}`
            : '—',
        ]),
      ])

      // Taski
      const tasksHeader = h('div', { class: 'node__actions', style: 'margin-top:0.5rem' }, [
        h('strong', null, `Zadania (${(props.node.tasks || []).length})`),
        h(
          'button',
          { class: 'btn', onClick: () => toggleAddTask() },
          addTaskOpen.value ? 'Anuluj' : 'Dodaj zadanie',
        ),
      ])

      const tasksList = h(
        'div',
        { class: 'tasks' },
        (props.node.tasks || []).map((t) =>
          taskEditingId.value === t.id ? taskEditForm(t) : taskRow(t),
        ),
      )

      return h('div', { class: 'view' }, [
        adminsBar,
        meta,
        tasksHeader,
        addTaskOpen.value ? addTaskForm() : null,
        tasksList,
      ])
    }

    function addChild() {
      const name = typeof window !== 'undefined' ? window.prompt('Nazwa podgrupy:') : ''
      if (name) emit('add-child', props.node.id, name)
    }

    // --- Edycja grupy
    function editBody() {
      const row = (label, field) =>
        h('div', { class: 'row' }, [h('label', { class: 'lbl' }, label), field])

      const nameIn = h('input', {
        class: 'input',
        required: true,
        value: draft.name,
        onInput: (e) => (draft.name = e.target.value),
      })
      const descIn = h('textarea', {
        class: 'textarea',
        rows: 2,
        value: draft.description,
        onInput: (e) => (draft.description = e.target.value),
      })
      const latIn = h('input', {
        class: 'input',
        type: 'number',
        step: '0.000001',
        placeholder: 'lat',
        value: draft.lat,
        onInput: (e) => (draft.lat = e.target.value),
        style: 'width:140px',
      })
      const lngIn = h('input', {
        class: 'input',
        type: 'number',
        step: '0.000001',
        placeholder: 'lng',
        value: draft.lng,
        onInput: (e) => (draft.lng = e.target.value),
        style: 'width:140px',
      })

      const actions = h('div', { class: 'node__actions' }, [
        h(
          'button',
          {
            class: 'btn btn--primary',
            onClick: () => {
              const payload = {
                id: props.node.id,
                name: draft.name.trim() || props.node.name,
                description: draft.description || '',
                location:
                  draft.lat || draft.lng
                    ? { lat: Number(draft.lat) || 0, lng: Number(draft.lng) || 0 }
                    : null,
              }
              emit('save', payload)
              editing.value = false
            },
          },
          'Zapisz',
        ),
        h('button', { class: 'btn', onClick: () => (editing.value = false) }, 'Anuluj'),
      ])

      return h('form', { class: 'grid-gap', onSubmit: (e) => e.preventDefault() }, [
        row('Nazwa', nameIn),
        row('Opis', descIn),
        row('Lokalizacja', h('div', { class: 'inline' }, [latIn, lngIn])),
        actions,
      ])
    }

    // --- Taski (formularze i wiersze)
    function toggleAddTask() {
      addTaskOpen.value = !addTaskOpen.value
      taskEditingId.value = ''
      taskDraft.name = ''
      taskDraft.description = ''
      taskDraft.start_date = ''
      taskDraft.end_date = ''
      taskDraft.lat = ''
      taskDraft.lng = ''
    }

    function addTaskForm() {
      const row = (label, control) =>
        h('div', { class: 'row' }, [h('label', { class: 'lbl' }, label), control])
      const nameIn = h('input', {
        class: 'input',
        required: true,
        value: taskDraft.name,
        onInput: (e) => (taskDraft.name = e.target.value),
      })
      const descIn = h('textarea', {
        class: 'textarea',
        rows: 2,
        value: taskDraft.description,
        onInput: (e) => (taskDraft.description = e.target.value),
      })
      const startIn = h('input', {
        class: 'input',
        type: 'datetime-local',
        value: taskDraft.start_date,
        onInput: (e) => (taskDraft.start_date = e.target.value),
      })
      const endIn = h('input', {
        class: 'input',
        type: 'datetime-local',
        value: taskDraft.end_date,
        onInput: (e) => (taskDraft.end_date = e.target.value),
      })
      const latIn = h('input', {
        class: 'input',
        type: 'number',
        step: '0.000001',
        placeholder: 'lat',
        value: taskDraft.lat,
        onInput: (e) => (taskDraft.lat = e.target.value),
        style: 'width:140px',
      })
      const lngIn = h('input', {
        class: 'input',
        type: 'number',
        step: '0.000001',
        placeholder: 'lng',
        value: taskDraft.lng,
        onInput: (e) => (taskDraft.lng = e.target.value),
        style: 'width:140px',
      })
      const actions = h('div', { class: 'node__actions' }, [
        h(
          'button',
          {
            class: 'btn btn--primary',
            onClick: () => {
              if (!taskDraft.name.trim()) return
              emit('create-task', props.node.id, { ...taskDraft })
              toggleAddTask()
            },
          },
          'Dodaj',
        ),
        h('button', { class: 'btn', onClick: () => toggleAddTask() }, 'Anuluj'),
      ])

      return h('form', { class: 'grid-gap', onSubmit: (e) => e.preventDefault() }, [
        row('Nazwa', nameIn),
        row('Opis', descIn),
        row('Start', startIn),
        row('Koniec', endIn),
        row('Lokalizacja', h('div', { class: 'inline' }, [latIn, lngIn])),
        actions,
      ])
    }

    function taskRow(t) {
      return h('div', { class: 'task' }, [
        h('div', { class: 'task__main' }, [
          h('div', { class: 'task__title' }, [
            h('strong', null, t.name),
            h('span', { class: 'muted' }, [
              t.start_date
                ? new Date(t.start_date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—',
              '–',
              t.end_date
                ? new Date(t.end_date).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—',
            ]),
          ]),
        ]),
        h('div', { class: 'task__actions' }, [
          h('button', { class: 'btn', onClick: () => startEditTask(t) }, 'Edytuj'),
          h(
            'button',
            { class: 'btn btn--danger', onClick: () => emit('delete-task', props.node.id, t.id) },
            'Usuń',
          ),
        ]),
      ])
    }

    function startEditTask(t) {
      addTaskOpen.value = false
      taskEditingId.value = t.id
      taskDraft.name = t.name || ''
      taskDraft.description = t.description || ''
      taskDraft.start_date = t.start_date ? toLocal(t.start_date) : ''
      taskDraft.end_date = t.end_date ? toLocal(t.end_date) : ''
      taskDraft.lat = t.location?.lat ?? ''
      taskDraft.lng = t.location?.lng ?? ''
    }

    function toLocal(iso) {
      if (!iso) return ''
      const d = new Date(iso)
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
        d.getMinutes(),
      )}`
    }

    function taskEditForm(t) {
      const row = (label, control) =>
        h('div', { class: 'row' }, [h('label', { class: 'lbl' }, label), control])
      const nameIn = h('input', {
        class: 'input',
        required: true,
        value: taskDraft.name,
        onInput: (e) => (taskDraft.name = e.target.value),
      })
      const descIn = h('textarea', {
        class: 'textarea',
        rows: 2,
        value: taskDraft.description,
        onInput: (e) => (taskDraft.description = e.target.value),
      })
      const startIn = h('input', {
        class: 'input',
        type: 'datetime-local',
        value: taskDraft.start_date,
        onInput: (e) => (taskDraft.start_date = e.target.value),
      })
      const endIn = h('input', {
        class: 'input',
        type: 'datetime-local',
        value: taskDraft.end_date,
        onInput: (e) => (taskDraft.end_date = e.target.value),
      })
      const latIn = h('input', {
        class: 'input',
        type: 'number',
        step: '0.000001',
        placeholder: 'lat',
        value: taskDraft.lat,
        onInput: (e) => (taskDraft.lat = e.target.value),
        style: 'width:140px',
      })
      const lngIn = h('input', {
        class: 'input',
        type: 'number',
        step: '0.000001',
        placeholder: 'lng',
        value: taskDraft.lng,
        onInput: (e) => (taskDraft.lng = e.target.value),
        style: 'width:140px',
      })
      const actions = h('div', { class: 'node__actions' }, [
        h(
          'button',
          {
            class: 'btn btn--primary',
            onClick: () => {
              const patch = {
                name: taskDraft.name,
                description: taskDraft.description || '',
                start_date: taskDraft.start_date
                  ? new Date(taskDraft.start_date).toISOString()
                  : null,
                end_date: taskDraft.end_date ? new Date(taskDraft.end_date).toISOString() : null,
                location:
                  taskDraft.lat || taskDraft.lng
                    ? { lat: Number(taskDraft.lat) || 0, lng: Number(taskDraft.lng) || 0 }
                    : null,
              }
              emit('update-task', props.node.id, t.id, patch)
              taskEditingId.value = ''
            },
          },
          'Zapisz',
        ),
        h('button', { class: 'btn', onClick: () => (taskEditingId.value = '') }, 'Anuluj'),
      ])

      return h('form', { class: 'grid-gap', onSubmit: (e) => e.preventDefault() }, [
        row('Nazwa', nameIn),
        row('Opis', descIn),
        row('Start', startIn),
        row('Koniec', endIn),
        row('Lokalizacja', h('div', { class: 'inline' }, [latIn, lngIn])),
        actions,
      ])
    }

    return () =>
      h('li', { class: 'node' }, [
        header(),
        open.value
          ? h('div', { class: 'node__body' }, [
              editing.value ? editBody() : viewBody(),
              props.node.children?.length
                ? h(
                    'ul',
                    { class: 'children' },
                    props.node.children.map((c) =>
                      h(TreeNode, {
                        node: c,
                        level: (props.level || 0) + 1,
                        canManageAdmins: props.canManageAdmins, // ta sama zasada schodzi niżej
                        onSave: (p) => emit('save', p),
                        onAddChild: (id, name) => emit('add-child', id, name),
                        onRemove: (id, name) => emit('remove', id, name),
                        onAddAdmin: (gid, uid) => emit('add-admin', gid, uid),
                        onRemoveAdmin: (gid, uid) => emit('remove-admin', gid, uid),
                        onCreateTask: (gid, td) => emit('create-task', gid, td),
                        onUpdateTask: (gid, tid, patch) => emit('update-task', gid, tid, patch),
                        onDeleteTask: (gid, tid) => emit('delete-task', gid, tid),
                      }),
                    ),
                  )
                : h('div', { class: 'muted', style: 'margin-top:0.35rem' }, 'Brak podgrup.'),
            ])
          : null,
      ])
  },
})

// ====== INIT ======
onMounted(async () => {
  await reloadEvents()
  // wybierz pierwszy event jako domyślny do grup
  selectedEventId.value = events.value[0]?.id || ''
  if (selectedEventId.value) await reloadEventTree()
})
</script>

<style scoped lang="scss">
.head {
  margin-bottom: 0.75rem;
  .muted {
    color: $muted-color;
  }
}

.tabs {
  display: inline-flex;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
}

.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.actions {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: $surface;
  padding: 0.6rem 0.6rem;
  & + .row {
    margin-top: 0.5rem;
  }
}
.title {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}
.sub {
  font-size: 0.92rem;
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

  &.badge--ok {
    background: rgba($blue-color, 0.08);
    border-color: rgba($blue-color, 0.3);
    color: $blue-color;
  }
  &.badge--muted {
    opacity: 0.75;
  }
}

.form .row {
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
.err {
  color: $red-color;
}
.ok {
  color: $blue-color;
}

/* Pasek nad drzewem */
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

/* TREE */
.tree {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.node {
  border: 1px solid $border-color;
  border-radius: $radius-md;
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: $surface;
}

.node__head {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;
}
.node__title {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}
.node__level {
  color: $muted-color;
}
.node__actions {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
}
.node__body {
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px dashed $border-color;
}
.node__admins {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.4rem;
  border-radius: $radius-sm;
  background: $surface-hover;
  border: 1px solid $border-color;
  color: $muted-color;
}

/* Tasks mini UI (spójny z kalendarzem) */
.tasks {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.task {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 0.6rem;
  background: $surface;
}
.task__main {
  display: grid;
  gap: 0.25rem;
}
.task__title {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;

  .muted {
    color: $muted-color;
    font-size: 0.95rem;
  }
}
.task__actions {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
}

.children {
  margin-left: 1rem;
}
</style>
