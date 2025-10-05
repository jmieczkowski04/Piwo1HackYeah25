<template>
  <div class="opinions">
    <header class="head">
      <h2>Opinie</h2>
      <p class="muted">
        <template v-if="auth.isVolunteer">
          Przegląd Twoich opinii wystawionych przez organizatorów.
        </template>
        <template v-else-if="auth.isCoordinator">
          Wybierz wolontariusza, aby podejrzeć jego opinie.
        </template>
        <template v-else-if="auth.isOrgAdmin">
          Wybierz wydarzenie i ewentualnie grupę. Możesz dodawać, edytować i usuwać opinie.
        </template>
        <template v-else-if="auth.isGovAdmin">
          Dostęp do wszystkich wydarzeń/grup. Możesz dodawać, edytować i usuwać opinie.
        </template>
      </p>
    </header>

    <!-- FORM: dodawanie / edycja (ORG_ADMIN/GOV_ADMIN) -->
    <section v-if="canManage" class="card">
      <div class="card__head">
        <h3>{{ editId ? 'Edytuj opinię' : 'Dodaj opinię' }}</h3>
        <span v-if="saving" class="muted">Zapisywanie…</span>
      </div>

      <div class="form">
        <div class="row" v-if="!auth.isCoordinator && !auth.isVolunteer">
          <label class="lbl">Wolontariusz</label>
          <select class="select" v-model="form.userId">
            <option disabled value="">— wybierz —</option>
            <option v-for="u in volunteersInScope" :key="u.id" :value="u.id">
              {{ nameOf(u.id) }}
            </option>
          </select>
        </div>

        <div class="row" v-if="!auth.isVolunteer && !auth.isCoordinator">
          <label class="lbl">Grupa</label>
          <select class="select" v-model="form.groupId">
            <option disabled value="">— wybierz —</option>
            <option v-for="g in groupsForSelectedEvent" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>
        </div>

        <div class="row">
          <label class="lbl">Ocena (1–5)</label>
          <input
            class="input w-160"
            type="number"
            min="1"
            max="5"
            step="0.5"
            v-model.number="form.rating"
          />
        </div>

        <div class="row">
          <label class="lbl">Komentarz</label>
          <textarea class="textarea" rows="3" v-model.trim="form.comment" />
        </div>

        <div class="actions">
          <button
            class="btn btn--primary"
            :disabled="!canSubmit || saving || !canManage"
            @click="onSubmit"
          >
            {{ editId ? 'Zapisz zmiany' : 'Dodaj' }}
          </button>
          <button class="btn" v-if="editId" :disabled="saving" @click="resetForm">Anuluj</button>
          <span class="err" v-if="error">{{ error }}</span>
          <span class="ok" v-if="ok">{{ ok }}</span>
        </div>
      </div>
    </section>
    <!-- FILTRY / KONTROLS -->
    <section class="card controls">
      <!-- VOLUNTEER: żadnych filtrów -->
      <template v-if="auth.isVolunteer">
        <div class="row">
          <label class="lbl">Użytkownik</label>
          <div>{{ meName }}</div>
        </div>
      </template>

      <!-- COORDINATOR: wybór wolontariusza -->
      <template v-else-if="auth.isCoordinator">
        <div class="row">
          <label class="lbl">Wolontariusz</label>
          <select class="select" v-model="selectedUserId" @change="reloadOpinions">
            <option disabled value="">— wybierz —</option>
            <option v-for="u in coordinatorVols" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </div>
      </template>

      <!-- ORG_ADMIN / GOV_ADMIN: wybór eventu + grupy + (opcjonalnie) wolontariusza do edycji -->
      <template v-else>
        <div class="row">
          <label class="lbl">Wydarzenie</label>
          <select class="select" v-model="selectedEventId" @change="onEventChange">
            <option disabled value="">— wybierz —</option>
            <option v-for="e in eventOptions" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>

        <div class="row">
          <label class="lbl">Grupa (opcjonalnie)</label>
          <select class="select" v-model="selectedGroupId" @change="reloadOpinions">
            <option value="">— wszystkie grupy —</option>
            <option v-for="g in groupsForSelectedEvent" :key="g.id" :value="g.id">
              {{ g.name }}
            </option>
          </select>
        </div>

        <div class="row">
          <label class="lbl">Wolontariusz (lista zawężona do eventu/grupy)</label>
          <select class="select" v-model="selectedUserId" @change="reloadOpinions">
            <option value="">— wszyscy w zakresie —</option>
            <option v-for="u in volunteersInScope" :key="u.id" :value="u.id">
              {{ nameOf(u.id) }}
            </option>
          </select>
        </div>
      </template>
    </section>

    <!-- LISTA OPINII -->
    <section class="card">
      <div class="card__head">
        <h3>Opinie</h3>
        <button class="btn" @click="reloadOpinions" :disabled="loading">Odśwież</button>
      </div>

      <div v-if="loading" class="muted">Ładowanie…</div>
      <template v-else>
        <p v-if="rows.length === 0" class="muted">Brak opinii w bieżącym zakresie.</p>

        <div v-else class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Wolontariusz</th>
                <th>Grupa</th>
                <th class="num">Ocena</th>
                <th>Komentarz</th>
                <th v-if="canManage" class="num">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in rows" :key="o.id">
                <td>{{ nameOf(o.user_id) }}</td>
                <td>{{ groupLabel(o.group_id) }}</td>
                <td class="num">{{ o.rating }}</td>
                <td>{{ o.comment || '—' }}</td>
                <td v-if="canManage" class="num">
                  <button class="btn" @click="startEdit(o)">Edytuj</button>
                  <button class="btn btn--danger" @click="removeOpinion(o)" :disabled="saving">
                    Usuń
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore, ROLE } from '@/stores/auth.js'
import { listEventsForUser } from '@/api/user.js'
import { getUser } from '@/api/user.js'
import { createOpinion, getOpinion, updateOpinion, deleteOpinion } from '@/api/opinion.js'
import { mockEventsForUser } from '@/mocks/events.js'
import {
  mockUsers,
  mockCoordinatorVolunteers,
  mockOrganizerVolunteers,
  mockAllVolunteers,
} from '@/mocks/certificates.js'
import {
  listByUser as listMock,
  create as createMock,
  update as updateMock,
  remove as deleteMock,
} from '@/mocks/opinions.js'

