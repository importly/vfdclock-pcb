# pcbjs Windows fixes (local patches for a PR)

`pcbjs-windows-fixes.patch` patches `@pcbjs/cli` 0.0.1-beta.1 (`node_modules/@pcbjs/cli/dist`).
It was found and tested on Windows 11 with Node 22 and VS Code + `pcbjs.vscode-pcbjs` 0.0.1001 (pre-release).

`npm install` puts the stock files back. To re-apply, run this from `C:\dev\vfdclock\pcb`:

```
git apply --whitespace=nowarn patches/pcbjs-windows-fixes.patch
```

The dist files use CRLF line endings here, and so does the patch. `git apply` copes with that; GNU `patch` may refuse it.

## Root cause

On Windows a path can be spelled three ways, and pcbjs compares them as plain strings:

- **VS Code** passes the workspace as `c:\dev\...`, with a lowercase drive letter.
- **Node's `fs.realpathSync`** (the JS version) keeps that spelling.
- **Vite** names module files `C:/dev/...`: forward slashes, with the drive letter canonicalised by `realpathSync.native`.
- **pcbjs** keeps its roots, scope directories and entry files with backslashes.

So every `startsWith`, `===` and `Set.has` between a Vite path and a pcbjs path fails.

The fixes:
- Canonicalise paths the way Vite does (`realpathSync.native`).
- Compare with a normaliser: forward slashes, lower case on win32, a no-op elsewhere.

## The bugs, and where to fix them in the source

The source paths below are the TypeScript files that compile to these dist files; check them in the repo.

| # | Symptom on Windows | dist file, fix |
|---|---|---|
| 1 | Viewer never updates on save: edits to `pcb.tsx` and its imports don't recompile | `boards.js` `entriesReaching` / `focusTarget`: entry files (backslashes) never match Vite's `ModuleNode.file` (forward slashes), so no slot counts as affected. Compare through a normaliser. |
| 2 | Same, in workspace mode (the VS Code extension's server) | `workspace.js`: `realpathSync` became `realpathSync.native`, so the scope roots match Vite's spelling (uppercase drive). `plugin.js`: the same for editor-given paths (3 spots), plus `inProject`, `hotUpdate` and `handleHotUpdate` compare with `under()` / `sameFile()`. `scopes.js` `scopeOf`: compare normalised. |
| 3 | Click a part, then "Could not open pcb.tsx in the editor … (code 9)" | `bridge.js` `allowed()`: `C:\…\pcb.tsx` vs root `c:\…` and `fs.allow` `c:/…` never matched, so `/__pcbjs/open` returned 404 and the viewer fell back to Vite's `/__open-in-editor`, where launch-editor fails. Compare resolved, case-insensitive paths. |
| 4 | Every KiCad/STEP model shows as an amber "no model" box in the VS Code panes; generated models are fine | `vite.js`: in workspace mode `modelsPlugin` gets the top-level `{ slots: [] }` state, so `/__pcbjs/model/<hash>` answers 404 for every file model. Pass a view over every scope's `state.slots` and `preview`. This one is not Windows-specific. |
| 5 | `pcbjs check` always prints `typecheck ok`, even with type errors | `typecheck.js` `inProject`: `f.startsWith(root + '/')` with a backslash root never matches TypeScript's forward-slash file names, so no project file is checked. Normalise both sides. With the fix, a probe file with a deliberate error reports 1 error. |

## How each fix was verified

| Bug | Check |
|---|---|
| 1, 2 | Edited `lib/pinout.ts` with the VS Code server running. `pcbjs inspect` reported "dev server … current, compiled 57 ms ago" 4 s later. Before the fix it stayed at the old compile indefinitely. |
| 2 | `/__pcbjs/scopes` now reports the root as `C:\dev\vfdclock\pcb`; before, it was `c:\…`. |
| 4 | `/__pcbjs/model/<DIP-20 hash>` returns 200 (71 KB); before, 404 "no such model". |
| 5 | `typecheck()` with a backslash root finds the error in a probe file. Before, it found none. |
| all | `pcbjs check` / `build` output unchanged: DRC 0, ERC 0. |
