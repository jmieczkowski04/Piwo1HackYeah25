<template>
  <div class="new-vol">
    <header class="head">
      <h2>Zgłoszenie wolontariusza</h2>
      <p class="muted">Koordynator: dodaj dane kandydata i przypisz go od razu do grupy.</p>
    </header>

    <form class="card grid-gap" @submit.prevent="onSubmit">
      <div class="row">
        <label class="lbl" for="firstName">Imię</label>
        <input id="firstName" v-model.trim="form.firstName" class="input" required />
      </div>

      <div class="row">
        <label class="lbl" for="lastName">Nazwisko</label>
        <input id="lastName" v-model.trim="form.lastName" class="input" required />
      </div>

      <div class="row">
        <label class="lbl" for="pesel">PESEL</label>
        <input
          id="pesel"
          v-model.trim="form.pesel"
          class="input"
          maxlength="11"
          inputmode="numeric"
          placeholder="11 cyfr"
          required
        />
        <small class="muted" v-if="form.pesel && !isPeselValid">Nieprawidłowy PESEL.</small>
      </div>

      <div class="row">
        <label class="lbl" for="consent">Zgoda rodzica (skan)</label>
        <input id="consent" type="file" class="input" accept=".pdf,image/*" @change="onFile" />
        <small class="muted">PDF lub obraz (jpg/png). Opcjonalne, jeśli pełnoletni.</small>
        <div v-if="fileName" class="fileinfo">
          Wybrano: <strong>{{ fileName }}</strong>
        </div>
      </div>

      <div class="row">
        <label class="lbl" for="group">Przypisz do grupy</label>
        <select id="group" class="select" v-model="selectedGroupKey" required>
          <option disabled value="">— wybierz grupę —</option>
          <option v-for="g in groups" :key="keyOf(g)" :value="keyOf(g)">
            {{ g.eventName }} → {{ g.groupName }}
          </option>
        </select>
      </div>

      <div class="actions">
        <button class="btn btn--primary" :disabled="submitting || !canSubmit">
          {{ submitting ? 'Zgłaszanie…' : 'Zgłoś wolontariusza' }}
        </button>
        <span v-if="error" class="err">{{ error }}</span>
        <span v-if="ok" class="ok">Zgłoszono (mock). W podglądzie poniżej masz szczegóły.</span>
      </div>
    </form>

    <section class="preview card" v-if="lastPreview">
      <h3>Podsumowanie zgłoszenia (mock)</h3>
      <ul class="kv">
        <li>
          <span>Imię i nazwisko:</span><strong>{{ lastPreview.fullName }}</strong>
        </li>
        <li>
          <span>PESEL:</span><strong>{{ lastPreview.pesel }}</strong>
        </li>
        <li>
          <span>Grupa:</span>
          <strong>{{ lastPreview.group.groupName }}</strong>
          <small class="muted">({{ lastPreview.group.eventName }})</small>
        </li>
        <li>
          <span>Plik zgody:</span><strong>{{ lastPreview.fileName || '—' }}</strong>
        </li>
        <li>
          <span>Nadany ID (mock):</span><strong>{{ lastPreview.userId }}</strong>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { mockGroupsForCoordinator } from '@/mocks/groups.js'
// TODO: import { addUserToEventGroup } from '@/api/event.js'

const auth = useAuthStore()

const form = ref({
  firstName: '',
  lastName: '',
  pesel: '',
})
const file = ref(null)
const fileName = computed(() => file.value?.name || '')
function onFile(e) {
  const f = e.target.files?.[0]
  file.value = f || null
}

// --- grupy (mock) ---
const groups = ref([])
onMounted(() => {
  groups.value = mockGroupsForCoordinator(auth.user?.id)
})
const keyOf = (g) => `${g.eventId}|${g.groupId}`
const selectedGroupKey = ref('')

const isPeselValid = true

// --- submit ---
const submitting = ref(false)
const error = ref('')
const ok = ref(false)
const lastPreview = ref(null)

const canSubmit = computed(() => {
  return form.value.firstName.trim() && form.value.lastName.trim() && selectedGroupKey.value
})

async function onSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  ok.value = false

  try {
    // 1) (TODO backend) Utworzenie użytkownika:
    //    POST /user  -> { id }    (brak w spec – w mocku generujemy lokalne ID)
    const userId = `mock-${Date.now().toString(36)}`

    // 2) (TODO backend) Upload zgody rodzica:
    //    np. POST /user/:userId/consent  multipart/form-data
    //    W mocku tylko „udajemy” sukces.

    // 3) Przypisanie do grupy:
    const [eventId, groupId] = selectedGroupKey.value.split('|')

    // Gdy backend gotowy:
    // await addUserToEventGroup(eventId, groupId, userId)

    const grp = groups.value.find((g) => g.eventId === eventId && g.groupId === groupId)
    lastPreview.value = {
      userId,
      fullName: `${form.value.firstName} ${form.value.lastName}`,
      pesel: form.value.pesel,
      fileName: fileName.value,
      group: grp,
    }
    ok.value = true

    form.value.firstName = ''
    form.value.lastName = ''
    form.value.pesel = ''
    file.value = null
  } catch (e) {
    error.value = e?.message || 'Coś poszło nie tak.'
  } finally {
    submitting.value = false
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

.row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.lbl {
  font-weight: 600;
}

.fileinfo {
  font-size: 0.9rem;
  color: $muted-color;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .err {
    color: $red-color;
  }
  .ok {
    color: $blue-color;
  }
}

.preview {
  margin-top: 1rem;

  h3 {
    margin: 0 0 0.5rem 0;
  }

  .kv {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 0.5rem;
      padding: 0.35rem 0;

      span {
        color: $muted-color;
      }

      @media (max-width: 720px) {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
