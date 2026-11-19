<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Pillar from '../components/Pillar.vue'
import PillarEntry from '../components/PillarEntry.vue'
import ArrowOut from '../components/ArrowOut.vue'
import SectionMenu from '../components/SectionMenu.vue'
import { profile, sections } from '../content.js'

// Navigation follows the pillars, About first.
const navItems = sections.map(({ id, label }) => ({ id, label }))

const root = ref(null)
const track = ref(null)
const active = ref(navItems[0].id)

const desktop = window.matchMedia('(min-width: 960px) and (min-height: 560px)')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

let frame = 0

function measure() {
  frame = 0
  const el = track.value
  if (!el) return

  // Stacked: the last section whose top has passed a third of the screen.
  if (!desktop.matches) {
    let current = navItems[0].id
    for (const n of navItems) {
      const node = document.getElementById(n.id)
      if (node && node.getBoundingClientRect().top <= window.innerHeight * 0.34) current = n.id
    }
    active.value = current
    return
  }

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

// From the section menu: travel there and move focus to the section, so keyboard users land in it.
function onNav(id) {
  scrollToSection(id)
  history.replaceState(null, '', `#${id}`)
  document.querySelector(`#${id} [data-pillar-scroll]`)?.focus({ preventScroll: true })
}

// ---------- Sideways travel (desktop) ----------
// The row has no CSS scroll snapping: browsers re-snap programmatic scrolls, which undid every wheel
// step. Instead the wheel glides the row, and settle() eases it onto a nearby pillar edge afterwards.
let glide = 0
let glideTarget = null
let glideTime = 0
let lastLeft = 0
let lastDir = 0
let settleTimer = 0

function maxLeft(el) {
  return el.scrollWidth - el.clientWidth
}

function glideTo(left) {
  const el = track.value
  glideTarget = Math.min(maxLeft(el), Math.max(0, left))
  if (reducedMotion.matches) {
    el.scrollLeft = glideTarget
    glideTarget = null
  } else if (!glide) {
    glideTime = performance.now()
    glide = requestAnimationFrame(glideStep)
  }
}

// Closes about a fifth of the gap per 60Hz frame (scaled by elapsed time, so any refresh rate moves
// at the same speed), with a 1px floor so it always arrives.
function glideStep(now) {
  glide = 0
  const el = track.value
  if (!el || glideTarget === null) return
  const d = glideTarget - el.scrollLeft
  if (Math.abs(d) < 1) {
    el.scrollLeft = glideTarget
    glideTarget = null
    return
  }
  const share = 1 - 0.78 ** (Math.max(1, now - glideTime) / 16.7)
  glideTime = now
  el.scrollLeft += Math.sign(d) * Math.max(1, Math.abs(d) * share)
  glide = requestAnimationFrame(glideStep)
}

function travel(delta) {
  lastDir = Math.sign(delta) || lastDir
  glideTo((glideTarget ?? track.value.scrollLeft) + delta)
}

// Once the row comes to rest, ease onto the next pillar edge in the direction of travel if one is
// close; a small scroll is never pulled back.
function settle() {
  const el = track.value
  if (!el || !desktop.matches || reducedMotion.matches || glideTarget !== null || !lastDir) return
  const left = el.scrollLeft
  const max = maxLeft(el)
  const edges = [...el.children].map((node) => Math.min(node.offsetLeft, max)).concat(max)
  const ahead = edges.filter((x) => (lastDir > 0 ? x > left + 1 : x < left - 1))
  if (!ahead.length) return
  const next = lastDir > 0 ? Math.min(...ahead) : Math.max(...ahead)
  if (Math.abs(next - left) <= el.clientWidth * 0.15) glideTo(next)
}

function onTrackScroll() {
  const el = track.value
  const dir = Math.sign(el.scrollLeft - lastLeft)
  if (dir) lastDir = dir
  lastLeft = el.scrollLeft
  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(settle, 150)
  schedule()
}

// A pillar takes the wheel only while it's fully on screen and still has text to scroll that way.
function readsDown(scroller, dy) {
  const b = scroller.getBoundingClientRect()
  const t = track.value.getBoundingClientRect()
  if (b.left < t.left - 2 || b.right > t.right + 2) return false
  if (dy > 0) return scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1
  return scroller.scrollTop > 0
}

// A vertical wheel reads a fully visible pillar down first, then carries on sideways. Horizontal input
// (trackpad swipes, Shift+wheel) scrolls the row natively over the row, and is passed to it elsewhere.
function onWheel(e) {
  if (!desktop.matches || e.ctrlKey || !track.value || (!e.deltaX && !e.deltaY)) return
  const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? track.value.clientWidth : 1
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    glideTarget = null
    if (track.value.contains(e.target)) return
    e.preventDefault()
    track.value.scrollLeft += e.deltaX * unit
    return
  }
  const scroller = e.target.closest?.('[data-pillar-scroll]')
  if (scroller && readsDown(scroller, e.deltaY)) return
  e.preventDefault()
  travel(e.deltaY * unit)
}

