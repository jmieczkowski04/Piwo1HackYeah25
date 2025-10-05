<template>
  <div class="dashboard">
    <div class="settings-bar"><SettingsBar /></div>
    <div class="dashboard-field card"><RouterView /></div>
  </div>
</template>

<script setup>
import SettingsBar from '@/components/dashboard/SettingsBar.vue'
</script>

<style scoped lang="scss">
.dashboard {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1rem;
  padding: 1rem;

  .dashboard-field {
    min-height: 60vh;
  }

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
}
</style>
