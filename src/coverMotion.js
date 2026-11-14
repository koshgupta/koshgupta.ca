// Scroll-linked motion for the pillar covers.
// One rAF-throttled pass writes each cover's --k: its progress through the view, where 0 shows the
// start of the word and 1 shows its end. PillarCover's CSS turns that into the word's slide and the
// circle's drift, so the geometry stays in one place and the static composition is the fallback.

const covers = new Set()
const desktop = window.matchMedia('(min-width: 960px) and (min-height: 560px)')
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

let frame = 0
let listening = false

// Linear through [0, 1] so the slide tracks the scroll exactly; past either end it eases into a
// short overshoot instead of running the word off the card.
const OVERSHOOT = 0.14
function soften(u) {
  if (u < 0) return -OVERSHOOT * (1 - Math.exp(u / OVERSHOOT))
  if (u > 1) return 1 + OVERSHOOT * (1 - Math.exp((1 - u) / OVERSHOOT))
  return u
}

function progress(el) {
  const r = el.getBoundingClientRect()
  if (!r.width || !r.height) return 0.5

  if (desktop.matches) {
    // Sideways row: 0 once the pillar is fully in from the right, 0.5 when it reaches the left edge.
    // Scrolling down inside the pillar carries on toward 1 as the cover leaves the top.
    const track = el.closest('[data-track]')
    const box = el.closest('[data-pillar-scroll]')
    if (!track) return 0.5
    const t = track.getBoundingClientRect()
    const across = (t.right - r.right) / Math.max(t.width - r.width, r.width / 2)
    const down = box ? box.scrollTop / r.height : 0
    return across * 0.5 + down * 0.5
  }

  // Stacked pages: 0 once the cover is fully in from the bottom, 1 when it reaches the top.
  const vh = window.innerHeight
  return (vh - r.bottom) / Math.max(vh - r.height, r.height / 2)
}

function update() {
  frame = 0
  for (const el of covers) {
    const k = soften(progress(el)).toFixed(4)
    if (el.style.getPropertyValue('--k') !== k) el.style.setProperty('--k', k)
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update)
}

function start() {
  if (listening || !covers.size || reduced.matches) return
  listening = true
  // Scroll events don't bubble; capturing on the document catches the page, the track and every pillar.
  document.addEventListener('scroll', schedule, { capture: true, passive: true })
  window.addEventListener('resize', schedule)
  desktop.addEventListener('change', schedule)
  schedule()
}

function stop() {
  if (!listening) return
  listening = false
  document.removeEventListener('scroll', schedule, { capture: true })
  window.removeEventListener('resize', schedule)
  desktop.removeEventListener('change', schedule)
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

reduced.addEventListener('change', () => {
  for (const el of covers) el.classList.toggle('is-live', !reduced.matches)
  if (reduced.matches) stop()
  else start()
})

// Registers a cover; returns the matching cleanup.
export function trackCover(el) {
  covers.add(el)
  el.classList.toggle('is-live', !reduced.matches)
  start()
  if (listening) schedule()
  return () => {
    covers.delete(el)
    el.classList.remove('is-live')
    el.style.removeProperty('--k')
    if (!covers.size) stop()
  }
}
