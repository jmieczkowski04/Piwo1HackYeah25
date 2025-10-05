<template>
  <div class="nf">
    <div class="panel">
      <img class="logo" src="@/assets/logo.png" alt="Logo" />
      <h1>Ups, nie ma takiej strony</h1>
      <p class="hint">
        Kod błędu: <strong>404</strong>. Link mógł być nieaktualny albo wkradła się literówka.
      </p>

      <div class="actions">
        <button class="btn" @click="goBack">Wróć</button>
        <router-link class="btn" to="/">Strona główna</router-link>
        <router-link class="btn btn--primary" to="/dashboard">Przejdź do panelu</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped lang="scss">
.nf {
  min-height: calc(100vh - 120px); // minus navbar+footer
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
}

.panel {
  width: 100%;
  max-width: 720px;
  background: $surface;
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 64px;
  width: auto;
  margin-bottom: 0.75rem;
  display: inline-block;
}

h1 {
  margin: 0.25rem 0 0.25rem 0;
  font-size: 1.6rem;
  color: $font-color;
}

.hint {
  margin: 0 0 1.25rem 0;
  color: $muted-color;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

/* Lokalne, spójne przyciski (bez @extend) */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 0.55rem 0.9rem;
  border-radius: $radius-md;
  border: 1px solid $border-color;
  background: $surface;
  color: $font-color;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 120ms ease,
    color 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease;

  &:hover {
    background: $surface-hover;
  }

  &.btn--primary {
    background: $blue-color;
    border-color: $blue-color;
    color: #fff;

    &:hover {
      filter: brightness(0.95);
    }
  }
}

@media (max-width: 520px) {
  .panel {
    padding: 1.25rem;
  }
  h1 {
    font-size: 1.35rem;
  }
}
</style>
