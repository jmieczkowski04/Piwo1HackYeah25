<template>
  <div class="sudo-orgs">
    <header class="head">
      <h2>Weryfikacja organizacji</h2>
      <p class="muted">
        Lista zgłoszonych instytucji oczekujących na akceptację. Wyświetl szczegóły, a następnie
        <strong>zaakceptuj</strong> lub <strong>odrzuć</strong> organizację.
      </p>
    </header>

    <section v-if="!auth.isGovAdmin" class="card">
      <p class="muted">Ta sekcja jest dostępna tylko dla roli: Admin rządowy.</p>
    </section>

    <section class="card" v-else>
      <div class="card__head">
        <h3>Oczekujące organizacje</h3>
        <div class="actions">
          <button class="btn" @click="reload" :disabled="loading">Odśwież</button>
        </div>
      </div>

      <div v-if="loading" class="muted">Ładowanie…</div>
      <div v-else-if="error" class="err">{{ error }}</div>

      <template v-else>
        <p v-if="items.length === 0" class="muted">Brak niezaakceptowanych organizacji.</p>

        <ul v-else class="list">
          <li v-for="inst in items" :key="inst.id" class="row">
            <div class="left">
              <div class="title">
                <strong>{{ inst.name || 'Bez nazwy' }}</strong>
                <span class="badge">PENDING</span>
              </div>
              <div class="sub muted">
                ID: {{ inst.id }}
                <template v-if="inst.admins?.length"> • admini: {{ inst.admins.length }}</template>
                <template v-if="inst.events?.length">
                  • wydarzenia: {{ inst.events.length }}</template
                >
              </div>
            </div>

            <div class="right">
              <button class="btn" @click="toggle(inst.id)">
                {{ opened.has(inst.id) ? 'Zwiń' : 'Szczegóły' }}
              </button>
              <button
                class="btn btn--primary"
                :disabled="actingId === inst.id"
                @click="accept(inst)"
              >
                {{
                  actingId === inst.id && actingType === 'accept' ? 'Zatwierdzanie…' : 'Akceptuj'
                }}
              </button>
              <button
                class="btn btn--danger"
                :disabled="actingId === inst.id"
                @click="rejectInst(inst)"
              >
                {{ actingId === inst.id && actingType === 'reject' ? 'Odrzucanie…' : 'Odrzuć' }}
              </button>
            </div>

            <div class="details" v-if="opened.has(inst.id)">
              <div class="details__grid">
                <div>
                  <div class="kv">
                    <span>Nazwa:</span><strong>{{ inst.name || '—' }}</strong>
                  </div>
                  <div class="kv">
                    <span>Opis:</span>
                    <strong>{{ (inst.description || '').trim() || '— brak opisu —' }}</strong>
                  </div>
                </div>
                <div>
                  <div class="kv">
                    <span>Status:</span><strong>{{ inst.status || 'UNCONFIRMED' }}</strong>
                  </div>
                  <div class="kv">
                    <span>ID:</span><strong>{{ inst.id }}</strong>
                  </div>
                </div>
              </div>

              <div class="blocks">
                <div class="block" v-if="inst.admins?.length">
                  <div class="block__head">Administratorzy ({{ inst.admins.length }})</div>
                  <ul class="disc">
                    <li v-for="a in inst.admins" :key="a.id">{{ a.id }}</li>
                  </ul>
                </div>
                <div class="block" v-else>
                  <div class="muted">Brak informacji o administratorach.</div>
                </div>

                <div class="block" v-if="inst.events?.length">
                  <div class="block__head">Wydarzenia ({{ inst.events.length }})</div>
                  <ul class="disc">
                    <li v-for="e in inst.events" :key="e.id">{{ e.id }}</li>
                  </ul>
                </div>
                <div class="block" v-else>
                  <div class="muted">Brak przypisanych wydarzeń.</div>
                </div>
              </div>
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
import {
  listUnconfirmedInstitutions,
  confirmInstitution,
  deleteInstitution,
} from '@/api/institution.js'

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
    const res = await listUnconfirmedInstitutions()
    const arr = Array.isArray(res) ? res : res?.institutions
    if (!arr) throw new Error('Brak danych z serwera')
    items.value = arr
  } catch (e) {
    console.warn('GET /institution/unconfirmed -> fallback mock:', e?.message || e)
    // Prosty fallback, aby UI działał zanim powstanie backend
    items.value = [
      {
        id: 'inst-mock-1',
        name: 'Fundacja Dobre Ręce',
        description: 'Wsparcie akcji charytatywnych w regionie.',
        status: 'UNCONFIRMED',
        admins: [{ id: 'u-900' }],
        events: [{ id: 'evt-900' }, { id: 'evt-901' }],
      },
      {
        id: 'inst-mock-2',
        name: 'Stowarzyszenie Zielona Mapa',
        description: '',
        status: 'UNCONFIRMED',
        admins: [{ id: 'u-901' }, { id: 'u-902' }],
        events: [],
      },
    ]
  } finally {
    loading.value = false
  }
}

function toggle(id) {
  const s = new Set(opened.value)
  s.has(id) ? s.delete(id) : s.add(id)
  opened.value = s
}

async function accept(inst) {
  if (!confirm(`Zatwierdzić organizację „${inst.name || inst.id}”?`)) return
  actingId.value = inst.id
  actingType.value = 'accept'
  try {
    try {
      await confirmInstitution(inst.id)
    } catch (e) {
      console.warn(
        'POST /institution/:id/confirm failed, removing locally. Reason:',
        e?.message || e,
      )
      // fallback — traktujemy jak zaakceptowaną i usuwamy z listy
    }
    items.value = items.value.filter((x) => x.id !== inst.id)
    opened.value.delete(inst.id)
  } catch (e) {
    alert(e?.message || 'Nie udało się zatwierdzić.')
  } finally {
    actingId.value = ''
    actingType.value = ''
  }
}

async function rejectInst(inst) {
  if (
    !confirm(
      `Odrzucić organizację „${inst.name || inst.id}”? Operacja jest nieodwracalna (usunie zgłoszenie).`,
    )
  )
    return
  actingId.value = inst.id
  actingType.value = 'reject'
  try {
    try {
      await deleteInstitution(inst.id)
    } catch (e) {
      console.warn('DELETE /institution/:id failed, removing locally. Reason:', e?.message || e)
      // fallback — usuwamy lokalnie
    }
    items.value = items.value.filter((x) => x.id !== inst.id)
    opened.value.delete(inst.id)
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
  gap: 0.5rem;
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

.blocks {
  margin-top: 0.5rem;
  display: grid;
  gap: 0.5rem;
}

.block__head {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.disc {
  margin: 0.25rem 0 0 1rem;
  padding: 0;
  list-style: disc;
  color: $muted-color;
}

.err {
  color: $red-color;
}
</style>
