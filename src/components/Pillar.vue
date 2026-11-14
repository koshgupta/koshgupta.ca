<script setup>
import PillarCover from './PillarCover.vue'

defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  word: { type: String, default: '' },
  cover: { type: Object, default: null },
  width: { type: String, default: 'base' },
  tone: { type: String, default: 'pale' },
  index: { type: Number, default: 0 },
  // fill: the slot fills the box (a single composed card that doesn't scroll).
  fill: { type: Boolean, default: false },
})
</script>

<template>
  <section
    :id="id"
    class="pillar"
    :class="[`pillar--${width}`, `tone--${tone}`]"
    :style="{ '--i': index }"
    :aria-labelledby="`${id}-label`"
  >
    <h2 :id="`${id}-label`" class="label">{{ label }}</h2>
    <div
      class="box"
      :class="{ 'is-fill': fill }"
      data-pillar-scroll
      :tabindex="fill ? undefined : 0"
      :aria-labelledby="fill ? undefined : `${id}-label`"
    >
      <PillarCover v-if="cover" :word="word" :cover="cover" />
      <div class="content">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.pillar {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  color: var(--granite);
  padding-bottom: 14px;
}

.box {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  color: var(--text);
  scrollbar-width: thin;
  scrollbar-color: var(--scroll-thumb) transparent;
}

.content {
  padding: 36px clamp(24px, 3vw, 44px) 48px;
}

.is-fill .content {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-height: 340px;
  overflow: clip;
  container-type: inline-size;
}

.tone--pale {
  --surface: var(--pillar);
  --scroll-thumb: color-mix(in srgb, var(--charcoal) 35%, transparent);
}

.tone--granite {
  --surface: var(--granite);
  --ink: var(--sand);
  --text: var(--ash);
  --quiet: var(--ash);
  --rule: color-mix(in srgb, var(--ash) 30%, transparent);
  --scroll-thumb: color-mix(in srgb, var(--ash) 45%, transparent);
}

.tone--granite :deep(::selection) {
  background: var(--sand);
  color: var(--granite);
}

.tone--granite .box:focus-visible,
.tone--granite :deep(a:focus-visible) {
  outline-color: var(--sand);
}

/* Desktop: a tall pillar in the sideways row, scrolled on its own. */
@media (min-width: 960px) and (min-height: 560px) {
  .pillar {
    flex: none;
    width: clamp(380px, 34vw, 580px);
    height: 100%;
    scroll-snap-align: start;
  }

  .pillar--wide {
    width: clamp(460px, 44vw, 760px);
  }

  .pillar--narrow {
    width: clamp(320px, 26vw, 440px);
  }

  .box {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior-y: contain;
  }

  .box:focus-visible {
    outline-offset: -2px;
  }

  /* Entrance runs only once the page is painting frames; content is visible by default. */
  html.is-entering .box {
    animation: rise 1100ms var(--ease-out) backwards;
    animation-delay: calc(240ms + var(--i) * 90ms);
  }

  html.is-entering .label {
    animation: settle 900ms var(--ease-out) backwards;
    animation-delay: calc(420ms + var(--i) * 90ms);
  }
}

@keyframes rise {
  from { clip-path: inset(100% 0 0 0); }
  to { clip-path: inset(0 0 0 0); }
}

@keyframes settle {
  from { opacity: 0; translate: 0 6px; }
  to { opacity: 1; translate: 0 0; }
}
</style>
