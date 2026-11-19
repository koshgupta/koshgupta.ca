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
    <!-- The cover word is decorative, so the section's heading is kept for assistive tech only. -->
    <h2 :id="`${id}-label`" class="sr-only">{{ label }}</h2>
    <div class="box" data-pillar-scroll tabindex="0" :aria-labelledby="`${id}-label`">
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
}

@keyframes rise {
  from { clip-path: inset(100% 0 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
</style>
