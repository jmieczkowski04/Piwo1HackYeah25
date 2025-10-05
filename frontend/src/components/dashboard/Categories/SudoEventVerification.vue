<template>
  <div class="sudo-events">
    <header class="head">
      <h2>Weryfikacja wydarzeń</h2>
      <p class="muted">
        Lista zgłoszeń oczekujących na akceptację. Możesz podejrzeć szczegóły, a następnie
        <strong>zaakceptować</strong> lub <strong>odrzucić</strong> wydarzenie.
      </p>
    </header>

    <section v-if="!auth.isGovAdmin" class="card">
      <p class="muted">Ta sekcja jest dostępna tylko dla roli: Admin rządowy.</p>
    </section>

    <section class="card" v-else>
      <div class="card__head">
        <h3>Oczekujące wydarzenia</h3>
        <div class="actions">
          <button class="btn" @click="reload" :disabled="loading">Odśwież</button>
        </div>
      </div>

      <div v-if="loading" class="muted">Ładowanie…</div>
      <div v-else-if="error" class="err">{{ error }}</div>
      <template v-else>
        <p v-if="items.length === 0" class="muted">Brak niezaakceptowanych wydarzeń.</p>

        <ul v-else class="list">
          <li v-for="ev in items" :key="ev.id" class="row">
            <div class="left">
              <div class="title">
                <strong>{{ ev.name || 'Bez nazwy' }}</strong>
                <span class="badge">UNCONFIRMED</span>
              </div>
              <div class="sub muted">
                ID: {{ ev.id }} • instytucja: {{ ev.institution_id || '—' }} •
                {{ d(ev.start_date) }} {{ t(ev.start_date) }} → {{ t(ev.end_date) }}
              </div>
            </div>

            <div class="right">
              <button class="btn" @click="toggle(ev.id)">
                {{ opened.has(ev.id) ? 'Zwiń' : 'Szczegóły' }}
              </button>
              <button class="btn btn--primary" :disabled="actingId === ev.id" @click="accept(ev)">
                {{ actingId === ev.id && actingType === 'accept' ? 'Zatwierdzanie…' : 'Akceptuj' }}
              </button>
              <button class="btn btn--danger" :disabled="actingId === ev.id" @click="reject(ev)">
                {{ actingId === ev.id && actingType === 'reject' ? 'Odrzucanie…' : 'Odrzuć' }}
              </button>
            </div>

            <div class="details" v-if="opened.has(ev.id)">
              <div class="details__grid">
                <div>
                  <div class="kv">
                    <span>Nazwa:</span><strong>{{ ev.name || '—' }}</strong>
                  </div>
                  <div class="kv">
                    <span>Opis:</span
                    ><strong>{{ ev.description?.trim() || '— brak opisu —' }}</strong>
                  </div>
                </div>
                <div>
                  <div class="kv">
                    <span>Instytucja:</span><strong>{{ ev.institution_id || '—' }}</strong>
                  </div>
                  <div class="kv">
                    <span>Daty:</span>
                    <strong>{{ d(ev.start_date) }} {{ t(ev.start_date) }}</strong>
                    <span class="muted"> → </span>
                    <strong>{{ d(ev.end_date) }} {{ t(ev.end_date) }}</strong>
                  </div>
                </div>
              </div>

              <div class="groups" v-if="ev.groups?.length">
                <div class="groups__head">Grupy ({{ ev.groups.length }})</div>
                <ul class="groups__list">
                  <li v-for="g in ev.groups" :key="g.id">
                    <strong>{{ g.name || g.id }}</strong>
                    <span v-if="g.tasks?.length" class="muted">
                      • zadania: {{ g.tasks.length }}</span
                    >
                  </li>
                </ul>
              </div>
              <div class="muted" v-else>Brak informacji o grupach.</div>
            </div>
          </li>
        </ul>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { listUnconfirmedEvents, confirmEvent, deleteEvent } from '@/api/event.js'

const auth = useAuthStore()

const items = ref([])
const loading = ref(false)
const error = ref('')
const opened = ref(new Set())

