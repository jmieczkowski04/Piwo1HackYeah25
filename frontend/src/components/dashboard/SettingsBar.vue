<template>
  <nav class="settings">
    <RouterLink class="item" to="/dashboard/panel">Panel główny</RouterLink>

    <RouterLink v-if="auth.isCoordinator" class="item" to="/dashboard/user">
      Dane użytkownika
    </RouterLink>

    <RouterLink class="item" to="/dashboard/calendar">Kalendarz</RouterLink>
    <RouterLink class="item" to="/dashboard/certificates">Zaświadczenia</RouterLink>
    <RouterLink class="item" to="/dashboard/reports">Raporty</RouterLink>

    <div class="divider" role="separator"></div>

    <RouterLink class="item" to="/dashboard/contact">Kontakt</RouterLink>

    <RouterLink
      v-if="auth.isOrgAdmin || auth.isGovAdmin"
      class="item"
      to="/dashboard/advert-publication"
    >
      Publikacja ogłoszeń
    </RouterLink>

    <RouterLink v-if="auth.isOrgAdmin" class="item" to="/dashboard/alert-settings">
      Ustawienia alertów
    </RouterLink>

    <RouterLink
      v-if="auth.isOrgAdmin || auth.isGovAdmin"
      class="item"
      to="/dashboard/application-management"
    >
      Zarządzanie zgłoszeniami
    </RouterLink>

    <RouterLink v-if="auth.isOrgAdmin || auth.isGovAdmin" class="item" to="/dashboard/opinions">
      Opinie
    </RouterLink>

    <RouterLink v-if="auth.isGovAdmin" class="item" to="/dashboard/institution-verification">
      Weryfikacja organizacji
    </RouterLink>

    <RouterLink v-if="auth.isGovAdmin" class="item" to="/dashboard/event-verification">
      Weryfikacja wydarzeń
    </RouterLink>

    <RouterLink v-if="auth.isVolunteer" class="item" to="/dashboard/notification-settings">
      Ustawienia powiadomień
    </RouterLink>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'
const auth = useAuthStore()
</script>

<style scoped lang="scss">
.settings {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  background: $surface;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 0.5rem;
}

/* pojedynczy link */
.item {
  display: block;
  padding: 0.6rem 0.75rem;
  border-radius: $radius-sm;
  color: $muted-color;
  transition:
    background-color 120ms ease,
    color 120ms ease,
    border-left-color 120ms ease;

  border-left: 3px solid transparent;

  &:hover {
    background: $surface-hover;
    color: $font-color;
  }

  /* aktywny stan — działa też dla zagnieżdżonych tras */
  &.router-link-active,
  &.router-link-exact-active {
    background: rgba($blue-color, 0.08);
    color: $blue-color;
    font-weight: 600;
    border-left-color: $blue-color;
  }
}

/* separator sekcji */
.divider {
  height: 1px;
  background: $border-color;
  margin: 0.35rem 0;
}
</style>
