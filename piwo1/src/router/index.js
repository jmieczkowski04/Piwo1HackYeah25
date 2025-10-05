import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from '../views/LoginPage.vue'
import BrowserPage from '../views/BrowserPage.vue'
import DashboardPage from '../views/DashboardPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'browser',
      component: BrowserPage,
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
      // meta: { requiresAuth: true },
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

export default router
