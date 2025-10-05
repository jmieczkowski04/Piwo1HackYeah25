<template>
  <div>
    <ul>
      <li>
        <router-link to="/dashboard/panel">Panel główny</router-link>
      </li>
      <li v-if="auth.isCoordinator">
        <router-link to="/dashboard/user">Dane użytkownika</router-link>
      </li>
      <li>
        <router-link to="/dashboard/calendar">Kalendarz</router-link>
      </li>
      <li>
        <router-link to="/dashboard/certificates">Zaświadczenia</router-link>
      </li>
      <li>
        <router-link to="/dashboard/reports">Raporty</router-link>
      </li>
      <!--  -->
      <li>
        <router-link to="/dashboard/contact">Kontakt</router-link>
      </li>
      <!--  -->
      <li v-if="auth.isOrgAdmin || auth.isGovAdmin">
        <router-link to="/dashboard/advert-publication">Publikacja ogłoszeń</router-link>
      </li>
      <li v-if="auth.isOrgAdmin">
        <router-link to="/dashboard/alert-settings">Ustawienia alertów</router-link>
      </li>
      <li v-if="auth.isOrgAdmin || auth.isGovAdmin">
        <router-link to="/dashboard/application-management">Zarządzanie zgłoszeniami</router-link>
      </li>
      <li v-if="auth.isOrgAdmin || auth.isGovAdmin">
        <router-link to="/dashboard/opinions">Opinie</router-link>
      </li>
      <!-- TYLKO dla pełnych adminów rządowych -->
      <li v-if="auth.isGovAdmin">
        <router-link to="/dashboard/institution-verification">Weryfikacja organizacji</router-link>
      </li>

      <li v-if="auth.isGovAdmin">
        <router-link to="/dashboard/event-verification">Weryfikacja wydarzeń</router-link>
      </li>

      <!--  -->
      <li v-if="auth.isVolunteer">
        <router-link to="/dashboard/notification-settings">Ustawienia powiadomień</router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'
const auth = useAuthStore()
</script>