// Left and right arrows step between pillars when focus isn't inside one.
function onKey(e) {
  if (!desktop.matches || e.altKey || e.metaKey || e.ctrlKey) return
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  const target = e.target
  if (target?.closest?.('input, textarea, select, [contenteditable="true"], [data-menu]')) return
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
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  desktop.addEventListener('change', schedule)
  const id = decodeURIComponent(location.hash.slice(1))
  if (id && document.getElementById(id)) requestAnimationFrame(() => scrollToSection(id, false))
  schedule()
})

onBeforeUnmount(() => {
  root.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  desktop.removeEventListener('change', schedule)
  if (frame) cancelAnimationFrame(frame)
  if (glide) cancelAnimationFrame(glide)
  window.clearTimeout(settleTimer)
  window.clearTimeout(enterTimer)
  document.documentElement.classList.remove('is-entering')
})
</script>

<template>
  <div ref="root" class="home">
    <a class="skip-link" href="#projects">Skip to projects</a>
    <SectionMenu :items="navItems" :active="active" :links="profile.links" @navigate="onNav" />

    <header class="intro">
      <h1 class="name">{{ profile.name }}</h1>
      <p class="role">{{ profile.role }}</p>
      <p class="status">{{ profile.status }}</p>

      <!-- Desktop: the sections, listed permanently (phones get the menu button instead). -->
      <nav class="side-nav" aria-label="Sections">
        <ul>
          <li v-for="n in navItems" :key="n.id">
            <a
              :href="`#${n.id}`"
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
        @scroll.passive="onTrackScroll"
      >
        <Pillar
          v-for="(s, i) in sections"
          :id="s.id"
          :key="s.id"
          :label="s.label"
          :word="s.word"
          :cover="s.cover"
          :width="s.width"
          :tone="s.tone"
          :index="i"
        >
          <div v-if="s.text" class="about-text">
            <p v-for="(para, j) in s.text" :key="j">{{ para }}</p>
          </div>

          <template v-else-if="s.entries">
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
          <h2 id="elsewhere-label" class="sr-only">Elsewhere</h2>
          <div class="end-box">
            <span class="end-circle" aria-hidden="true" />
            <a class="end-link end-link--a" :href="profile.links[0].href" target="_blank" rel="noopener">{{ profile.links[0].label }}<ArrowOut /></a>
            <a class="end-link end-link--b" :href="profile.links[1].href" target="_blank" rel="noopener">{{ profile.links[1].label }}<ArrowOut /></a>
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
  /* Stacked, the name stays clear of the fixed menu button in the top-right corner. */
  margin-right: 56px;
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
.about-text p {
  max-width: 34ch;
  font-size: clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem);
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: var(--ink);
  text-wrap: pretty;
}

.about-text p + p {
  margin-top: 0.8em;
}

.links {
  list-style: none;
  padding: 0;
}

.side-nav {
  display: none;
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
.end-box {
  display: grid;
  grid-template-rows: auto 1fr auto;
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
    margin-right: 0;
    font-size: 14cqi;
    line-height: 0.98;
  }

  /* The sections, set like the menu's list in the intro's spare height, just above the outbound links. */
  .side-nav {
    display: block;
    margin-top: auto;
    padding-top: 32px;
  }

  .side-nav ul {
    display: grid;
    gap: 2px;
    padding: 0;
    list-style: none;
  }

  .side-nav a {
    position: relative;
    display: inline-block;
    padding: 3px 0;
    font-size: 9cqi;
    font-weight: 520;
    font-stretch: 110%;
    letter-spacing: -0.03em;
    line-height: 1.08;
    color: var(--text);
    text-decoration: none;
    transition: color 200ms, translate 320ms var(--ease-out);
  }

  .side-nav a:hover,
  .side-nav a:focus-visible {
    color: var(--ink);
    text-decoration: underline;
    text-decoration-thickness: 2px;
    text-underline-offset: 0.16em;
  }

  /* The current section: mahogany, nudged right, with the site's 8px dot. */
  .side-nav a[aria-current='true'] {
    color: var(--ink);
    translate: 4px 0;
  }

  .side-nav a::before {
    content: '';
    position: absolute;
    left: -22px;
    top: 50%;
    width: 8px;
    height: 8px;
    margin-top: -4px;
    border-radius: 50%;
    background: var(--mahogany);
    scale: 0;
    transition: scale 360ms var(--ease-out);
  }

  .side-nav a[aria-current='true']::before {
    scale: 1;
  }

  .links {
    margin-top: 28px;
  }

  /* Top padding matches the intro, so the pillar tops line up with the name. */
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

  html.is-entering .end-box {
    animation: end-rise 1100ms var(--ease-out) backwards;
    animation-delay: calc(240ms + var(--i) * 90ms);
  }
}

@keyframes end-rise {
  from { clip-path: inset(100% 0 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
</style>
