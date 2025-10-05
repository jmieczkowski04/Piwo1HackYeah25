<template>
  <div class="dash">
    <header class="dash__head">
      <h2>Panel główny</h2>
      <p class="muted">Szybki podgląd najważniejszych rzeczy na dziś.</p>
    </header>

    <div class="grid">
      <!-- 1) Nadchodzące dyżury / zadania -->
      <section class="card">
        <div class="card__head">
          <h3>Nadchodzące dyżury</h3>
          <RouterLink class="btn" to="/dashboard/calendar">Kalendarz</RouterLink>
        </div>

        <template v-if="upcomingShifts.length">
          <ul class="list">
            <li v-for="it in upcomingShifts.slice(0, 6)" :key="it.key" class="row">
              <div class="left">
                <strong class="title">{{ it.eventName }}</strong>
                <div class="sub muted">{{ it.groupName }} • {{ it.taskName }}</div>
              </div>
              <div class="right">
                <span class="chip">
                  {{ dDate(it.start) }} • {{ dTime(it.start) }}–{{ dTime(it.end) }}
                </span>
              </div>
            </li>
          </ul>
        </template>
        <p v-else class="muted">Brak nadchodzących dyżurów.</p>
      </section>

      <!-- 2) Do potwierdzenia: wydarzenia (ORG_ADMIN/GOV_ADMIN) -->
      <section class="card" v-if="auth.isOrgAdmin || auth.isGovAdmin">
        <div class="card__head">
          <h3>Wydarzenia do potwierdzenia</h3>
          <RouterLink class="btn" to="/dashboard/event-verification">Weryfikuj</RouterLink>
        </div>

        <template v-if="unconfirmedEvents.length">
          <ul class="list">
            <li v-for="e in unconfirmedEvents.slice(0, 5)" :key="e.id" class="row">
              <div class="left">
                <strong class="title">{{ e.name }}</strong>
                <div class="sub muted">ID: {{ e.id }}</div>
              </div>
              <div class="right"><span class="badge">UNCONFIRMED</span></div>
            </li>
          </ul>
        </template>
        <p v-else class="muted">Brak oczekujących wydarzeń.</p>
      </section>

      <!-- 3) Do weryfikacji: organizacje (GOV_ADMIN) -->
      <section class="card" v-if="auth.isGovAdmin">
        <div class="card__head">
          <h3>Organizacje do weryfikacji</h3>
          <RouterLink class="btn" to="/dashboard/institution-verification">Weryfikuj</RouterLink>
        </div>

        <template v-if="unconfirmedInstitutions.length">
          <ul class="list">
            <li v-for="inst in unconfirmedInstitutions.slice(0, 5)" :key="inst.id" class="row">
              <div class="left">
                <strong class="title">{{ inst.name }}</strong>
                <div class="sub muted">ID: {{ inst.id }}</div>
              </div>
              <div class="right"><span class="badge">PENDING</span></div>
            </li>
          </ul>
        </template>
        <p v-else class="muted">Brak oczekujących organizacji.</p>
      </section>

      <!-- 4) Ostatnie rozmowy (chat) -->
      <section class="card">
        <div class="card__head">
          <h3>Ostatnie rozmowy</h3>
          <RouterLink class="btn" to="/dashboard/contact">Otwórz czat</RouterLink>
        </div>

        <template v-if="chatPreviews.length">
          <ul class="list">
            <li v-for="c in chatPreviews" :key="c.chat_id" class="row">
              <div class="left">
                <strong class="title">{{ c.eventName }}</strong>
                <div class="sub muted truncate">
                  {{ c.last?.senderLabel }}: {{ c.last?.text || '—' }}
                </div>
              </div>
              <div class="right">
                <span class="chip" v-if="c.last"
                  >{{ dDate(c.last.ts) }} • {{ dTime(c.last.ts) }}</span
                >
              </div>
            </li>
          </ul>
        </template>
        <p v-else class="muted">Brak rozmów do podglądu.</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { listEventsForUser } from '@/api/user.js'
import { listUnconfirmedEvents } from '@/api/event.js'
import { listUnconfirmedInstitutions } from '@/api/institution.js'
import { getChat } from '@/api/chat.js'
import { mockEventsForUser } from '@/mocks/events.js'
import { getChatMock } from '@/mocks/chat.js'

const auth = useAuthStore()

const eventsRaw = ref([])
const unconfirmedEvents = ref([])
const unconfirmedInstitutions = ref([])
const chatPreviews = ref([])

