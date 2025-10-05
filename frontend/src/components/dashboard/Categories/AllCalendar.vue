<template>
  <div class="calendar">
    <header class="calendar__head">
      <h2>Kalendarz wydarzeń</h2>
      <p class="muted">
        Widok zależy od roli.
        {{ canManage ? 'Masz uprawnienia do zarządzania zadaniami.' : 'Podgląd tylko do odczytu.' }}
      </p>
    </header>

    <div class="filters">
      <button
        class="btn"
        :class="{ 'btn--primary': activeTab === 'upcoming' }"
        @click="activeTab = 'upcoming'"
      >
        Nadchodzące
      </button>
      <button
        class="btn"
        :class="{ 'btn--primary': activeTab === 'past' }"
        @click="activeTab = 'past'"
      >
        Zakończone
      </button>
    </div>

    <div v-if="filtered.length === 0" class="empty card">Brak wydarzeń do wyświetlenia.</div>

    <section v-for="ev in filtered" :key="ev.id" class="event card">
      <div class="event__header">
        <div>
          <h3 class="event__title">{{ ev.name }}</h3>
          <p class="muted">{{ ev.description }}</p>
          <p class="muted">
            {{ formatDate(ev.start_date) }} — {{ formatTime(ev.start_date) }} →
            {{ formatTime(ev.end_date) }}
          </p>
        </div>
        <span class="badge" :class="badgeClass(ev.status)">{{ ev.status }}</span>
      </div>

      <div class="event__groups">
        <div v-for="grp in ev.groups" :key="grp.id" class="group">
          <h4 class="group__title">{{ grp.name }}</h4>

          <div class="tasks">
            <div v-for="t in grp.tasks" :key="t.id" class="task">
              <div class="task__main">
                <div class="task__title">
                  <strong>{{ t.name }}</strong>
                  <span class="muted">
                    {{ formatTime(t.start_date) }}–{{ formatTime(t.end_date) }}
                  </span>
                </div>
                <div class="task__users">
                  <span class="chip">
                    Wolontariusze: <strong>{{ t.users?.length || 0 }}</strong>
                  </span>
                </div>
              </div>

              <div class="task__actions">
                <template v-if="canManage">
                  <button class="btn" @click="onAddUser(ev, grp, t)">Dodaj wolontariusza</button>
                  <button class="btn btn--danger" @click="onRemoveUser(ev, grp, t)">
                    Usuń z zadania
                  </button>
                </template>
                <template v-else>
                  <span class="muted">Tylko podgląd</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useAuthStore, ROLE } from '@/stores/auth.js'
import { listEventsForUser } from '@/api/user.js'
import { mockEventsForUser } from '@/mocks/events.js'

const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const events = ref([])
const activeTab = ref('upcoming') // 'upcoming' | 'past'

const canManage = computed(
  () => auth.currentRole === ROLE.ORG_ADMIN || auth.currentRole === ROLE.GOV_ADMIN,
)

onMounted(fetchEvents)

async function fetchEvents() {
  loading.value = true
  error.value = ''
  try {
    const uid = auth.user?.id || 'me'
    const data = await listEventsForUser(uid)
    events.value = Array.isArray(data) ? data : data?.events || []
  } catch (e) {
    // Fallback na mocki
    console.warn('GET /events/all/users/:id fallback -> mock:', e?.message || e)
    events.value = mockEventsForUser()
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const now = Date.now()
  const arr = (events.value || [])
    .slice()
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
  if (activeTab.value === 'upcoming') {
    return arr.filter((e) => new Date(e.end_date).getTime() >= now)
  }
  return arr.filter((e) => new Date(e.end_date).getTime() < now).reverse()
})

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString()
}
function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function badgeClass(status) {
  return status === 'CONFIRMED' ? 'badge--ok' : status === 'FINISHED' ? 'badge--muted' : ''
}

// Placeholdery akcji (API będzie to robić potem)
// ORG_ADMIN + GOV_ADMIN tylko widzą te przyciski
function onAddUser(ev, grp, t) {
  alert(`(mock) Dodaj wolontariusza → ${ev.name} / ${grp.name} / ${t.name}`)
}
function onRemoveUser(ev, grp, t) {
  alert(`(mock) Usuń wolontariusza → ${ev.name} / ${grp.name} / ${t.name}`)
}
</script>

<style scoped lang="scss">
.calendar__head {
  margin-bottom: 0.5rem;

  .muted {
    color: $muted-color;
  }
}

.filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.event {
  margin-bottom: 1rem;
}

.event__header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  .event__title {
    margin: 0 0 0.2rem 0;
  }
  .muted {
    color: $muted-color;
    margin: 0.1rem 0;
  }
}

.event__groups {
  display: grid;
  gap: 0.75rem;
}

.group {
  border: 1px dashed $border-color;
  border-radius: $radius-md;
  padding: 0.75rem;

  .group__title {
    margin: 0 0 0.5rem 0;
  }
}

.tasks {
  display: grid;
  gap: 0.5rem;
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

  .task__users .chip {
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

  .task__actions {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }
}

/* Badges */
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
</style>
