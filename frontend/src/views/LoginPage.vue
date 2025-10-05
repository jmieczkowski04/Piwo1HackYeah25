<template>
  <div class="login">
    <h2>Testowy login</h2>
    <p>Po kliknięciu poniżej dostaniesz wszystkie 4 role do wyboru w nawigacji.</p>

    <button class="btn btn--primary" @click="loginTest" :disabled="loading">
      {{ loading ? 'Logowanie…' : 'Zaloguj testowo' }}
    </button>

    <div v-if="preview.length" class="preview">
      <strong>Załadowane role:</strong>
      <ul>
        <li v-for="r in preview" :key="r">{{ auth.ROLE_LABEL[r] || r }}</li>
      </ul>
      <small>Teraz możesz przełączyć rolę w prawym górnym rogu (Navbar).</small>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, ROLE } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const preview = ref([])

async function loginTest() {
  loading.value = true
  try {
    const fakeResponse = {
      user: { id: 'u-1', name: 'Test User' },
      roles: [ROLE.VOLUNTEER, ROLE.COORDINATOR, ROLE.ORG_ADMIN, ROLE.GOV_ADMIN],
    }

    auth.setAuthFromBackend(fakeResponse)
    preview.value = fakeResponse.roles
    localStorage.setItem('token', 'fake-token')

    router.push({ name: 'dashboard' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login {
  max-width: 520px;
  margin: 3rem auto;
  padding: 2rem;
  background: $surface;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;

  h2 {
    margin: 0 0 0.25rem 0;
  }
  p {
    color: $muted-color;
    margin: 0 0 1rem 0;
  }
}

.btn {
  margin-top: 0.25rem;
}

.preview {
  margin-top: 1rem;

  ul {
    margin: 0.25rem 0 0 1rem;
    color: $muted-color;
  }
}
</style>
