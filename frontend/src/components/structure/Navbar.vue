<template>
  <header class="navbar">
    <div class="navbar__inner">
      <router-link to="/" class="brand">
        <img class="brand__logo" src="@/assets/logo.png" alt="Logo" />
        <span class="brand__name">Wolontariat</span>
      </router-link>

      <nav class="nav">
        <router-link to="/">Ogłoszenia</router-link>
        <router-link to="/login">Logowanie</router-link>
        <router-link to="/dashboard">Panel</router-link>
      </nav>

      <div class="role" v-if="auth.rolesAvailable.length">
        <label v-if="auth.rolesAvailable.length > 1" class="role__switch">
          Rola:
          <select :value="auth.currentRole" @change="onChange" class="select">
            <option v-for="r in auth.rolesAvailable" :key="r" :value="r">
              {{ auth.ROLE_LABEL[r] || r }}
            </option>
          </select>
        </label>
        <span v-else class="badge">
          {{ auth.ROLE_LABEL[auth.currentRole] || auth.currentRole }}
        </span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'
const auth = useAuthStore()
function onChange(e) {
  auth.setRole(e.target.value)
}
</script>

<style scoped lang="scss">
.navbar {
  position: relative;
  top: 0;
  z-index: 50;
  background: $surface;
  border-bottom: 1px solid $border-color;
}

.navbar__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: $font-color;

  &__logo {
    height: 36px;
    width: auto;
    display: block;
  }
  &__name {
    font-weight: 700;
    letter-spacing: 0.2px;
  }
}

.nav {
  display: inline-flex;
  gap: 0.25rem;

  a {
    padding: 0.45rem 0.7rem;
    border-radius: 8px;
    transition:
      background-color 120ms ease,
      color 120ms ease;
    color: $font-color;

    &:hover {
      background: $surface-hover;
    }
    &.router-link-exact-active {
      color: $blue-color;
      background: $surface-hover;
      font-weight: 600;
    }
  }
}

.role {
  display: inline-flex;
  align-items: center;
}
.role__switch {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}
.select {
  padding: 0.35rem 0.6rem;
  border: 1px solid $border-color;
  border-radius: 8px;
  background: $surface;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: $surface-hover;
  border: 1px solid $border-color;
  font-weight: 600;
  font-size: 0.9rem;
}
</style>
