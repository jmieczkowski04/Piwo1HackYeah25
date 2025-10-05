import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const ROLE = {
  VOLUNTEER: 'VOLUNTEER',
  COORDINATOR: 'COORDINATOR',
  ORG_ADMIN: 'ORG_ADMIN',
  GOV_ADMIN: 'GOV_ADMIN',
}

export const ROLE_LABEL = {
  [ROLE.VOLUNTEER]: 'Wolontariusz',
  [ROLE.COORDINATOR]: 'Koordynator',
  [ROLE.ORG_ADMIN]: 'Admin organizacji',
  [ROLE.GOV_ADMIN]: 'Admin rządowy',
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const rolesAvailable = ref([])
  const currentRole = ref(null)

  function setAuthFromBackend({ user: u, roles }) {
    user.value = u || null
    const r = Array.isArray(roles) ? roles : roles ? [roles] : []
    rolesAvailable.value = r
    currentRole.value = r[0] || null
  }

  function setRole(role) {
    if (rolesAvailable.value.includes(role)) currentRole.value = role
  }

  const isGovAdmin = computed(() => currentRole.value === ROLE.GOV_ADMIN)
  const isOrgAdmin = computed(() => currentRole.value === ROLE.ORG_ADMIN)
  const isCoordinator = computed(() => currentRole.value === ROLE.COORDINATOR)
  const isVolunteer = computed(() => currentRole.value === ROLE.VOLUNTEER)

  return {
    // state
    user,
    rolesAvailable,
    currentRole,
    // labels/enums
    ROLE,
    ROLE_LABEL,
    // actions
    setAuthFromBackend,
    setRole,
    // getters
    isGovAdmin,
    isOrgAdmin,
    isCoordinator,
    isVolunteer,
  }
})
