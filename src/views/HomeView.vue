<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Pillar from '../components/Pillar.vue'
import PillarEntry from '../components/PillarEntry.vue'
import ArrowOut from '../components/ArrowOut.vue'
import { profile, sections } from '../content.js'

// Navigation order: the About card first, then the content sections.
const navItems = [{ id: 'about', label: 'About' }, ...sections.map(({ id, label }) => ({ id, label }))]

const root = ref(null)
const track = ref(null)
const active = ref(navItems[0].id)

const desktop = window.matchMedia('(min-width: 960px) and (min-height: 560px)')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

let frame = 0

function measure() {
  frame = 0
  const el = track.value
  if (!el || !desktop.matches) return
  const max = el.scrollWidth - el.clientWidth

  // Active pillar: the last one whose left edge has passed a third of the view.
  const edge = el.getBoundingClientRect().left + el.clientWidth * 0.34
  let current = navItems[0].id
  for (const n of navItems) {
    const node = document.getElementById(n.id)
    if (node && node.getBoundingClientRect().left <= edge) current = n.id
  }
  if (max > 0 && el.scrollLeft >= max - 2) current = navItems[navItems.length - 1].id
  active.value = current
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(measure)
}

function scrollToSection(id, smooth = true) {
  const node = document.getElementById(id)
  if (!node) return
  if (desktop.matches && track.value) {
    track.value.scrollTo({
      left: node.offsetLeft,
      behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto',
    })
  } else {
    node.scrollIntoView({ behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto', block: 'start' })
  }
  active.value = id
}

function onNav(id) {
  scrollToSection(id)
  history.replaceState(null, '', `#${id}`)
}

// Vertical wheel travels sideways, except where a pillar still has room to scroll.
function onWheel(e) {
  if (!desktop.matches || e.ctrlKey || !track.value) return
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
  const scroller = e.target.closest?.('[data-pillar-scroll]')
  if (scroller) {
    const atTop = scroller.scrollTop <= 0
    const atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
    if ((e.deltaY > 0 && !atEnd) || (e.deltaY < 0 && !atTop)) return
  }
  e.preventDefault()
  const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? track.value.clientWidth : 1
  track.value.scrollLeft += e.deltaY * unit
}

// Left and right arrows step between pillars when focus isn't inside one.
function onKey(e) {
  if (!desktop.matches || e.altKey || e.metaKey || e.ctrlKey) return
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const target = e.target
  if (target?.closest?.('input, textarea, select, [contenteditable="true"]')) return
  if (target === track.value) return // the track scrolls natively
  const ids = navItems.map((n) => n.id).concat('elsewhere')
  const i = Math.max(0, ids.indexOf(active.value))
  const next = e.key === 'ArrowRight' ? Math.min(ids.length - 1, i + 1) : Math.max(0, i - 1)
  e.preventDefault()
  scrollToSection(ids[next])
}

// The entrance is opt-in: added in the first frame (before first paint), removed once it has played,
// so content never depends on an animation clock to become visible.
let enterTimer = 0
function playEntrance() {
  if (reducedMotion.matches || !desktop.matches) return
  requestAnimationFrame(() => {
    document.documentElement.classList.add('is-entering')
    enterTimer = window.setTimeout(() => document.documentElement.classList.remove('is-entering'), 2400)
  })
}

onMounted(() => {
  playEntrance()
  root.value.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', schedule)
  desktop.addEventListener('change', schedule)
  const id = decodeURIComponent(location.hash.slice(1))
  if (id && document.getElementById(id)) requestAnimationFrame(() => scrollToSection(id, false))
  schedule()
})

onBeforeUnmount(() => {
  root.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', schedule)
  desktop.removeEventListener('change', schedule)
  if (frame) cancelAnimationFrame(frame)
  window.clearTimeout(enterTimer)
  document.documentElement.classList.remove('is-entering')
})
</script>

<template>
  <div ref="root" class="home">
    <a class="skip-link" href="#projects">Skip to projects</a>

    <header class="intro">
      <h1 class="name">{{ profile.name }}</h1>
      <p class="role">{{ profile.role }}</p>
      <p class="status">{{ profile.status }}</p>

      <nav class="nav" aria-label="Sections">
        <ul>
          <li v-for="n in navItems" :key="n.id">
            <a
              :href="`#${n.id}`"
              :class="{ 'is-active': active === n.id }"
              :aria-current="active === n.id ? 'true' : undefined"
              @click.prevent="onNav(n.id)"
            >{{ n.label }}</a>
          </li>
        </ul>
      </nav>

      <ul class="links">
        <li v-for="l in profile.links" :key="l.label">
          <a :href="l.href" target="_blank" rel="noopener">{{ l.label }}<ArrowOut /></a>
        </li>
      </ul>
    </header>

    <main class="stage">
      <div
        ref="track"
        class="track"
        data-track
        tabindex="0"
        role="region"
        aria-label="Portfolio sections, scroll sideways"
        @scroll.passive="schedule"
      >
        <Pillar id="about" label="About" :index="0" fill>
          <span class="about-circle" aria-hidden="true" />
          <p class="statement">
            <span v-for="(line, i) in profile.about" :key="i" class="sline" :style="{ '--l': i }">{{ `${line} ` }}</span>
          </p>
        </Pillar>

        <Pillar
          v-for="(s, i) in sections"
          :id="s.id"
          :key="s.id"
          :label="s.label"
          :word="s.word"
          :cover="s.cover"
          :width="s.width"
          :tone="s.tone"
          :index="i + 1"
        >
          <template v-if="s.entries">
            <PillarEntry v-for="entry in s.entries" :key="entry.title" :entry="entry" />
          </template>

          <div v-else-if="s.groups" class="groups">
            <section v-for="g in s.groups" :key="g.name" class="group">
              <h3>{{ g.name }}</h3>
              <ul>
                <li v-for="item in g.items" :key="item">{{ item }}</li>
              </ul>
            </section>
          </div>
        </Pillar>

        <section id="elsewhere" class="pillar-end" aria-labelledby="elsewhere-label" :style="{ '--i': sections.length + 1 }">
          <h2 id="elsewhere-label" class="end-label">Elsewhere</h2>
          <div class="end-box">
            <span class="end-circle" aria-hidden="true" />
            <a class="end-link end-link--a" :href="profile.links[0].href" target="_blank" rel="noopener">{{ profile.links[0].label }}<ArrowOut /></a>
            <a class="end-link end-link--b" :href="profile.links[1].href" target="_blank" rel="noopener">{{ profile.links[1].label }}<ArrowOut /></a>
            <p class="end-note">© 2026 {{ profile.name }}</p>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ---------- Intro column ---------- */
.intro {
  padding: 40px 20px 8px;
}

.name {
  font-size: clamp(2.25rem, 1.6rem + 3vw, 3rem);
  font-weight: 520;
  font-stretch: 104%;
  line-height: 1;
  letter-spacing: -0.035em;
  color: var(--ink);
}

.role {
  margin-top: 14px;
  max-width: 28ch;
  font-size: 1.0625rem;
  line-height: 1.45;
  color: var(--text);
}

.status {
  margin-top: 6px;
  font-size: 0.875rem;
  color: var(--quiet);
}

/* ---------- About card ---------- */
.about-circle {
  position: absolute;
  top: 0;
  left: 34%;
  height: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--ash);
}

.statement {
  position: relative;
  font-size: clamp(1.75rem, 1.1rem + 3.4vw, 2.5rem);
  font-weight: 480;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: var(--ink);
  text-wrap: balance;
}

.nav ul,
.links {
  list-style: none;
  padding: 0;
}

.nav {
  margin-top: 32px;
}

.nav ul {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
}

.nav a {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  font-size: 1rem;
  font-weight: 520;
  text-decoration: none;
  color: var(--charcoal);
  transition: color 200ms, translate 320ms var(--ease-out);
}

.nav a:hover {
  color: var(--mahogany);
}

.links {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}

.links a {
  font-size: 1rem;
  font-weight: 560;
  color: var(--ink);
}

/* ---------- Stage (phones: stacked pillars) ---------- */
.stage {
  min-width: 0;
}

.track {
  display: flex;
  flex-direction: column;
  gap: 48px;
  padding: 40px 16px 56px;
}

.track:focus-visible {
  outline-offset: -2px;
}

.groups {
  display: grid;
  gap: 32px;
}

.group h3 {
  font-size: 1.0625rem;
  font-weight: 640;
  color: var(--ink);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule);
}

