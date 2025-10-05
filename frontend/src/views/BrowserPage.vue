<template>
  <div class="browser container-max">
    <div class="browser__grid">
      <section class="browser__left">
        <!-- results-outlet: lista + filtry -->
        <router-view
          name="results"
          :filters="filters"
          :items="filtered"
          :selected-id="selectedId"
          @update:filters="onFilters"
          @select="onSelect"
        />
      </section>

      <section class="browser__right">
        <!-- main-outlet: mapa albo podgląd ogłoszenia -->
        <router-view
          name="main"
          :pins="pinsForMap"
          :center="mapCenter"
          :zoom="mapZoom"
          :ad="selectedItem"
          @group-pin-click="onPinClick"
        />
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mockPins } from '@/mocks/mapPins.js'

const route = useRoute()
const router = useRouter()

// FILTRY: dateStart, dateEnd, event (string), radiusFromPin (km), age (number)
const filters = reactive({
  dateStart: '',
  dateEnd: '',
  event: '',
  radiusFromPin: 0, // 0 = wyłączony
  age: 0, // 0 = brak filtra
})

// ŹRÓDŁO DANYCH (mock – wpięcie pod backend jest trywialne)
const items = ref(mockPins()) // [{ id, title, eventId, groupId, start_date, end_date, ageMin, ageMax, latitude, longitude, address }]

// Stan mapy/wyboru
const mapCenter = ref({ lat: 50.06143, lng: 19.93658 }) // Kraków
const mapZoom = ref(12)
const selectedId = ref(route.params.id ? String(route.params.id) : '')

watch(
  () => route.params.id,
  (val) => {
    selectedId.value = val ? String(val) : ''
  },
)

// Filtrowanie
const filtered = computed(() => {
  const ev = String(filters.event || '')
    .toLowerCase()
    .trim()
  const sTs = filters.dateStart ? new Date(filters.dateStart + 'T00:00:00').getTime() : -Infinity
  const eTs = filters.dateEnd ? new Date(filters.dateEnd + 'T23:59:59').getTime() : Infinity
  const age = Number(filters.age || 0)

  return (items.value || []).filter((x) => {
    const nameOK = !ev || x.title.toLowerCase().includes(ev)
    const inDate = new Date(x.end_date).getTime() >= sTs && new Date(x.start_date).getTime() <= eTs
    const ageOK =
      !age || // brak filtra
      (Number.isFinite(x.ageMin) && Number.isFinite(x.ageMax)
        ? age >= x.ageMin && age <= x.ageMax
        : true)

    return nameOK && inDate && ageOK
  })
})

// Promień od „pinu referencyjnego” (klik na mapie) – Haversine
const refPin = ref(null) // { lat, lng }
function distKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2)
  return 2 * R * Math.asin(Math.sqrt(h))
}

const filteredWithRadius = computed(() => {
  if (!filters.radiusFromPin || !refPin.value) return filtered.value
  const radius = Number(filters.radiusFromPin)
  return filtered.value.filter((x) => {
    const d = distKm(refPin.value, { lat: x.latitude, lng: x.longitude })
    return d <= radius
  })
})

// PINY dla mapy
const pinsForMap = computed(() =>
  filteredWithRadius.value.map((x) => ({
    latitude: x.latitude,
    longitude: x.longitude,
    eventId: x.eventId,
    groupId: x.groupId,
    id: x.id,
    title: x.title,
  })),
)

// Wybrany rekord (do podglądu)
const selectedItem = computed(
  () => (items.value || []).find((x) => String(x.id) === selectedId.value) || null,
)

// Reakcje na interakcje
function onFilters(next) {
  Object.assign(filters, next || {})
}
function onSelect(id) {
  if (!id) {
    router.replace({ path: '/' })
  } else {
    router.replace({ path: `/ad/${id}` })
  }
}
function onPinClick(pin) {
  refPin.value = { lat: pin.latitude, lng: pin.longitude }
  if (pin?.id) onSelect(String(pin.id))
  // delikatny „zoom to pin”
  mapCenter.value = { lat: pin.latitude, lng: pin.longitude }
  mapZoom.value = 14
}
</script>

<style scoped lang="scss">
.browser__grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
}

.browser__left,
.browser__right {
  min-width: 0;
}
</style>