const auth = useAuthStore()

const meId = computed(() => auth.user?.id || 'u-1')
const meName = computed(() => auth.user?.name || 'Ja')
const canManage = computed(
  () => auth.currentRole === ROLE.ORG_ADMIN || auth.currentRole === ROLE.GOV_ADMIN,
)

const eventOptions = ref([])
const selectedEventId = ref('')
const selectedGroupId = ref('')
const selectedUserId = ref('')

// dla koordynatora – wolontariusze „pod sobą”
const coordinatorVols = computed(() => mockCoordinatorVolunteers(auth.user?.id))

// grupy w wybranym evencie
const groupsForSelectedEvent = computed(() => {
  const ev = eventOptions.value.find((e) => e.id === selectedEventId.value)
  if (!ev) return []
  return (ev.groups || []).map((g) => ({ id: g.id, name: g.name || g.id }))
})

// wszyscy wolontariusze obecni w zakresie (event/grupa)
const volunteersInScope = computed(() => {
  const ev = eventOptions.value.find((e) => e.id === selectedEventId.value)
  if (!ev) return []
  const set = new Set()
  for (const g of ev.groups || []) {
    if (selectedGroupId.value && g.id !== selectedGroupId.value) continue
    for (const t of g.tasks || []) {
      for (const u of t.users || []) set.add(u.id)
    }
  }
  return Array.from(set).map((id) => ({ id }))
})

// --- LISTA OPINII ---
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const ok = ref('')
const rows = ref([])

// --- FORM ---
const editId = ref('')
const form = ref({
  userId: '',
  groupId: '',
  rating: 5,
  comment: '',
})

