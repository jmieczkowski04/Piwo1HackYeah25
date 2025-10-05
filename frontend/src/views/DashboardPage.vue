<template>
  <div class="dashboard">
    <div class="settings-bar"><SettingsBar /></div>
    <div class="dashboard-field"><RouterView /></div>
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

  .settings-bar,
  .dashboard-field {
    background: $surface;
    border: 1px solid $border-color;
    border-radius: $radius-lg;
    padding: 1rem;
  }
}
</style>
