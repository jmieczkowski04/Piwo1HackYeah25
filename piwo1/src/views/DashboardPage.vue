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
  display: flex;
}
.settings-bar {
  height: 100%;
  width: 30%;
}
.dashboard-field {
  height: 100%;
  width: 70%;
}
</style>
