<template>
  <nav>
    <div class="left">
      <router-link to="/">Ogłoszenia</router-link>
      <router-link to="/login">Logowanie</router-link>
      <router-link to="/dashboard">Panel</router-link>
    </div>

    <div class="right" v-if="auth.rolesAvailable.length">
      <!-- gdy jest więcej niż 1 rola: select do przełączania -->
      <label v-if="auth.rolesAvailable.length > 1" class="role-switch">
        Rola:
        <select :value="auth.currentRole" @change="onChange">
          <option v-for="r in auth.rolesAvailable" :key="r" :value="r">
            {{ auth.ROLE_LABEL[r] || r }}
          </option>
        </select>
      </label>

      <!-- gdy jest tylko jedna rola: pokazujemy ją jako tekst -->
      <span v-else class="role-badge">
        {{ auth.ROLE_LABEL[auth.currentRole] || auth.currentRole }}
      </span>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth.js'

const auth = useAuthStore()
function onChange(e) {
  auth.setRole(e.target.value)
}
</script>

<style scoped lang="scss">
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

.left,
.right {
  display: flex;
  gap: 1rem;
  align-items: center;
}

nav a {
  text-decoration: none;
  padding: 0.5rem 1rem;
}
nav a:hover {
  color: $blue-color;
}
nav a.router-link-exact-active {
  font-weight: bold;
  color: $blue-color;
}

.role-switch select {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
}
.role-badge {
  padding: 0.25rem 0.5rem;
  background: $background-dark;
  border-radius: 0.5rem;
  font-size: 0.9rem;
}
</style>
