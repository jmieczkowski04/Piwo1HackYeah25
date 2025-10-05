<template>
  <div class="alerts">
    <header class="head">
      <h2>Ustawienia alertów (per wydarzenie)</h2>
      <p class="muted">
        Alert jest przypięty do <strong>Twojego konta</strong> i konkretnego
        <strong>wydarzenia</strong>. Różne eventy mogą mieć różne progi/parametry.
      </p>
    </header>

    <section class="card">
      <div class="row">
        <label class="lbl">Wydarzenie</label>
        <select class="select" v-model="selectedEventId" @change="reload">
          <option disabled value="">— wybierz wydarzenie —</option>
          <option v-for="e in eventOptions" :key="e.id" :value="e.id">{{ e.name }}</option>
        </select>
      </div>
    </section>

    <section class="card">
      <div class="card__head">
        <h3>{{ editId ? 'Edytuj alert' : 'Dodaj alert' }}</h3>
        <span v-if="loading" class="muted">Zapisywanie…</span>
      </div>

      <div class="form">
        <div class="row">
          <label class="lbl">Rodzaj alertu</label>
          <select class="select" v-model="form.type" :disabled="!!editId">
            <option disabled value="">— wybierz —</option>
            <option :value="TYPES.VOL_COUNT_OVER">Ponad N zgłoszeń (event/grupa)</option>
            <option :value="TYPES.LOW_RATING_APPLIED">
              Zgłosił się wolontariusz z oceną &lt; X
            </option>
            <option :value="TYPES.UNDERSTAFFED_TASK">Zadanie ma &lt; M osób (event/grupa)</option>
          </select>
        </div>

        <div class="row" v-if="form.type === TYPES.VOL_COUNT_OVER">
          <label class="lbl">Warunek</label>
          <div class="stack">
            <div class="inline">
              <span>Łącznie zgłoszeń &gt; </span>
              <input
                class="input w-120"
                type="number"
                min="1"
                step="1"
                v-model.number="n"
                @input="syncVOL"
              />
            </div>
            <div class="inline">
              <label class="check">
                <input type="checkbox" v-model="useGroup" @change="syncVOL" />
                Zawęź do grupy
              </label>
              <select class="select" v-model="groupId" :disabled="!useGroup" @change="syncVOL">
                <option :value="''">— wybierz grupę —</option>
                <option v-for="g in groupsForEvent" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
            <small class="muted">Alert, gdy przekroczony zostanie próg zgłoszeń.</small>
          </div>
        </div>

        <div class="row" v-else-if="form.type === TYPES.LOW_RATING_APPLIED">
          <label class="lbl">Warunek</label>
          <div class="stack">
            <div class="inline">
              <span>Średnia ocena &lt;</span>
              <input
                class="input w-120"
                type="number"
                min="1"
                max="5"
                step="0.1"
                v-model.number="ratingLt"
                @input="syncRATING"
              />
            </div>
            <small class="muted"
              >Gdy zgłoszenie z oceną poniżej progu trafi do tego wydarzenia.</small
            >
          </div>
        </div>

        <div class="row" v-else-if="form.type === TYPES.UNDERSTAFFED_TASK">
          <label class="lbl">Warunek</label>
          <div class="stack">
            <div class="inline">
              <span>Mniej niż</span>
              <input
                class="input w-120"
                type="number"
                min="1"
                step="1"
                v-model.number="minStaff"
                @input="syncUNDER"
              />
              <span>osób na zadaniu</span>
            </div>
            <div class="inline">
              <label class="check">
                <input type="checkbox" v-model="useGroup" @change="syncUNDER" />
                Zawęź do grupy
              </label>
              <select class="select" v-model="groupId" :disabled="!useGroup" @change="syncUNDER">
                <option :value="''">— wybierz grupę —</option>
                <option v-for="g in groupsForEvent" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
            <small class="muted">Powiadom, jeśli jakieś zadanie jest niedoobsadzone.</small>
          </div>
        </div>

        <div class="row" v-else>
          <label class="lbl">Warunek</label>
          <span class="muted">Najpierw wybierz rodzaj alertu.</span>
        </div>

        <div class="actions">
          <button
            class="btn btn--primary"
            :disabled="!canSubmit || !selectedEventId || loading"
            @click="onSubmit"
          >
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
        <h3>Alerty dla wydarzenia</h3>
        <button class="btn" @click="reload" :disabled="loading || !selectedEventId">Odśwież</button>
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
              <tr v-for="a in items" :key="a.id">
                <td>{{ labelOf(a.type) }}</td>
                <td>{{ humanCondition(a) }}</td>
                <td class="num">
                  <button class="btn" @click="startEdit(a)">Edytuj</button>
                  <button class="btn btn--danger" @click="remove(a)" :disabled="loading">
                    Usuń
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <p class="muted" v-else>Brak alertów dla tego wydarzenia.</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { listEventsForUser } from '@/api/user.js'
import { listAlerts, createAlert, updateAlert, deleteAlert } from '@/api/alert.js'
import { mockEventsForUser } from '@/mocks/events.js'
import { listMock, createMock, updateMock, deleteMock } from '@/mocks/alerts.js'

