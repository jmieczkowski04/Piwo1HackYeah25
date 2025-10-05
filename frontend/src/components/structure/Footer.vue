<template>
  <footer class="footer">
    <div class="footer__inner">
      <!-- Brand -->
      <router-link to="/" class="brand" aria-label="Przejdź do strony głównej">
        <img class="brand__logo" src="@/assets/logo.png" alt="" />
        <span class="brand__name">VolCon</span>
      </router-link>

      <!-- Nawigacja skrótowa -->
      <nav class="links" aria-label="Szybkie linki">
        <router-link to="/">Ogłoszenia</router-link>
        <router-link to="/dashboard">Panel</router-link>
        <router-link to="/login">Logowanie</router-link>
      </nav>

      <!-- Kontakt / info -->
      <div class="meta">
        <p class="meta__line">
          Masz pytania? <a href="mailto:kontakt@VolCon.pl">kontakt@VolCon.pl</a>
        </p>
        <p class="meta__line">© {{ year }} VolCon — wszystkie prawa zastrzeżone</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped lang="scss">
.footer {
  margin-top: 2rem;
  background: $surface;
  border-top: 1px solid $border-color;
  color: $font-color;
}

.footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem 1rem;

  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: inherit;

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

.links {
  display: inline-flex;
  gap: 0.75rem;

  a {
    padding: 0.3rem 0.55rem;
    border-radius: $radius-sm;
    transition:
      background-color 120ms ease,
      color 120ms ease;
    color: $muted-color;

    &:hover {
      color: $blue-color;
      background: $surface-hover;
    }
    &.router-link-exact-active {
      color: $blue-color;
      font-weight: 600;
    }
  }

  @media (max-width: 900px) {
    justify-content: center;
  }
}

.meta {
  text-align: right;

  .meta__line {
    margin: 0.1rem 0;
    color: $muted-color;
    font-size: 0.9rem;

    a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover {
        color: $red-color;
      }
    }
  }

  @media (max-width: 900px) {
    text-align: center;
  }
}
</style>