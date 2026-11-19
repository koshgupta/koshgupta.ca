<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ArrowOut from './ArrowOut.vue'

const props = defineProps({
  // [{ id, label }], in page order
  items: { type: Array, required: true },
  active: { type: String, default: '' },
  // Outbound profiles, [{ label, href }], listed under the sections
  links: { type: Array, default: () => [] },
})

const emit = defineEmits(['navigate'])

const open = ref(false)
const toggleEl = ref(null)
const panelEl = ref(null)

function links() {
  return [...(panelEl.value?.querySelectorAll('a') ?? [])]
}

async function show() {
  open.value = true
  await nextTick()
  const current = links().find((a) => a.getAttribute('aria-current') === 'true')
  ;(current ?? links()[0])?.focus({ preventScroll: true })
}

function close(returnFocus = false) {
  open.value = false
  if (returnFocus) toggleEl.value?.focus()
}

function toggle() {
  if (open.value) close()
  else show()
}

function choose(id) {
  close()
  emit('navigate', id)
}

const inside = (node) => panelEl.value?.contains(node) || toggleEl.value?.contains(node)

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close(true)
    return
  }
  // Up and down step through the sections while focus is in the menu.
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && panelEl.value?.contains(document.activeElement)) {
    e.preventDefault()
    const all = links()
    const i = all.indexOf(document.activeElement)
    const next = e.key === 'ArrowDown' ? Math.min(all.length - 1, i + 1) : Math.max(0, i - 1)
    all[next]?.focus()
  }
}

function onPointerDown(e) {
  if (!inside(e.target)) close()
}

// Tabbing out of the menu closes it.
function onFocusOut(e) {
  if (e.relatedTarget && !inside(e.relatedTarget)) close()
}

function listen(on) {
  const method = on ? 'addEventListener' : 'removeEventListener'
  document[method]('keydown', onKeydown)
  document[method]('pointerdown', onPointerDown)
}

// Desktop lists the sections in the intro instead; if the window widens while the menu is open, close it.
const desktop = window.matchMedia('(min-width: 960px) and (min-height: 560px)')
function onLayout() {
  if (desktop.matches) close()
}

watch(open, listen)
onMounted(() => desktop.addEventListener('change', onLayout))
onBeforeUnmount(() => {
  desktop.removeEventListener('change', onLayout)
  listen(false)
})
</script>

<template>
  <!-- display: contents, so the fixed button and panel never take a cell in the page grid. -->
  <div class="section-menu">
    <button
      ref="toggleEl"
      type="button"
      class="toggle"
      :class="{ 'is-open': open }"
      aria-label="Sections"
      aria-controls="section-menu"
      :aria-expanded="open ? 'true' : 'false'"
      @click="toggle"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
        <path class="bar bar--top" d="M3 4.5h10" />
        <path class="bar bar--mid" d="M3 8h10" />
        <path class="bar bar--bottom" d="M3 11.5h10" />
      </svg>
    </button>

    <Transition name="menu">
      <nav
        v-show="open"
        id="section-menu"
        ref="panelEl"
        class="panel"
        data-menu
        aria-label="Sections"
        @focusout="onFocusOut"
      >
        <span class="panel-art" aria-hidden="true"><span class="panel-circle" /></span>
        <p class="panel-label" aria-hidden="true">Sections</p>
        <ul class="sections">
          <li v-for="(item, i) in props.items" :key="item.id" :style="{ '--i': i }">
            <a
              :href="`#${item.id}`"
              :aria-current="props.active === item.id ? 'true' : undefined"
              @click.prevent="choose(item.id)"
            >{{ item.label }}</a>
          </li>
        </ul>
        <ul v-if="props.links.length" class="out">
          <li v-for="(link, j) in props.links" :key="link.href" :style="{ '--i': props.items.length + j }">
            <a :href="link.href" target="_blank" rel="noopener" @click="close()">{{ link.label }}<ArrowOut /></a>
          </li>
        </ul>
      </nav>
    </Transition>
  </div>
</template>

<style scoped>
/* Placement: phones and short windows only, fixed in the top-right corner. */
.section-menu {
  display: contents;
  --menu-size: 44px;
  --menu-top: 16px;
  --menu-right: 16px;
  --menu-centre: calc(100% - var(--menu-right) - var(--menu-size) / 2) calc(var(--menu-top) + var(--menu-size) / 2);
}

