<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { trackCover } from '../coverMotion.js'

const props = defineProps({
  word: { type: String, required: true },
  cover: { type: Object, required: true },
})

const el = ref(null)
const wordEl = ref(null)
let untrack = null
let observer = null

// The word's width per unit of font size is fixed for a given font, so measuring it (again whenever
// the word's box changes, as when the web font replaces the fallback) lets CSS size the word to fit
// the cover at any width. Writing the same ratio back doesn't change the box, so this settles at once.
function measure() {
  const w = wordEl.value
  if (!w || !el.value) return
  const size = parseFloat(getComputedStyle(w).fontSize)
  const width = w.getBoundingClientRect().width
  if (!(size > 0 && width > 0)) return
  const ratio = (width / size).toFixed(4)
  if (el.value.style.getPropertyValue('--r') !== ratio) el.value.style.setProperty('--r', ratio)
}

onMounted(() => {
  measure()
  if ('ResizeObserver' in window) {
    observer = new ResizeObserver(measure)
    observer.observe(wordEl.value)
  }
  document.fonts?.ready.then(measure)
  untrack = trackCover(el.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  untrack?.()
})

const style = computed(() => ({
  '--y': props.cover.y ?? 0,
  '--circle': `var(--${props.cover.circle})`,
  '--word-ink': `var(--${props.cover.ink})`,
  '--word-inner': `var(--${props.cover.inner})`,
}))
</script>

<template>
  <!-- Decorative: the pillar's heading names the section. -->
  <div ref="el" class="cover" aria-hidden="true" :style="style">
    <span ref="wordEl" class="word">{{ word }}</span>
    <span class="circle"><span class="word word--inner">{{ word }}</span></span>
  </div>
</template>

<style scoped>
/*
  Geometry, in the cover's container units (resolved where each property is used):
  --fs  the word's size: as large as fits between 6cqw margins, capped at 62% of the cover's height
  --ww  the word's width (--r is its measured width per unit of font size)
  --wl  the word's left edge, centring it
  --cd  the circle's diameter, the same on every cover (desktop covers share a height, stacked
        covers share a width); --y nudges it off the word's midline, in units of the word's size
*/
.cover {
  --fs: min(62cqh, 88cqw / var(--r, 5));
  --ww: calc(var(--fs) * var(--r, 5));
  --wl: calc((100cqw - var(--ww)) / 2);
  --cd: 66cqh;

  position: relative;
  container-type: size;
  height: clamp(200px, 38dvh, 380px);
  overflow: clip;
  flex: none;
}

/* Stacked, each cover hugs its word (the cards sit apart, so heights needn't match). */
@media not all and (min-width: 960px) and (min-height: 560px) {
  .cover {
    --cd: 35cqw;
    height: min(clamp(200px, 38dvh, 380px), max(160px, 1.76 * (100vw - 32px) / var(--r, 5)));
  }
}

.word {
  position: absolute;
  left: var(--wl);
  top: 50cqh;
  transform: translateY(-52%);
  font-size: var(--fs);
  font-stretch: 125%;
  font-weight: 560;
  letter-spacing: -0.04em;
  line-height: 1;
  white-space: nowrap;
  color: var(--word-ink);
  user-select: none;
}

/* At rest the circle sits centred on the word, nudged off its midline by --y. */
.circle {
  position: absolute;
  left: calc(var(--wl) + var(--ww) / 2 - var(--cd) / 2);
  top: calc(50cqh + var(--y) * var(--fs) - var(--cd) / 2);
  width: var(--cd);
  height: var(--cd);
  border-radius: 50%;
  background: var(--circle);
  overflow: hidden;
}

/* The same word, clipped by the circle, so the ink flips where they cross. */
.word--inner {
  left: calc(var(--cd) / 2 - var(--ww) / 2);
  top: calc(var(--cd) / 2 - var(--y) * var(--fs));
  color: var(--word-inner);
}

/*
  Spotlight: coverMotion.js writes --k as the cover scrolls into place, sliding the circle from the
  word's first letter (0) to its last (1). The clipped word counter-moves to stay registered.
*/
@media (prefers-reduced-motion: no-preference) {
  .is-live .circle {
    translate: calc((var(--k, 0.5) - 0.5) * var(--ww)) 0;
    will-change: translate;
  }

  .is-live .word--inner {
    translate: calc((0.5 - var(--k, 0.5)) * var(--ww)) 0;
  }
}
</style>