.group ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 12px;
  padding: 0;
  list-style: none;
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text);
}

/* Closing pillar */
.end-label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  color: var(--granite);
  padding-bottom: 14px;
}

.end-box {
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  row-gap: 24px;
  padding: 28px;
  background: var(--pillar);
  overflow: clip;
}

.end-circle {
  grid-row: 2;
  align-self: center;
  justify-self: center;
  width: min(48%, 200px);
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--mahogany);
}

.end-link {
  font-size: clamp(2.25rem, 1.6rem + 3vw, 3rem);
  font-weight: 520;
  font-stretch: 110%;
  letter-spacing: -0.035em;
  line-height: 1;
  color: var(--ink);
  text-decoration: none;
}

.end-link:hover,
.end-link:focus-visible {
  text-decoration: underline;
  text-decoration-thickness: 2px;
}

.end-link--a {
  grid-row: 1;
  justify-self: start;
}

.end-link--b {
  grid-row: 3;
  justify-self: end;
}

.end-note {
  grid-row: 4;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  color: var(--quiet);
}

/* ---------- Desktop: fixed intro + sideways pillar row ---------- */
@media (min-width: 960px) and (min-height: 560px) {
  .home {
    display: grid;
    grid-template-columns: clamp(340px, 30vw, 480px) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
  }

  .intro {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: clamp(40px, 7dvh, 72px) 40px 40px clamp(32px, 3.6vw, 56px);
    container-type: inline-size;
  }

  .name {
    font-size: 14cqi;
    line-height: 0.98;
  }

  .statement {
    font-size: 11.2cqi;
    line-height: 1.02;
    letter-spacing: -0.035em;
    text-wrap: initial;
  }

  .sline {
    display: block;
    white-space: nowrap;
  }

  .sline:nth-child(even) {
    padding-left: 0.9em;
  }

  .nav {
    margin-top: auto;
    padding-top: 32px;
  }

  .nav ul {
    flex-direction: column;
    gap: 0;
  }

  .nav a {
    font-size: 1.0625rem;
    min-height: 34px;
  }

  .nav a::before {
    content: '';
    position: absolute;
    left: -18px;
    top: 50%;
    width: 8px;
    height: 8px;
    margin-top: -4px;
    border-radius: 50%;
    background: var(--mahogany);
    scale: 0;
    transition: scale 360ms var(--ease-out);
  }

  .nav a.is-active {
    color: var(--mahogany);
    translate: 4px 0;
  }

  .nav a.is-active::before {
    scale: 1;
  }

  .links {
    margin-top: 28px;
  }

  /* Top padding matches the intro, so the pillar labels line up with the name. */
  .stage {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: clamp(40px, 7dvh, 72px);
  }

  .track {
    position: relative;
    flex: 1;
    min-height: 0;
    flex-direction: row;
    gap: clamp(20px, 2vw, 32px);
    padding: 0 40px clamp(32px, 6dvh, 64px) 0;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
  }

  .track::-webkit-scrollbar {
    display: none;
  }

  .groups {
    gap: 36px;
  }

  .pillar-end {
    display: flex;
    flex-direction: column;
    flex: none;
    width: clamp(320px, 28vw, 460px);
    height: 100%;
    scroll-snap-align: end;
  }

  .end-box {
    flex: 1;
    min-height: 0;
    padding: clamp(24px, 2.4vw, 36px);
  }

  .end-circle {
    width: min(62%, 34dvh);
  }

  .intro {
    overflow-y: auto;
    scrollbar-width: none;
  }

  html.is-entering .sline {
    animation: line-in 900ms var(--ease-out) backwards;
    animation-delay: calc(var(--l) * 45ms);
  }

  html.is-entering .end-box {
    animation: end-rise 1100ms var(--ease-out) backwards;
    animation-delay: calc(240ms + var(--i) * 90ms);
  }
}

@keyframes line-in {
  from { opacity: 0; translate: 0 0.35em; filter: blur(4px); }
  to { opacity: 1; translate: 0 0; filter: blur(0); }
}

@keyframes end-rise {
  from { clip-path: inset(100% 0 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
</style>
