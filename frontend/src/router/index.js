import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import BrowserPage from '../views/BrowserPage.vue'
import DashboardPage from '../views/DashboardPage.vue'

// NOWE: realne komponenty browsera
import ResultsBar from '@/components/browser/ResultsBar.vue'
import MapField from '@/components/browser/MapField.vue'
import AdvertField from '@/components/browser/AdvertField.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'browser',
      component: BrowserPage,
      children: [
        { path: '', components: { results: ResultsBar, main: MapField } },
        {
          path: 'ad/:id',
          components: { results: ResultsBar, main: AdvertField },
          props: { results: true, main: true },
        },
      ],
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
      redirect: '/dashboard/panel',
      children: [
        {
          path: 'panel',
          name: 'dashboard-panel',
          component: () => import('../components/dashboard/Categories/AllDashboard.vue'),
        },
        {
          path: 'user',
          name: 'dashboard-user',
          component: () => import('../components/dashboard/Categories/AllUserData.vue'),
        },
        {
          path: 'calendar',
          name: 'dashboard-calendar',
          component: () => import('../components/dashboard/Categories/AllCalendar.vue'),
        },
        {
          path: 'certificates',
          name: 'dashboard-certificates',
          component: () => import('../components/dashboard/Categories/AllCertificates.vue'),
        },
        {
          path: 'reports',
          name: 'dashboard-reports',
          component: () => import('../components/dashboard/Categories/AllReports.vue'),
        },
        {
          path: 'contact',
          name: 'dashboard-contact',
          component: () => import('../components/dashboard/Categories/CoordContact.vue'),
        },
        {
          path: 'advert-publication',
          name: 'dashboard-advert-publication',
          component: () => import('../components/dashboard/Categories/OrgAdvertPublication.vue'),
        },
        {
          path: 'alert-settings',
          name: 'dashboard-alert-settings',
          component: () => import('../components/dashboard/Categories/OrgAlertSettings.vue'),
        },
        {
          path: 'application-management',
          name: 'dashboard-application-management',
          component: () =>
            import('../components/dashboard/Categories/OrgApplicationManagement.vue'),
        },
        {
          path: 'opinions',
          name: 'dashboard-opinions',
          component: () => import('../components/dashboard/Categories/OrgOpinions.vue'),
        },
        {
          path: 'institution-verification',
          name: 'dashboard-institution-verification',
          component: () => import('../components/dashboard/Categories/SudoOrgVerification.vue'),
        },
        {
          path: 'event-verification',
          name: 'dashboard-event-verification',
          component: () => import('../components/dashboard/Categories/SudoEventVerification.vue'),
        },
        {
          path: 'notification-settings',
          name: 'dashboard-notification-settings',
          component: () => import('../components/dashboard/Categories/VolNotifSettings.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.meta?.requiresAuth && !token) {
    console.log('No token found.')
    // ewentualnie: return { name: 'login' }
  }
})

export default router


==== ./src\stores\auth.js ====
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