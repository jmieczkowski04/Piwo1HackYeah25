<template>
  <div class="notif">
    <header class="head">
      <h2>Ustawienia powiadomień</h2>
      <p class="muted">
        Wybierz, o czym chcesz być informowany(a). Dostępne tylko dla roli Wolontariusz.
      </p>
    </header>

    <section class="card">
      <div class="card__head">
        <h3>{{ editId ? 'Edytuj powiadomienie' : 'Dodaj powiadomienie' }}</h3>
        <span v-if="loading" class="muted">Zapisywanie…</span>
      </div>

      <div class="form">
        <div class="row">
          <label class="lbl">Rodzaj</label>
          <select class="select" v-model="form.type" :disabled="!!editId">
            <option disabled value="">— wybierz —</option>
            <option :value="TYPES.INCOMING_EVENT">Nadchodzące wydarzenie</option>
            <option :value="TYPES.TASK_APPROVED">Zatwierdzenie do zadania</option>
            <option :value="TYPES.OPINION_ISSUED">Wystawienie opinii</option>
          </select>
        </div>

        <div class="row">
          <label class="lbl">Warunek</label>

          <template v-if="form.type === TYPES.INCOMING_EVENT">
            <div class="stack">
              <div class="inline">
                <input
                  class="input w-120"
                  type="number"
                  min="0"
                  step="1"
                  v-model.number="days"
                  @input="syncConditionFromDays"
                />
                <span class="muted">dni do eventu</span>
              </div>
              <small class="muted">Powiadom, gdy do wydarzenia zostaje X dni.</small>
            </div>
          </template>

          <template v-else-if="form.type">
            <div class="stack">
              <label class="check">
                <input type="checkbox" v-model="boolTrue" @change="syncConditionFromBool" />
                Aktywne (powiadamiaj)
              </label>
              <small class="muted">Warunek: zawsze, gdy zajdzie zdarzenie.</small>
            </div>
          </template>

          <template v-else>
            <span class="muted">Najpierw wybierz rodzaj.</span>
          </template>
        </div>

        <div class="actions">
          <button class="btn btn--primary" :disabled="!canSubmit || loading" @click="onSubmit">
            {{ editId ? 'Zapisz zmiany' : 'Dodaj' }}
          </button>
          <button class="btn" v-if="editId" :disabled="loading" @click="resetForm">Anuluj</button>
          <span class="err" v-if="error">{{ error }}</span>
          <span class="ok" v-if="ok">{{ ok }}</span>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card__head">
        <h3>Twoje powiadomienia</h3>
        <button class="btn" @click="reload" :disabled="loading">Odśwież</button>
      </div>

      <template v-if="items.length">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Rodzaj</th>
                <th>Warunek</th>
                <th class="num">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in items" :key="n.id">
                <td>{{ labelOf(n.type) }}</td>
                <td>{{ humanCondition(n) }}</td>
                <td class="num">
                  <button class="btn" @click="startEdit(n)">Edytuj</button>
                  <button class="btn btn--danger" @click="remove(n)" :disabled="loading">
                    Usuń
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <p class="muted" v-else>Nie masz jeszcze żadnych ustawień.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import {
  listNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
} from '@/api/notification.js'
import { listMock, createMock, updateMock, deleteMock } from '@/mocks/notifications.js'

const auth = useAuthStore()
const userId = computed(() => auth.user?.id || 'u-1')

const TYPES = {
  INCOMING_EVENT: 'INCOMING_EVENT',
  TASK_APPROVED: 'TASK_APPROVED',
  OPINION_ISSUED: 'OPINION_ISSUED',
}

const items = ref([])
const loading = ref(false)
const error = ref('')
const ok = ref('')

const form = ref({ type: '', condition: '' })
const editId = ref('')

const days = ref(3) // dla INCOMING_EVENT
const boolTrue = ref(true)

