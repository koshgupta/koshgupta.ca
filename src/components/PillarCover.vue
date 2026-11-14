<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { trackCover } from '../coverMotion.js'

const props = defineProps({
  word: { type: String, required: true },
  cover: { type: Object, required: true },
})

const el = ref(null)
let untrack = null

onMounted(() => {
  untrack = trackCover(el.value)
})

onBeforeUnmount(() => untrack?.())

const style = computed(() => ({
  '--wx': props.cover.wx,
  '--cx': props.cover.cx,
  '--cy': props.cover.cy,
  '--cd': props.cover.cd,
  '--dx': props.cover.dx ?? '-14cqw',
  '--dy': props.cover.dy ?? '0cqh',
  '--circle': `var(--${props.cover.circle})`,
  '--word-ink': `var(--${props.cover.ink})`,
  '--word-inner': `var(--${props.cover.inner})`,
}))
</script>

<template>
  <!-- Decorative: the pillar's visible label is its heading. -->
  <div ref="el" class="cover" aria-hidden="true" :style="style">
    <span class="word">{{ word }}</span>
    <span class="circle"><span class="word word--inner">{{ word }}</span></span>
  </div>
</template>

<style scoped>
.cover {
  position: relative;
  container-type: size;
  height: var(--cover-h, clamp(200px, 38dvh, 380px));
  overflow: clip;
  flex: none;
}

.word {
  position: absolute;
  left: var(--wx);
  top: 50cqh;
  transform: translateY(-52%);
  font-size: 62cqh;
  font-stretch: 125%;
  font-weight: 560;
  letter-spacing: -0.04em;
  line-height: 1;
  white-space: nowrap;
  color: var(--word-ink);
  user-select: none;
}

.circle {
  position: absolute;
  left: var(--cx);
  top: var(--cy);
  width: var(--cd);
  height: var(--cd);
  border-radius: 50%;
  background: var(--circle);
  overflow: hidden;
}

/* The same word, clipped by the circle, so the ink flips where they cross. */
.word--inner {
  left: calc(var(--wx) - var(--cx));
  top: calc(50cqh - var(--cy));
  color: var(--word-inner);
}

/*
  Scroll-linked travel. coverMotion.js writes --k: 0 shows the start of the word at its designed
  offset, 1 slides it until the end sits the same distance from the right edge (the 100% is the
  word's own width, so any length works). The circle drifts along --dx / --dy, passing
  its designed spot at the midpoint, and the clipped word counter-moves to stay registered.
*/
@media (prefers-reduced-motion: no-preference) {
  .cover.is-live {
    --slide: calc(var(--k, 0) * (100cqw - 2 * var(--wx) - 100%));
    --drift-x: calc((var(--k, 0) - 0.5) * 2 * var(--dx));
    --drift-y: calc((var(--k, 0) - 0.5) * 2 * var(--dy));
  }

  .is-live .word {
    translate: var(--slide) 0;
    will-change: translate;
  }

  .is-live .circle {
    translate: var(--drift-x) var(--drift-y);
    will-change: translate;
  }

  .is-live .word--inner {
    translate: calc(var(--slide) - var(--drift-x)) calc(-1 * var(--drift-y));
  }
}
</style>
