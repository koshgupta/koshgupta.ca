<script setup>
import ArrowOut from './ArrowOut.vue'

defineProps({
  entry: { type: Object, required: true },
})
</script>

<template>
  <article class="entry">
    <h3 class="title">
      <a v-if="entry.link" class="title-link" :href="entry.link.href" target="_blank" rel="noopener"
        >{{ entry.title }}<span class="sr-only">, {{ entry.link.label }}</span><ArrowOut
      /></a>
      <template v-else>{{ entry.title }}</template>
    </h3>
    <p v-if="entry.org" class="org">{{ entry.org }}</p>
    <p v-if="entry.meta" class="meta">{{ entry.meta }}</p>

    <p v-if="entry.figure" class="figure">
      <span class="figure-value">{{ entry.figure.value }}</span>
      <span class="figure-unit">{{ entry.figure.unit }}</span>
      <span class="figure-caption">{{ entry.figure.caption }}</span>
    </p>

    <p v-for="(para, i) in entry.body" :key="i" class="body">{{ para }}</p>

    <dl v-if="entry.list" class="list">
      <div v-for="row in entry.list" :key="row.term" class="list-row">
        <dt>{{ row.term }}</dt>
        <dd>{{ row.detail }}</dd>
      </div>
    </dl>

    <ul v-if="entry.tags" class="tags" aria-label="Built with">
      <li v-for="tag in entry.tags" :key="tag">{{ tag }}</li>
    </ul>
  </article>
</template>

<style scoped>
.entry + .entry {
  margin-top: 56px;
  padding-top: 40px;
  border-top: 1px solid var(--rule);
}

.meta {
  margin-top: 2px;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  color: var(--quiet);
}

.title {
  font-size: clamp(1.375rem, 1.1rem + 0.6vw, 1.75rem);
  font-weight: 620;
  font-stretch: 108%;
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: var(--ink);
  text-wrap: balance;
}

.org {
  margin-top: 6px;
  font-size: 1rem;
  color: var(--quiet);
  text-wrap: balance;
}

.figure {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  column-gap: 10px;
  margin: 22px 0 18px;
}

.figure-value {
  font-size: clamp(3.5rem, 2.6rem + 2.4vw, 5.25rem);
  font-weight: 500;
  font-stretch: 118%;
  letter-spacing: -0.04em;
  line-height: 0.9;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
}

.figure-unit {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--ink);
}

.figure-caption {
  grid-column: 1 / -1;
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--quiet);
}

.body {
  margin-top: 14px;
  max-width: 62ch;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--text);
  text-wrap: pretty;
}

.list {
  margin-top: 24px;
  border-top: 1px solid var(--rule);
}

.list-row {
  display: grid;
  grid-template-columns: minmax(9.5rem, 34%) 1fr;
  gap: 4px 20px;
  padding: 14px 0;
  border-bottom: 1px solid var(--rule);
}

.list dt {
  font-weight: 600;
  color: var(--ink);
}

.list dd {
  color: var(--text);
  line-height: 1.5;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 20px;
  padding: 0;
  list-style: none;
  font-size: 0.875rem;
  font-weight: 560;
  color: var(--quiet);
}

.title-link {
  text-decoration: none;
}

.title-link:hover,
.title-link:focus-visible {
  text-decoration: underline;
  text-decoration-thickness: 2px;
}

@media (max-width: 520px) {
  .list-row {
    grid-template-columns: 1fr;
  }
}
</style>
