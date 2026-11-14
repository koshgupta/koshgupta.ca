<script setup>
import { computed, ref } from 'vue'

// progress: 0..1 along the track. visible: share of the track in view (0..1).
const props = defineProps({
  progress: { type: Number, default: 0 },
  visible: { type: Number, default: 0.3 },
  ticks: { type: Number, default: 29 },
})
const emit = defineEmits(['seek'])

const rail = ref(null)
let dragging = false

const thumbWidth = computed(() => Math.min(100, Math.max(9, props.visible * 100)))
const thumbLeft = computed(() => props.progress * (100 - thumbWidth.value))

function fractionAt(clientX) {
  const rect = rail.value.getBoundingClientRect()
  const half = (thumbWidth.value / 100) * rect.width * 0.5
  const span = rect.width - half * 2
  return Math.min(1, Math.max(0, (clientX - rect.left - half) / span))
}

function down(e) {
  dragging = true
  rail.value.setPointerCapture(e.pointerId)
  emit('seek', fractionAt(e.clientX), true)
}

function move(e) {
  if (dragging) emit('seek', fractionAt(e.clientX), false)
}

function up(e) {
  dragging = false
  if (rail.value.hasPointerCapture(e.pointerId)) rail.value.releasePointerCapture(e.pointerId)
}
</script>

<template>
  <!-- Pointer-only scrubber; the section nav and arrow keys are the accessible route. -->
  <div
    ref="rail"
    class="ruler"
    aria-hidden="true"
    @pointerdown="down"
    @pointermove="move"
    @pointerup="up"
    @pointercancel="up"
  >
    <span v-for="n in ticks" :key="n" class="tick" />
    <span class="thumb" :style="{ left: `${thumbLeft}%`, width: `${thumbWidth}%` }" />
  </div>
</template>

<style scoped>
.ruler {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 232px;
  height: 28px;
  cursor: ew-resize;
  touch-action: none;
}

.tick {
  width: 1px;
  height: 16px;
  background: color-mix(in srgb, var(--charcoal) 55%, transparent);
}

.thumb {
  position: absolute;
  top: 3px;
  height: 22px;
  border: 1px solid var(--charcoal);
  background: var(--ground);
  transition: border-color 200ms;
}

.ruler:hover .thumb {
  border-color: var(--mahogany);
}
</style>
