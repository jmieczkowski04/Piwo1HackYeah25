<template>
  <div class="container">
    <Navbar />
    <div class="content">
      <router-view />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import Navbar from '@/components/structure/Navbar.vue'
import Footer from '@/components/structure/Footer.vue'
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100vw;
}
.content {
  min-height: calc(100vh - 100px);
}
</style>
