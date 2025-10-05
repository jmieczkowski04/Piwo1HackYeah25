<template>
  <div class="chat-page">
    <header class="head">
      <h2>Kontakt z organizatorem</h2>
      <p class="muted">
        Wybierz wydarzenie i rozmawiaj bezpośrednio z organizatorem. (Widoczne dla wolontariusza,
        koordynatora i admina — czat dotyczy wybranego eventu).
      </p>
    </header>

    <div class="card picker">
      <label for="eventSel" class="lbl">Wydarzenie</label>
      <select id="eventSel" class="select" v-model="selectedEventId" @change="loadChat">
        <option disabled value="">— wybierz wydarzenie —</option>
        <option v-for="e in eventOptions" :key="e.id" :value="e.id">
          {{ e.name }}
        </option>
      </select>

      <!-- DEMO: przełącznik "piszę jako" żeby pokazać obie strony w jednym UI -->
      <label class="aswho">
        Piszę jako:
        <select class="select aswho__sel" v-model="writeAs">
          <option value="ME">Ja ({{ meName }})</option>
          <option value="ORGANIZER">Organizator (demo)</option>
        </select>
      </label>

      <button class="btn" :disabled="!selectedEventId" @click="seedAutoReply">
        Symuluj odpowiedź organizatora
      </button>
    </div>

    <!-- Wątek -->
    <section class="card thread" v-if="selectedEventId">
      <div class="thread__inner" ref="scrollBox">
        <template v-if="chatDoc.messages?.length">
          <div
            v-for="m in chatDoc.messages"
            :key="m.id"
            class="msg"
            :class="{
              'msg--me': m.sender_id === meId,
              'msg--org': m.sender_id === organizerId,
            }"
          >
            <div class="msg__meta">
              <span class="who">{{ senderDisplay(m.sender_id) }}</span>
              <span class="ts">{{ fmtTime(m.ts) }}</span>
            </div>
            <div class="msg__bubble">{{ m.text }}</div>
          </div>
        </template>
        <p v-else class="muted">Brak wiadomości w tym wątku. Napisz pierwszą!</p>
      </div>

      <!-- Wysyłanie -->
      <form class="composer" @submit.prevent="send">
        <input
          class="input composer__input"
          v-model="draft"
          placeholder="Napisz wiadomość…"
          :disabled="sending"
        />
        <button class="btn btn--primary" :disabled="sending || !draft.trim()">Wyślij</button>
      </form>
      <small v-if="error" class="err">{{ error }}</small>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { listEventsForUser } from '@/api/user.js'
import { getChat, sendChatMessage } from '@/api/chat.js'
import { mockEventsForUser } from '@/mocks/events.js'
import { getChatMock, postMessageMock, autoReplyMock } from '@/mocks/chat.js'

const auth = useAuthStore()
const meId = computed(() => auth.user?.id || 'u-1')
const meName = computed(() => auth.user?.name || 'Ja')

// 1) Wybór eventu
const eventOptions = ref([])
const selectedEventId = ref('')
const writeAs = ref('ME') // 'ME' | 'ORGANIZER' (demo)

onMounted(async () => {
  try {
    const resp = await listEventsForUser(meId.value)
    const events = Array.isArray(resp) ? resp : resp?.events
    if (!events) throw new Error('no events')
    eventOptions.value = events
    selectedEventId.value = events[0]?.id || ''
  } catch {
    // mock fallback
    eventOptions.value = mockEventsForUser()
    selectedEventId.value = eventOptions.value[0]?.id || ''
  }
  if (selectedEventId.value) await loadChat()
})

watch(selectedEventId, async () => {
  if (selectedEventId.value) await loadChat()
})

const chatDoc = ref({
  chat_id: '',
  event_id: '',
  participants: [],
  last_seen: {},
  messages: [],
})

const participantsById = computed(() => {
  const map = {}
  for (const p of chatDoc.value.participants || []) map[p.user_id] = p
  return map
})
const organizerId = computed(() => {
  return (chatDoc.value.participants || []).find((p) => p.role === 'ORGANIZER')?.user_id
})