const actingId = ref('')
const actingType = ref('') // 'accept' | 'reject'

onMounted(reload)

async function reload() {
  loading.value = true
  error.value = ''
  try {
    const res = await listUnconfirmedEvents()
    // Backend może zwrócić tablicę lub obiekt { events: [...] }
    const arr = Array.isArray(res) ? res : res?.events
    if (!arr) throw new Error('Brak danych z serwera')
    items.value = arr
  } catch (e) {
    console.warn('GET /event/unconfirmed -> fallback mock:', e?.message || e)
    // Prosty fallback, żeby UI żył zanim powstanie backend
    items.value = [
      {
        id: 'evt-mock-1',
        name: 'Piknik Rodzinny',
        description: 'Strefa gier i animacji dla dzieci.',
        status: 'UNCONFIRMED',
        institution_id: 'inst-7',
        start_date: new Date(Date.now() + 3 * 3600e3).toISOString(),
        end_date: new Date(Date.now() + 6 * 3600e3).toISOString(),
        groups: [{ id: 'g-1', name: 'Animacje', tasks: [] }],
      },
      {
        id: 'evt-mock-2',
        name: 'Sadzenie drzew',
        description: 'Akcja w parku miejskim.',
        status: 'UNCONFIRMED',
        institution_id: 'inst-4',
        start_date: new Date(Date.now() + 86400e3).toISOString(),
        end_date: new Date(Date.now() + 86400e3 + 4 * 3600e3).toISOString(),
        groups: [],
      },
    ]
  } finally {
    loading.value = false
  }
}

function d(iso) {
  if (!iso) return '—'
  const x = new Date(iso)
  return x.toLocaleDateString()
}
function t(iso) {
  if (!iso) return '—'
  const x = new Date(iso)
  return x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function toggle(id) {
  const s = new Set(opened.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  opened.value = s
}

async function accept(ev) {
  if (!confirm(`Zatwierdzić wydarzenie „${ev.name || ev.id}”?`)) return
  actingId.value = ev.id
  actingType.value = 'accept'
  try {
    try {
      await confirmEvent(ev.id)
    } catch (e) {
      console.warn('POST /event/:id/confirm failed, removing locally. Reason:', e?.message || e)
      // fallback — traktujemy jak zaakceptowane i usuwamy z listy
    }
    items.value = items.value.filter((x) => x.id !== ev.id)
    opened.value.delete(ev.id)
  } catch (e) {
    alert(e?.message || 'Nie udało się zatwierdzić.')
  } finally {
    actingId.value = ''
    actingType.value = ''
  }
}

async function reject(ev) {
  if (
    !confirm(
      `Odrzucić wydarzenie „${ev.name || ev.id}”? Operacja jest nieodwracalna (usunie zgłoszenie).`,
    )
  )
    return
  actingId.value = ev.id
  actingType.value = 'reject'
  try {
    try {
      await deleteEvent(ev.id)
    } catch (e) {
      console.warn('DELETE /event/:id failed, removing locally. Reason:', e?.message || e)
      // fallback — usuwamy lokalnie
    }
    items.value = items.value.filter((x) => x.id !== ev.id)
    opened.value.delete(ev.id)
  } catch (e) {
    alert(e?.message || 'Nie udało się odrzucić.')
  } finally {
    actingId.value = ''
    actingType.value = ''
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

.actions {
  display: inline-flex;
  gap: 0.5rem;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.row {
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
  align-items: center;
  gap: 0.5rem;
  strong {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.sub {
  font-size: 0.92rem;
}

.right {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
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

.details {
  grid-column: 1 / -1;
  margin-top: 0.5rem;
  border-top: 1px dashed $border-color;
  padding-top: 0.5rem;
}
.details__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.kv {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.4rem;
  align-items: baseline;
  margin: 0.15rem 0;

  span {
    color: $muted-color;
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.groups {
  margin-top: 0.5rem;
}
.groups__head {
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.groups__list {
  margin: 0.25rem 0 0 1rem;
  padding: 0;
  list-style: disc;
  color: $muted-color;
}

.err {
  color: $red-color;
}
</style>
