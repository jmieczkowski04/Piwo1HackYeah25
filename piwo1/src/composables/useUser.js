import { ref } from 'vue'
import { getMe } from '@/api/user.js'

export function useUser() {
  const me = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchMe() {
    loading.value = true
    error.value = null
    try {
      me.value = await getMe()
    } catch (e) {
      error.value = e.message || 'Błąd'
    } finally {
      loading.value = false
    }
  }

  return { me, loading, error, fetchMe }
}