const sending = ref(false)
const error = ref('')
const scrollBox = ref(null)
const draft = ref('')

async function loadChat() {
  error.value = ''
  try {
    // real API: zwraca cały dokument
    const data = await getChat(selectedEventId.value, meId.value)
    chatDoc.value = {
      chat_id: data.chat_id,
      event_id: data.event_id,
      participants: data.participants || [],
      last_seen: data.last_seen || {},
      messages: (data.messages || []).slice().sort((a, b) => new Date(a.ts) - new Date(b.ts)),
    }
  } catch {
    // mock
    const m = getChatMock(selectedEventId.value, meId.value)
    chatDoc.value = {
      chat_id: m.chat_id,
      event_id: m.event_id,
      participants: m.participants || [],
      last_seen: m.last_seen || {},
      messages: (m.messages || []).slice().sort((a, b) => new Date(a.ts) - new Date(b.ts)),
    }
  }
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  const el = scrollBox.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function fmtTime(ts) {
  const d = new Date(ts)
  return d.toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

function senderDisplay(uid) {
  if (uid === meId.value) return 'Ty'
  return participantsById.value[uid]?.display_name || uid
}

async function send() {
  if (!draft.value.trim() || !selectedEventId.value) return
  sending.value = true
  error.value = ''
  const text = draft.value
  draft.value = ''

  const optimistic = {
    id: `tmp-${Date.now()}`,
    ts: new Date().toISOString(),
    sender_id: writeAs.value === 'ORGANIZER' ? organizerId.value || 'org-demo' : meId.value,
    text,
    meta: { delivered: true },
  }
  chatDoc.value.messages.push(optimistic)
  await nextTick()
  scrollToBottom()

  try {
    // real API: wysyłamy jako "ja" (backend weźmie nadawcę z tokena)
    await sendChatMessage(selectedEventId.value, meId.value, { text })
  } catch {
    // fallback mock (tu można 'udawać' obie strony dla dema)
    const saved = postMessageMock({
      eventId: selectedEventId.value,
      userId: meId.value,
      text,
      as: writeAs.value,
    })
    const i = chatDoc.value.messages.findIndex((m) => m.id === optimistic.id)
    if (i !== -1) chatDoc.value.messages[i] = saved
  } finally {
    sending.value = false
    await nextTick()
    scrollToBottom()
  }
}

// DEMO: szybka odpowiedź organizatora
async function seedAutoReply() {
  autoReplyMock({ eventId: selectedEventId.value, userId: meId.value })
  await loadChat()
}
</script>

<style scoped lang="scss">
.head {
  margin-bottom: 0.75rem;
  .muted {
    color: $muted-color;
  }
}

.picker {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
}

.lbl {
  font-weight: 600;
}

.aswho {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  .aswho__sel {
    min-width: 180px;
  }
}

.thread {
  margin-top: 1rem;
  display: grid;
  grid-template-rows: 1fr auto auto;
  gap: 0.5rem;
  min-height: 50vh;
}

.thread__inner {
  max-height: 60vh;
  overflow-y: auto;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 0.75rem;
  background: $surface;
}

.msg {
  margin: 0.4rem 0;
  max-width: 80%;
}
.msg--me {
  margin-left: auto;
}
.msg--org {
  margin-right: auto;
}

.msg__meta {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  font-size: 0.8rem;
  color: $muted-color;
  margin: 0 0 0.15rem 0;
}

.msg__bubble {
  padding: 0.55rem 0.7rem;
  border-radius: $radius-md;
  border: 1px solid $border-color;
  background: $surface-hover;
}
.msg--me .msg__bubble {
  background: rgba($blue-color, 0.08);
  border-color: rgba($blue-color, 0.35);
}
.msg--org .msg__bubble {
  background: #fff;
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}
.composer__input {
  width: 100%;
}

.err {
  color: $red-color;
}
</style>
