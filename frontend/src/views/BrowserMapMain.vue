<template>
  <MapField :pins="pins" @pin="onPin" />
</template>

<script setup>
import MapField from '@/components/browser/MapField.vue'
import { mockGroupPins } from '@/mocks/mapPins.js'

const pins = mockGroupPins()

function onPin(p) {
  // w kolejnej iteracji wstawimy to do lewego panelu wyników
  console.log('Kliknięto pinezkę grupy:', p)
}
</script>

