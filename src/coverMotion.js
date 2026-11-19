// Scroll-linked spotlight for the pillar covers.
// One rAF-throttled pass writes each cover's --k: 0 where you first see the cover, 1 once you have
// scrolled to it. PillarCover's CSS slides the circle from the word's first letter (0) to its last (1);
// without --k the circle rests centred on the word.

const covers = new Set()
const desktop = window.matchMedia('(min-width: 960px) and (min-height: 560px)')
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

// A cover that starts (nearly) where it ends has nothing to scroll through, so it sweeps once on load.
const IN_PLACE = 0.25
const SWEEP_DELAY = 500
const SWEEP_MS = 1500
const sweeps = new WeakMap()

let frame = 0
let listening = false

const clamp01 = (n) => Math.min(1, Math.max(0, n))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// Progress from where the cover first appears to where it settles, or null if it starts in place.
// The start is wherever the cover sits with the page scrolled back to the beginning, if that's already
// on screen, so it adapts to the screen size and works out the same after a resize or a deep link.
// The end is its settling point, or as close as the scroll can bring it (the last pillars can't
// reach the left edge).
function span(from, at, end, usual) {
  if (from - end < usual * IN_PLACE) return null
  return clamp01((from - at) / (from - end))
}

function progress(el) {
  const r = el.getBoundingClientRect()

  if (desktop.matches) {
    // Sideways row: settles when the pillar's left edge reaches the left edge of the row.
    const track = el.closest('[data-track]')
    if (!track) return null
    const t = track.getBoundingClientRect()
    const x = r.left - t.left
    const x0 = x + track.scrollLeft
    const end = Math.max(0, x0 - (track.scrollWidth - track.clientWidth))
    return span(Math.min(t.width, x0), x, end, t.width)
  }

  // Stacked: starts once the word's midline is on screen, settles when the cover's top reaches the top.
  const usual = window.innerHeight - r.height / 2
  const y0 = r.top + window.scrollY
  const end = Math.max(0, y0 - (document.documentElement.scrollHeight - window.innerHeight))
  return span(Math.min(usual, y0), r.top, end, usual)
}

function sweep(el, now) {
  if (!sweeps.has(el)) sweeps.set(el, now + SWEEP_DELAY)
  const t = clamp01((now - sweeps.get(el)) / SWEEP_MS)
  return { k: easeInOut(t), done: t >= 1 }
}

function update() {
  frame = 0
  const now = performance.now()
  let sweeping = false
  for (const el of covers) {
    let k = progress(el)
    if (k === null) {
      const s = sweep(el, now)
      k = s.k
      if (!s.done) sweeping = true
    }
    const value = k.toFixed(4)
    if (el.style.getPropertyValue('--k') !== value) el.style.setProperty('--k', value)
  }
  if (sweeping) schedule()
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update)
}

// Scroll events don't bubble; capturing on the document catches the page and the track. Only those move
// a cover: scrolling a pillar's own text (or the intro column) leaves every cover where it was.
function onScroll(e) {
  const t = e.target
  if (t === document || t.hasAttribute?.('data-track')) schedule()
}

function start() {
  if (listening || !covers.size || reduced.matches) return
  listening = true
  document.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('resize', schedule)
  desktop.addEventListener('change', schedule)
  schedule()
}

function stop() {
  if (!listening) return
  listening = false
  document.removeEventListener('scroll', onScroll, { capture: true })
  window.removeEventListener('resize', schedule)
  desktop.removeEventListener('change', schedule)
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

reduced.addEventListener('change', () => {
  for (const el of covers) {
    el.classList.toggle('is-live', !reduced.matches)
    if (reduced.matches) el.style.removeProperty('--k')
  }
  if (reduced.matches) stop()
  else start()
})

// ---------- Word sizing ----------
// CSS sizes each cover's word to fit from --r, the word's width per unit of font size. That ratio is
// fixed for a given font, so it's measured once the covers mount and again whenever a word's box changes
// (the web font replacing the fallback, a resize). Every word is read before any ratio is written, so
// one layout serves them all.
// Text width doesn't scale exactly with font size: sub-pixel rounding moves the measured ratio by up to
// ~0.03%. Rewriting it each time resizes the word, which re-fires the observer, so the ratio would
// bounce forever with a layout every frame. A ratio within RATIO_TOLERANCE of the current one is kept.
const RATIO_TOLERANCE = 0.002
const coverOf = new WeakMap() // word → its cover
const unmeasured = new Set()
const resized = 'ResizeObserver' in window ? new ResizeObserver((entries) => fit(entries.map((e) => e.target))) : null

function fit(words) {
  const ratios = []
  for (const word of words) {
    const cover = coverOf.get(word)
    if (!cover) continue
    const size = parseFloat(getComputedStyle(word).fontSize)
    const width = word.getBoundingClientRect().width
    if (size > 0 && width > 0) ratios.push([cover, width / size])
  }
  let changed = false
  for (const [cover, ratio] of ratios) {
    const current = parseFloat(cover.style.getPropertyValue('--r')) // NaN until first measured
    if (Math.abs(ratio / current - 1) < RATIO_TOLERANCE) continue
    cover.style.setProperty('--r', ratio.toFixed(4))
    changed = true
  }
  // The covers may have moved with their words, so the spotlight catches up.
  if (changed && listening) schedule()
}

// Covers mount one after another; the first queues a single measurement for all of them.
function measureSoon(word) {
  if (!unmeasured.size) {
    queueMicrotask(() => {
      const words = [...unmeasured]
      unmeasured.clear()
      fit(words)
    })
  }
  unmeasured.add(word)
}

// Registers a cover and its word; returns the matching cleanup.
export function trackCover(el, word) {
  covers.add(el)
  el.classList.toggle('is-live', !reduced.matches)
  if (word) {
    coverOf.set(word, el)
    measureSoon(word)
    resized?.observe(word)
  }
  start()
  if (listening) schedule()
  return () => {
    covers.delete(el)
    el.classList.remove('is-live')
    el.style.removeProperty('--k')
    if (word) {
      resized?.unobserve(word)
      unmeasured.delete(word)
      coverOf.delete(word)
    }
    if (!covers.size) stop()
  }
}