/* ---------- The button: a mahogany circle with three square-capped lines ---------- */
.toggle {
  position: fixed;
  z-index: 21;
  top: var(--menu-top);
  right: var(--menu-right);
  display: grid;
  place-items: center;
  width: var(--menu-size);
  height: var(--menu-size);
  padding: 0;
  /* A sand ring keeps it distinct when it floats over mahogany ink on phones; on the ground it vanishes. */
  border: 2px solid var(--sand);
  border-radius: 50%;
  background: var(--mahogany);
  color: var(--sand);
  cursor: pointer;
}

.toggle svg {
  width: 18px;
  height: 18px;
  overflow: visible;
}

.bar {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: square;
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 360ms var(--ease-out), opacity 200ms;
}

.toggle:hover:not(.is-open) .bar--mid {
  transform: scaleX(0.6);
}

/* Open: the outer lines cross into an X. */
.is-open .bar--top {
  transform: translateY(3.5px) rotate(45deg);
}

.is-open .bar--mid {
  opacity: 0;
}

.is-open .bar--bottom {
  transform: translateY(-3.5px) rotate(-45deg);
}

.toggle.is-open:focus-visible {
  outline-color: var(--sand);
}

/* ---------- The panel: a flat mahogany sheet that grows out of the button ---------- */
.panel {
  position: fixed;
  z-index: 20;
  top: 0;
  right: 0;
  width: min(100vw, 440px);
  max-height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
  padding: calc(var(--menu-top) + var(--menu-size) + 28px) calc(var(--menu-right) + 8px) 48px 44px;
  background: var(--mahogany);
  color: var(--sand);
  clip-path: circle(760px at var(--menu-centre));
}

.panel-art {
  position: absolute;
  inset: 0;
  overflow: clip;
  pointer-events: none;
}

.panel-circle {
  position: absolute;
  right: -96px;
  bottom: -132px;
  width: 300px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--granite);
}

.panel-label {
  position: absolute;
  top: var(--menu-top);
  left: 44px;
  display: flex;
  align-items: center;
  height: var(--menu-size);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  color: var(--ash);
}

.panel ul {
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
}

.panel .sections {
  display: grid;
  gap: 2px;
}

.panel li {
  transition: opacity 300ms, translate 420ms var(--ease-out);
}

.sections a {
  position: relative;
  display: inline-block;
  padding: 4px 0;
  font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.375rem);
  font-weight: 520;
  font-stretch: 110%;
  letter-spacing: -0.03em;
  line-height: 1.08;
  color: var(--sand);
  text-decoration: none;
}

.sections a:hover,
.sections a:focus-visible {
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.16em;
}

.panel a:focus-visible {
  outline-color: var(--sand);
}

/* The current section: the site's 8px dot, in sand. */
.sections a[aria-current='true']::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 50%;
  width: 8px;
  height: 8px;
  margin-top: -4px;
  border-radius: 50%;
  background: var(--sand);
}

/* Outbound profiles: the intro's links, set in sand below a hairline. */
.panel .out {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid color-mix(in srgb, var(--sand) 28%, transparent);
}

.out a {
  display: inline-flex;
  align-items: baseline;
  min-height: 32px;
  font-size: 1.0625rem;
  font-weight: 560;
  color: var(--sand);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.22em;
}

.out a:hover {
  text-decoration-thickness: 2px;
}

/* Desktop lists the sections permanently in the intro column (HomeView), so the menu steps aside. */
@media (min-width: 960px) and (min-height: 560px) {
  .toggle,
  .panel {
    display: none;
  }
}

/* ---------- Open and close ---------- */
.menu-enter-active {
  transition: clip-path 560ms var(--ease-out);
}

.menu-leave-active {
  transition: clip-path 300ms cubic-bezier(0.4, 0, 1, 1);
}

.menu-enter-from,
.menu-leave-to {
  clip-path: circle(calc(var(--menu-size) / 2) at var(--menu-centre));
}

.menu-enter-active li {
  transition-delay: calc(80ms + var(--i) * 35ms);
}

.menu-enter-from li {
  opacity: 0;
  translate: 0 0.4em;
}
</style>