const canSubmit = computed(() => {
  if (!canManage.value) return false
  return (
    form.value.userId &&
    form.value.groupId &&
    Number.isFinite(form.value.rating) &&
    form.value.rating >= 1 &&
    form.value.rating <= 5
  )
})

// --- HELPERS (nazwy/etykiety) ---
function nameOf(userId) {
  const m = mockUsers.find((u) => u.id === userId)
  return m?.name || userId
}
function groupLabel(groupId) {
  const ev = eventOptions.value.find((e) => e.id === selectedEventId.value)
  const g = ev?.groups?.find((x) => x.id === groupId)
  return g?.name || groupId || '—'
}

// --- INIT ---
onMounted(async () => {
  await loadEventsForCurrentRole()
  await initSelections()
  await reloadOpinions()
})

watch([() => auth.currentRole], async () => {
  rows.value = []
  await loadEventsForCurrentRole()
  await initSelections()
  await reloadOpinions()
})

// Ładowanie wydarzeń dostępnych dla roli (API -> mock fallback)
async function loadEventsForCurrentRole() {
  try {
    const resp = await listEventsForUser(meId.value)
    const arr = Array.isArray(resp) ? resp : resp?.events
    if (!arr) throw new Error('no events')
    eventOptions.value = arr
  } catch {
    eventOptions.value = mockEventsForUser()
  }
}

// Ustalenie wstępnych wyborów per rola
async function initSelections() {
  error.value = ''
  if (auth.isVolunteer) {
    selectedUserId.value = meId.value
  } else if (auth.isCoordinator) {
    selectedUserId.value = coordinatorVols.value[0]?.id || ''
  } else {
    // ORG_ADMIN / GOV_ADMIN
    selectedEventId.value = eventOptions.value[0]?.id || ''
    selectedGroupId.value = ''
    selectedUserId.value = ''
    // wstępne ustawienia formularza (grupa i user jeśli jedyne dostępne)
    form.value.groupId = groupsForSelectedEvent.value[0]?.id || ''
    form.value.userId = volunteersInScope.value[0]?.id || ''
  }
}

// zmiana eventu -> reset filtrów zależnych
async function onEventChange() {
  selectedGroupId.value = ''
  selectedUserId.value = ''
  form.value.groupId = groupsForSelectedEvent.value[0]?.id || ''
  form.value.userId = volunteersInScope.value[0]?.id || ''
  await reloadOpinions()
}

// --- GŁÓWNE: pobranie opinii ---
async function reloadOpinions() {
  loading.value = true
  error.value = ''
  ok.value = ''
  rows.value = []
  try {
    // Zbiór userów, dla których pobieramy opinie
    let userIds = []
    if (auth.isVolunteer || auth.isCoordinator) {
      if (selectedUserId.value) userIds = [selectedUserId.value]
    } else {
      // ORG_ADMIN / GOV_ADMIN → cały scope, ewentualnie zawężony do konkretnego usera
      userIds = selectedUserId.value
        ? [selectedUserId.value]
        : volunteersInScope.value.map((v) => v.id)
    }

    const all = []
    for (const uid of userIds) {
      const userOpinions = await fetchOpinionsForUser(uid)
      // zawężenie po grupie (jeśli ustawiona)
      const filtered =
        selectedGroupId.value && !auth.isCoordinator && !auth.isVolunteer
          ? userOpinions.filter((o) => o.group_id === selectedGroupId.value)
          : userOpinions
      all.push(...filtered)
    }
    rows.value = all.sort((a, b) => (a.id > b.id ? -1 : 1))
  } catch (e) {
    error.value = e?.message || 'Nie udało się pobrać opinii.'
  } finally {
    loading.value = false
  }
}