onMounted(async () => {
  await loadEvents()
  await Promise.allSettled([loadUnconfirmedEvents(), loadUnconfirmedInstitutions()])
  await loadChatPreviews()
})

async function loadEvents() {
  try {
    const uid = auth.user?.id || 'me'
    const data = await listEventsForUser(uid)
    eventsRaw.value = Array.isArray(data) ? data : data?.events || []
  } catch (e) {
    console.warn('events fallback -> mock:', e?.message || e)
    eventsRaw.value = mockEventsForUser()
  }
}

async function loadUnconfirmedEvents() {
  if (!(auth.isOrgAdmin || auth.isGovAdmin)) {
    unconfirmedEvents.value = []
    return
  }
  try {
    const data = await listUnconfirmedEvents()
    unconfirmedEvents.value = Array.isArray(data) ? data : data?.events || []
  } catch {
    unconfirmedEvents.value = []
  }
}

async function loadUnconfirmedInstitutions() {
  if (!auth.isGovAdmin) {
    unconfirmedInstitutions.value = []
    return
  }
  try {
    const data = await listUnconfirmedInstitutions()
    unconfirmedInstitutions.value = Array.isArray(data) ? data : data?.institutions || []
  } catch {
    unconfirmedInstitutions.value = []
  }
}

async function loadChatPreviews() {
  const uid = auth.user?.id || 'u-1'
  const top = (eventsRaw.value || [])
    .slice()
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
    .slice(0, 3)

  const calls = top.map(async (ev) => {
    try {
      const doc = await getChat(ev.id, uid)
      return toPreview(ev, doc)
    } catch (e) {
      // fallback do mocka – zgodny format
      const doc = getChatMock(ev.id, uid)
      return toPreview(ev, doc)
    }
  })

  const settled = await Promise.allSettled(calls)
  chatPreviews.value = settled
    .filter((s) => s.status === 'fulfilled')
    .map((s) => s.value)
    .sort((a, b) => new Date(b.last?.ts || 0) - new Date(a.last?.ts || 0))
}

function toPreview(event, chatDoc) {
  const last = (chatDoc?.messages || [])
    .slice()
    .sort((a, b) => new Date(a.ts) - new Date(b.ts))
    .pop()
  const participants = Object.fromEntries((chatDoc?.participants || []).map((p) => [p.user_id, p]))
  const sender = last ? participants[last.sender_id] : null
  return {
    chat_id: chatDoc?.chat_id || `${event.id}:${auth.user?.id || 'u-1'}`,
    eventId: event.id,
    eventName: event.name,
    last: last
      ? {
          ...last,
          senderLabel:
            last.sender_id === (auth.user?.id || 'u-1')
              ? 'Ty'
              : sender?.display_name || last.sender_id,
        }
      : null,
  }
}

const upcomingShifts = computed(() => {
  const now = Date.now()
  const me = auth.user?.id || 'u-1'

  // W mockach: użytkownik jest na niektórych taskach
  const items = []
  for (const ev of eventsRaw.value || []) {
    for (const g of ev.groups || []) {
      for (const t of g.tasks || []) {
        const start = new Date(t.start_date).getTime()
        const end = new Date(t.end_date).getTime()
        const imOnIt = (t.users || []).some((u) => u.id === me)
        if (imOnIt && end > now) {
          items.push({
            key: `${ev.id}|${g.id}|${t.id}`,
            eventName: ev.name,
            groupName: g.name,
            taskName: t.name,
            start: t.start_date,
            end: t.end_date,
          })
        }
      }
    }
  }
  return items.sort((a, b) => new Date(a.start) - new Date(b.start))
})

function dDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString()
}
function dTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped lang="scss">
.dash__head {
  margin-bottom: 0.75rem;
  .muted {
    color: $muted-color;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;

  & > .card:nth-child(1) {
    grid-column: span 7;
  }
  & > .card:nth-child(2) {
    grid-column: span 5;
  }
  & > .card:nth-child(3) {
    grid-column: span 5;
  }
  & > .card:nth-child(4) {
    grid-column: span 7;
  }

  @media (max-width: 1024px) {
    & > .card {
      grid-column: span 12;
    }
  }
}

.card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  h3 {
    margin: 0;
  }
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  padding: 0.55rem 0.6rem;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  background: $surface;
  & + .row {
    margin-top: 0.5rem;
  }
}

.left {
  min-width: 0;
}
.title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sub {
  font-size: 0.92rem;
}
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: $radius-sm;
  background: $surface-hover;
  border: 1px solid $border-color;
  font-size: 0.9rem;
  color: $muted-color;
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
</style>
