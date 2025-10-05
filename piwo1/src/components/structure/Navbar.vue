<template>
  <nav>
    <router-link to="/">Ogłoszenia</router-link>
    <router-link to="/login">Logowanie</router-link>
    <router-link to="/dashboard">Panel</router-link>
  </nav>
</template>

<script setup></script>

<style scoped lang="scss">
nav {
  display: flex;
  justify-content: space-around;
  padding: 1rem 0;
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
</style>
