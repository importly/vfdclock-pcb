import { defineConfig } from '@pcbjs/core'

// Project settings shared by every board in this directory. The board itself, its size, fab and parts, is in pcb.tsx.
export default defineConfig({
  entries: ['pcb.tsx'], // the boards; every pcbjs command reads them, globs such as 'boards/*.tsx' allowed
  base: '/vfdclock-pcb/',                       // GitHub Pages project site; only `pcbjs build` uses it, `pcbjs dev` stays at "/"
  repo: 'https://github.com/importly/vfdclock-pcb', // link the built site's items to their source lines
})
