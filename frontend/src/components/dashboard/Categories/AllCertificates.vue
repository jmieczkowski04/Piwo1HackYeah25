<template>
  <div class="certs">
    <header class="certs__head">
      <h2>Generowanie certyfikatów</h2>
      <p class="muted">
        {{ roleHint }}
      </p>
    </header>

    <div class="card grid-gap">
      <!-- Wybór użytkownika -->
      <div class="row">
        <label class="lbl">Użytkownik</label>
        <div class="stack">
          <select class="select" v-model="selectedUserId" :disabled="userLocked">
            <option v-for="u in usersOptions" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
          <small class="muted" v-if="userLocked"
            >Jako wolontariusz generujesz tylko dla siebie.</small
          >
        </div>
      </div>

      <!-- Wybór wydarzenia (zależny od użytkownika; tylko zakończone z udziałem) -->
      <div class="row">
        <label class="lbl">Wydarzenie</label>
        <div class="stack">
          <select class="select" v-model="selectedEventId">
            <option v-if="eligibleEvents.length === 0" disabled value="">
              Brak zakończonych wydarzeń dla wybranego użytkownika
            </option>
            <option v-for="e in eligibleEvents" :key="e.id" :value="e.id">
              {{ e.name }} — {{ formatDate(e.end_date) }}
            </option>
          </select>
          <small class="muted"
            >Certyfikat dostępny tylko dla zakończonych wydarzeń, w których użytkownik brał
            udział.</small
          >
        </div>
      </div>

      <!-- Akcja -->
      <div class="row">
        <button class="btn btn--primary" :disabled="!canGenerate" @click="generate">
          Generuj certyfikat (PDF)
        </button>
        <span v-if="loading" class="muted">Generuję…</span>
      </div>
    </div>

    <!-- Podgląd -->
    <section class="history">
      <h3>Wydarzenia kwalifikujące się do certyfikatu</h3>
      <div class="list" v-if="eligibleEvents.length">
        <div class="item" v-for="e in eligibleEvents" :key="e.id">
          <div class="meta">
            <strong>{{ e.name }}</strong>
            <span class="muted">Zakończone: {{ formatDate(e.end_date) }}</span>
          </div>
          <button class="btn" @click="quickPick(e.id)">Wybierz</button>
        </div>
      </div>
      <p v-else class="muted">Brak pozycji.</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore, ROLE } from '@/stores/auth.js'
import { getCertificateFile } from '@/api/certificate.js'
import {
  mockUsers,
  mockEvents,
  mockEligibleEventsForUser,
  mockCoordinatorVolunteers,
  mockOrganizerVolunteers,
  mockAllVolunteers,
  mockCertificateBlob,
} from '@/mocks/certificates.js'

const auth = useAuthStore()

const usersOptions = ref([])
const selectedUserId = ref('')
const selectedEventId = ref('')
const loading = ref(false)

// mock
const events = ref(mockEvents)

const role = computed(() => auth.currentRole)
const userLocked = computed(() => role.value === ROLE.VOLUNTEER)

const roleHint = computed(() => {
  if (role.value === ROLE.VOLUNTEER)
    return 'Wolontariusz: możesz generować certyfikaty tylko dla siebie.'
  if (role.value === ROLE.COORDINATOR)
    return 'Koordynator: możesz generować certyfikaty dla wolontariuszy, których zgłaszałeś.'
  if (role.value === ROLE.ORG_ADMIN)
    return 'Organizator: możesz generować certyfikaty dla wolontariuszy ze swoich wydarzeń.'
  if (role.value === ROLE.GOV_ADMIN)
    return 'Admin: możesz generować certyfikaty dla każdego wolontariusza.'
  return ''
})

function buildUsersOptions() {
  const me = auth.user?.id || 'u-1'
  if (role.value === ROLE.VOLUNTEER) {
    const self = mockUsers.find((u) => u.id === me) || { id: me, name: 'Ja' }
    usersOptions.value = [self]
    selectedUserId.value = self.id
  } else if (role.value === ROLE.COORDINATOR) {
    usersOptions.value = mockCoordinatorVolunteers(auth.user?.id).map((u) => ({
      id: u.id,
      name: u.name,
    }))
    selectedUserId.value ||= usersOptions.value[0]?.id || ''
  } else if (role.value === ROLE.ORG_ADMIN) {
    usersOptions.value = mockOrganizerVolunteers(auth.user?.id).map((u) => ({
      id: u.id,
      name: u.name,
    }))
    selectedUserId.value ||= usersOptions.value[0]?.id || ''
  } else if (role.value === ROLE.GOV_ADMIN) {
    usersOptions.value = mockAllVolunteers().map((u) => ({ id: u.id, name: u.name }))
    selectedUserId.value ||= usersOptions.value[0]?.id || ''
  } else {
    // fallback
    usersOptions.value = mockUsers
    selectedUserId.value ||= usersOptions.value[0]?.id || ''
  }
}

onMounted(() => {
  buildUsersOptions()
})

// jeśli zmieni się rola / user – przebuduj listę
watch(() => role.value, buildUsersOptions)
watch(() => auth.user?.id, buildUsersOptions)

const eligibleEvents = computed(() => {
  return selectedUserId.value ? mockEligibleEventsForUser(selectedUserId.value) : []
})

watch(eligibleEvents, (list) => {
  if (!list.find((e) => e.id === selectedEventId.value)) {
    selectedEventId.value = list[0]?.id || ''
  }
})

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString()
}

function quickPick(eventId) {
  selectedEventId.value = eventId
}

const canGenerate = computed(() => !!selectedUserId.value && !!selectedEventId.value)

async function generate() {
  if (!canGenerate.value) return
  loading.value = true
  try {
    const ev = eligibleEvents.value.find((e) => e.id === selectedEventId.value)
    const usr = usersOptions.value.find((u) => u.id === selectedUserId.value)

    try {
      const blob = await getCertificateFile(ev.id, usr.id)
      triggerDownload(blob, fileName(ev, usr))
    } catch (realErr) {
      console.warn('getCertificateFile failed, using mock:', realErr?.message || realErr)
      // Fallback – lokalny „PDF”
      const blob = mockCertificateBlob({ event: ev, user: usr })
      triggerDownload(blob, fileName(ev, usr))
    }
  } finally {
    loading.value = false
  }
}

function fileName(ev, usr) {
  const safe = (s) =>
    String(s || '')
      .replace(/[^\p{L}\p{N}\-_ ]/gu, '')
      .replace(/\s+/g, '_')
  return `certyfikat_${safe(usr.name || usr.id)}_${safe(ev.name)}.pdf`
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
</script>

<style scoped lang="scss">
.certs__head {
  margin-bottom: 0.75rem;
  .muted {
    color: $muted-color;
  }
}

.row {
  display: grid;
  grid-template-columns: 160px 1fr;
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

.history {
  margin-top: 1rem;

  h3 {
    margin: 0 0 0.5rem 0;
  }

  .list {
    display: grid;
    gap: 0.5rem;
  }

  .item {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid $border-color;
    border-radius: $radius-md;
    background: $surface;

    .meta {
      display: grid;
      gap: 0.15rem;
      .muted {
        color: $muted-color;
      }
    }
  }
}
</style>