// próba: /user/:id → opinions[] → GET każdej; fallback: mock
async function fetchOpinionsForUser(uid) {
  try {
    const u = await getUser(uid)
    const opIds = Array.isArray(u?.opinions) ? u.opinions.map((o) => o.id) : []
    if (!opIds.length) return []
    const calls = opIds.map(async (id) => {
      try {
        return await getOpinion(uid, id)
      } catch {
        // gdyby pojedynczy GET padł, i tak później fallback
        return null
      }
    })
    const settled = await Promise.allSettled(calls)
    const list = settled.filter((s) => s.status === 'fulfilled' && s.value).map((s) => s.value)
    if (list.length) return list
    // gdy backend nie ma jeszcze list, spadamy do mocka
    return listMock(uid)
  } catch {
    // pełny fallback
    return listMock(uid)
  }
}

// --- CRUD (tylko ORG_ADMIN / GOV_ADMIN) ---
async function onSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  error.value = ''
  ok.value = ''
  try {
    if (editId.value) {
      // UPDATE
      try {
        const saved = await updateOpinion(form.value.userId, editId.value, {
          group_id: form.value.groupId,
          rating: form.value.rating,
          comment: form.value.comment,
        })
        applyUpsertLocal(saved)
      } catch {
        const saved = updateMock({
          id: editId.value,
          patch: {
            group_id: form.value.groupId,
            rating: form.value.rating,
            comment: form.value.comment,
          },
        })
        applyUpsertLocal(saved)
      }
      ok.value = 'Zapisano zmiany.'
    } else {
      // CREATE
      if (!form.value.userId) throw new Error('Wybierz wolontariusza.')
      try {
        const created = await createOpinion(form.value.userId, {
          group_id: form.value.groupId,
          rating: form.value.rating,
          comment: form.value.comment,
        })
        rows.value = [created, ...rows.value]
      } catch {
        const created = createMock({
          userId: form.value.userId,
          groupId: form.value.groupId,
          rating: form.value.rating,
          comment: form.value.comment,
        })
        rows.value = [created, ...rows.value]
      }
      ok.value = 'Dodano opinię.'
    }
    resetForm(true)
  } catch (e) {
    error.value = e?.message || 'Nie udało się zapisać opinii.'
  } finally {
    saving.value = false
  }
}

function applyUpsertLocal(saved) {
  const idx = rows.value.findIndex((x) => x.id === saved.id)
  if (idx !== -1) rows.value[idx] = saved
  else rows.value = [saved, ...rows.value]
}

function startEdit(o) {
  editId.value = o.id
  form.value.userId = o.user_id
  // jeśli zmienimy event, upewnijmy się, że grupa należy do niego
  form.value.groupId = o.group_id
  form.value.rating = o.rating
  form.value.comment = o.comment || ''
  ok.value = ''
  error.value = ''
}

function resetForm(keepScope = false) {
  editId.value = ''
  form.value.rating = 5
  form.value.comment = ''
  if (!keepScope) {
    form.value.userId = volunteersInScope.value[0]?.id || ''
    form.value.groupId = groupsForSelectedEvent.value[0]?.id || ''
  }
}

async function removeOpinion(o) {
  if (!confirm('Usunąć tę opinię?')) return
  saving.value = true
  error.value = ''
  ok.value = ''
  try {
    try {
      await deleteOpinion(o.user_id, o.id)
    } catch {
      deleteMock(o.id)
    }
    rows.value = rows.value.filter((x) => x.id !== o.id)
    if (editId.value === o.id) resetForm()
  } catch (e) {
    error.value = e?.message || 'Nie udało się usunąć opinii.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.head {
  margin-bottom: 0.75rem;
  .muted {
    color: $muted-color;
  }
}

.controls .row,
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

.w-160 {
  width: 160px;
}

.actions {
  margin-top: 0.5rem;
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;

  .err {
    color: $red-color;
  }
  .ok {
    color: $blue-color;
  }
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
    vertical-align: top;
  }
  thead th {
    text-align: left;
    background: $surface-hover;
    border-top: 1px solid $border-color;
  }
  .num {
    text-align: right;
    white-space: nowrap;
    width: 140px;
  }
}
</style>