<template>
  <svg class="arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
  </svg>
</template>

<style scoped>
.arrow {
  display: inline-block;
  width: 0.72em;
  height: 0.72em;
  vertical-align: 0.02em;
  margin-left: 0.18em;
  transition: translate 280ms var(--ease-out);
}

a:hover .arrow,
a:focus-visible .arrow {
  translate: 0.12em -0.12em;
}
</style>