const auth = useAuthStore()
const userId = computed(() => auth.user?.id || 'u-1')

const TYPES = {
  VOL_COUNT_OVER: 'VOL_COUNT_OVER',
  LOW_RATING_APPLIED: 'LOW_RATING_APPLIED',
  UNDERSTAFFED_TASK: 'UNDERSTAFFED_TASK',
}

const eventOptions = ref([])
const selectedEventId = ref('')
const items = ref([])
const loading = ref(false)
const error = ref('')
const ok = ref('')

const form = ref({ type: '', condition: '' })
const editId = ref('')

const n = ref(10)
const useGroup = ref(false)
const groupId = ref('')
const ratingLt = ref(3.5)
const minStaff = ref(2)

// Grupy (pobierane z eventu – w mocku z obiektu eventu)
const groupsForEvent = computed(() => {
  const ev = eventOptions.value.find((e) => e.id === selectedEventId.value)
  if (!ev) return []
  return (ev.groups || []).map((g) => ({ id: g.id, name: g.name }))
})

function labelOf(type) {
  switch (type) {
    case TYPES.VOL_COUNT_OVER:
      return 'Ponad N zgłoszeń'
    case TYPES.LOW_RATING_APPLIED:
      return 'Zgłoszenie z oceną < X'
    case TYPES.UNDERSTAFFED_TASK:
      return 'Zadanie ma < M osób'
    default:
      return type || '—'
  }
}

function humanCondition(a) {
  const cond = a.condition || ''
  if (a.type === TYPES.VOL_COUNT_OVER) {
    const mN = /(?:^|;)n=(\d+)/i.exec(cond)
    const mG = /(?:^|;)group_id=([^;]+)/i.exec(cond)
    const nVal = mN ? mN[1] : '?'
    const scope = mG ? `grupa ${mG[1]}` : 'cały event'
    return `zgłoszeń > ${nVal} (${scope})`
  }
  if (a.type === TYPES.LOW_RATING_APPLIED) {
    const m = /(?:^|;)rating_lt=([\d.]+)/i.exec(cond)
    return m ? `średnia < ${m[1]}` : cond
  }
  if (a.type === TYPES.UNDERSTAFFED_TASK) {
    const mMin = /(?:^|;)min=(\d+)/i.exec(cond)
    const mG = /(?:^|;)group_id=([^;]+)/i.exec(cond)
    const scope = mG ? `w grupie ${mG[1]}` : 'w całym evencie'
    return mMin ? `zadanie z obsadą < ${mMin[1]} (${scope})` : cond
  }
  return cond
}

function syncVOL() {
  const parts = [`n=${Math.max(1, Math.floor(n.value || 1))}`]
  if (useGroup.value && groupId.value) parts.push(`group_id=${groupId.value}`)
  form.value.condition = parts.join(';')
}
function syncRATING() {
  const val = Math.max(1, Math.min(5, Number(ratingLt.value || 1)))
  form.value.condition = `rating_lt=${val.toFixed(1)}`
}
function syncUNDER() {
  const parts = [`min=${Math.max(1, Math.floor(minStaff.value || 1))}`]
  if (useGroup.value && groupId.value) parts.push(`group_id=${groupId.value}`)
  form.value.condition = parts.join(';')
}