function labelOf(type) {
  switch (type) {
    case TYPES.INCOMING_EVENT:
      return 'Nadchodzące wydarzenie'
    case TYPES.TASK_APPROVED:
      return 'Zatwierdzenie do zadania'
    case TYPES.OPINION_ISSUED:
      return 'Wystawienie opinii'
    default:
      return type || '—'
  }
}
function humanCondition(n) {
  if (n.type === TYPES.INCOMING_EVENT) {
    const m = /days=(\d+)/i.exec(n.condition || '')
    return m ? `gdy do eventu ≤ ${m[1]} dni` : n.condition || '—'
  }
  return n.condition === 'true' ? 'aktywne' : n.condition || '—'
}

function syncConditionFromDays() {
  const v = Number.isFinite(days.value) && days.value >= 0 ? Math.floor(days.value) : 0
  form.value.condition = `days=${v}`
}
function syncConditionFromBool() {
  form.value.condition = boolTrue.value ? 'true' : 'false'
}

const canSubmit = computed(() => {
  if (!form.value.type) return false
  if (form.value.type === TYPES.INCOMING_EVENT)
    return /^\s*days=\d+\s*$/i.test(form.value.condition || '')
  return form.value.condition === 'true'
})

// --- ładowanie listy (API -> fallback mock) ---
async function reload() {
  loading.value = true
  error.value = ''
  ok.value = ''
  try {
    const res = await listNotifications(userId.value)
    items.value = Array.isArray(res) ? res : res?.notifications || []
  } catch (e) {
    // fallback do mocków
    console.warn('Notifications: using mock, reason:', e?.message || e)
    items.value = listMock(userId.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  form.value.type = TYPES.INCOMING_EVENT
  syncConditionFromDays()
  reload()
})

async function onSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  ok.value = ''

  try {
    if (editId.value) {
      try {
        // real API
        const saved = await updateNotification(userId.value, editId.value, {
          type: form.value.type,
          condition: form.value.condition,
        })
        applyUpdateLocal(saved)
      } catch (e) {
        // mock
        const saved = updateMock({
          id: editId.value,
          patch: {
            type: form.value.type,
            condition: form.value.condition,
          },
        })
        applyUpdateLocal(saved)
      }
      ok.value = 'Zapisano zmiany.'
    } else {
      try {
        // real API
        const created = await createNotification(userId.value, {
          type: form.value.type,
          condition: form.value.condition,
        })
        items.value = [created, ...items.value]
      } catch (e) {
        // mock
        const created = createMock({
          userId: userId.value,
          type: form.value.type,
          condition: form.value.condition,
        })
        items.value = [created, ...items.value]
      }
      ok.value = 'Dodano powiadomienie.'
    }
    resetForm()
  } catch (e) {
    error.value = e?.message || 'Nie udało się zapisać.'
  } finally {
    loading.value = false
  }
}

function applyUpdateLocal(saved) {
  const i = items.value.findIndex((x) => x.id === saved.id)
  if (i !== -1) items.value[i] = saved
}

function startEdit(n) {
  editId.value = n.id
  form.value.type = n.type
  form.value.condition = n.condition || ''
  if (n.type === TYPES.INCOMING_EVENT) {
    const m = /days=(\d+)/i.exec(form.value.condition)
    days.value = m ? Number(m[1]) : 3
  } else {
    boolTrue.value = form.value.condition === 'true'
  }
}

function resetForm() {
  editId.value = ''
  form.value.type = TYPES.INCOMING_EVENT
  days.value = 3
  syncConditionFromDays()
  boolTrue.value = true
  ok.value = ''
  error.value = ''
}

async function remove(n) {
  if (!confirm('Usunąć to ustawienie?')) return
  loading.value = true
  error.value = ''
  ok.value = ''
  try {
    try {
      await deleteNotification(userId.value, n.id)
    } catch {
      deleteMock(n.id)
    }
    items.value = items.value.filter((x) => x.id !== n.id)
    if (editId.value === n.id) resetForm()
  } catch (e) {
    error.value = e?.message || 'Nie udało się usunąć.'
  } finally {
    loading.value = false
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

.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
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

.stack {
  display: grid;
  gap: 0.25rem;
}

.inline {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.w-120 {
  width: 120px;
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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
  }
  thead th {
    text-align: left;
    background: $surface-hover;
    border-top: 1px solid $border-color;
  }
  .num {
    text-align: right;
    white-space: nowrap;
    width: 180px;
  }
}
</style>