const canSubmit = computed(() => {
  if (!selectedEventId.value || !form.value.type) return false
  if (form.value.type === TYPES.VOL_COUNT_OVER)
    return /^n=\d+(;group_id=[^;]+)?$/i.test(form.value.condition)
  if (form.value.type === TYPES.LOW_RATING_APPLIED)
    return /^rating_lt=\d+(\.\d+)?$/i.test(form.value.condition)
  if (form.value.type === TYPES.UNDERSTAFFED_TASK)
    return /^min=\d+(;group_id=[^;]+)?$/i.test(form.value.condition)
  return false
})

onMounted(async () => {
  try {
    const resp = await listEventsForUser(userId.value)
    const events = Array.isArray(resp) ? resp : resp?.events
    if (!events) throw new Error('no events')
    eventOptions.value = events
  } catch {
    eventOptions.value = mockEventsForUser()
  }
  selectedEventId.value = eventOptions.value[0]?.id || ''
  resetForm()
  await reload()
})

watch(selectedEventId, () => {
  resetForm()
})

function resetForm() {
  editId.value = ''
  form.value.type = TYPES.VOL_COUNT_OVER
  n.value = 10
  useGroup.value = false
  groupId.value = ''
  ratingLt.value = 3.5
  minStaff.value = 2
  syncVOL()
  ok.value = ''
  error.value = ''
}

// lista alertów (API -> fallback mock)
async function reload() {
  if (!selectedEventId.value) {
    items.value = []
    return
  }
  loading.value = true
  error.value = ''
  ok.value = ''
  try {
    const res = await listAlerts(selectedEventId.value)
    const list = (Array.isArray(res) ? res : res?.alerts || []).filter(
      (a) => a.user_id === userId.value,
    )
    items.value = list
  } catch (e) {
    console.warn('Alerts: using mock, reason:', e?.message || e)
    items.value = listMock({ eventId: selectedEventId.value, userId: userId.value })
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  ok.value = ''
  const payload = {
    user_id: userId.value,
    event_id: selectedEventId.value,
    type: form.value.type,
    condition: form.value.condition,
  }

  try {
    if (editId.value) {
      try {
        const saved = await updateAlert(selectedEventId.value, editId.value, payload)
        applyUpdateLocal(saved)
      } catch {
        const saved = updateMock({ id: editId.value, patch: payload })
        applyUpdateLocal(saved)
      }
      ok.value = 'Zapisano zmiany.'
    } else {
      try {
        const created = await createAlert(selectedEventId.value, payload)
        items.value = [created, ...items.value]
      } catch {
        const created = createMock({
          eventId: selectedEventId.value,
          userId: userId.value,
          type: payload.type,
          condition: payload.condition,
        })
        items.value = [created, ...items.value]
      }
      ok.value = 'Dodano alert.'
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

function startEdit(a) {
  editId.value = a.id
  form.value.type = a.type
  form.value.condition = a.condition || ''
  if (a.type === TYPES.VOL_COUNT_OVER) {
    const mN = /n=(\d+)/i.exec(a.condition || '')
    const mG = /group_id=([^;]+)/i.exec(a.condition || '')
    n.value = mN ? Number(mN[1]) : 10
    useGroup.value = !!mG
    groupId.value = mG ? mG[1] : ''
    syncVOL()
  } else if (a.type === TYPES.LOW_RATING_APPLIED) {
    const m = /rating_lt=([\d.]+)/i.exec(a.condition || '')
    ratingLt.value = m ? Number(m[1]) : 3.5
    syncRATING()
  } else if (a.type === TYPES.UNDERSTAFFED_TASK) {
    const mMin = /min=(\d+)/i.exec(a.condition || '')
    const mG = /group_id=([^;]+)/i.exec(a.condition || '')
    minStaff.value = mMin ? Number(mMin[1]) : 2
    useGroup.value = !!mG
    groupId.value = mG ? mG[1] : ''
    syncUNDER()
  }
}

async function remove(a) {
  if (!confirm('Usunąć ten alert?')) return
  loading.value = true
  error.value = ''
  ok.value = ''
  try {
    try {
      await deleteAlert(selectedEventId.value, a.id)
    } catch {
      deleteMock(a.id)
    }
    items.value = items.value.filter((x) => x.id !== a.id)
    if (editId.value === a.id) resetForm()
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

.form .row,
.card .row {
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
.check {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}
.w-120 {
  width: 120px;
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
