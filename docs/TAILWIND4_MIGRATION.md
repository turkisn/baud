# Tailwind 4 migration — local acceptance evidence

This follow-up removes the final build-chain advisory using official `tailwindcss@4.3.3` and `@tailwindcss/vite@4.3.3`. Full and production-only npm audits both report **zero vulnerabilities** after a clean `npm ci`. No dependency aliases, advisory suppression, frozen generated stylesheet, or replacement glob libraries were used.

## Design preservation

- The Vite plugin replaces the old inline PostCSS integration. Obsolete Autoprefixer/direct PostCSS dependencies, selector-parser override, unused `postcss.config.js`, and the conflicting unused `tailwind.config.js` are removed. The actual `tailwind.config.cjs` brand theme remains through Tailwind's supported `@config` bridge, including Cairo/Tajawal/DM Sans, SVG patterns, animations and shadows.
- Explicit `@source` directives scan only the HTML/application source. Inline safelists preserve brand utility families; source detection generates used opacity variants without emitting thousands of unused combinations.
- Documented utility renames preserve blur, outline, rounding, shadow and flex behavior. Gradients explicitly interpolate in sRGB. `tailwind-compat.css` retains v3 status colors, border/placeholder defaults and button cursor behavior.
- Native layer placement keeps the reset below components and utilities. Custom application rules retain their specificity/source ordering with generated utilities.
- The first comparison found six differences out of 80: responsive hero line-height and the gold shadow. Explicit responsive leading restores the original hero height. The gold token preserves the opaque shadow previously caused by the v3 shadow/color-name collision. The second comparison passed all 80 unchanged baselines; no baseline was reaccepted to hide a regression.
- Native v4 `space-y` uses the preceding child's bottom margin rather than the next child's top margin. Recorded margins therefore differ, while the captured layouts match. Login geometry recorded before screenshot fast-forward can vary below one pixel during Framer entry animations. No new horizontal overflow was observed.
- The real IFC-derived GLB, its attribution, checksum pins and source references are unchanged. Supplier self-service remains deferred.

## Verification

Runtime: existing standalone Node 24.19.0. Browser: installed Google Chrome 154.0.8037.99, local compiled Vite preview. Browser network/account data are synthetic; no real account or Supabase state was changed.

| Check | Result / evidence |
|---|---|
| Clean lockfile install | Pass, `evidence/tailwind4-clean-install.log` |
| Full dependency audit | 0 findings, `evidence/tailwind4-audit-full.json` |
| Production dependency audit | 0 findings, `evidence/tailwind4-audit-production.json` |
| Installed advisory chain | Removed, `evidence/tailwind4-dependency-tree.log` |
| ESLint | Pass, zero errors/warnings |
| Unit suite | 71 passed, 0 failed/skipped |
| Compiled production build and budgets | Pass, `evidence/tailwind4-check.log` |
| Route/interaction visual comparison | 80 passed, `evidence/tailwind4-visual.log` |
| Full compiled browser acceptance suite | 55 passed (1.8m), `evidence/tailwind4-browser.log` |
| SQL | Unchanged; not rerun for this CSS/dependency migration. Previous 57 migration replays, 3 SQL suites and 5 native concurrency cases remain recorded in the launch ledger. |

The 80 visuals comprise all 18 mounted pages × English/Arabic × desktop 1440×1000/mobile 390×844, plus product editor focus and reduced-motion real WebGL demo dialogs in all four language/viewport combinations. Admin pages use a synthetic admin; the functional suite separately checks admin, super_admin, reviewer, designer/user and supplier-classification boundaries. Screenshot comparison uses Playwright's normal pixel threshold and a maximum differing-pixel ratio of 0.002 (0.2%); it is not a claim of byte-identical rendering. Font requests are blocked for both visual revisions to ensure the same system fallback; external Google Fonts delivery is outside this visual assertion.

A compiled stylesheet and resolved v3 theme were captured before changes. Compiled CSS falls from 369,541 bytes / 44,305 gzip to 146,125 bytes / 25,817 gzip, measured consistently with Node zlib default compression. A new 30 kB gzip CSS budget prevents accidental safelist growth. Existing JS ceilings remain unchanged: entry 155 kB, viewer 165 kB, all JS 490 kB gzip. Real 3D stays lazy-loaded.

Local review bundle: `/Users/macbook/Documents/Codex/2026-10-12/task/tailwind-visual/`. Baseline PNGs are in `baseline/`; compiled v3 CSS and resolved theme, computed geometry before/after, first failed comparison and final metrics are retained. A portable baseline ZIP accompanies the final handoff outside Git to avoid adding 27 MB of test binaries to source history. Representative verified post-migration screenshots are in `docs/evidence/`.

Run future comparisons against that baseline:

```sh
BUOD_BROWSER_FIXTURES=1 \
BUOD_VISUAL_BASELINE=/absolute/path/to/tailwind-visual/baseline \
npm run test:visual
```

Capture a new baseline only following explicit visual review (`--update-snapshots`), never simply to silence a failure. The visual config requires an absolute baseline directory and synthetic fixtures, and rejects remote preview URLs. The normal browser suite remains `BUOD_BROWSER_FIXTURES=1 npm run test:browser`.

## Compatibility and acceptance limits

Official minimums increase to **Safari 16.4, Chrome 111, Firefox 128**. Older browsers are unsupported by Tailwind 4. This local run tested Chrome 154 only; it does not certify minimum-version engines, iOS/WebKit, Firefox, screen-reader output, OS forced-colors mode or external font delivery. No feature/design was intentionally removed to complete the migration. Maintaining older browser support would require a separate product decision and likely retaining Tailwind 3 until an official compatible security fix exists.

Remaining locally testable acceptance gaps, separate from live authorization:

- Cross-engine/minimum-version visual and interaction checks require suitable browser runtimes. Safari automation was not configured or tested; no browser/security settings were changed. Chrome fixture coverage does not substitute for those checks.
- A full screen-reader/forced-colors audit and a deterministic font-loaded visual baseline are additional acceptance work, not results claimed by this run.
- Visual fixtures use representative public and mostly empty administrative data. Functional regressions exercise selected populated states, but do not exhaust every category hierarchy, long translation, asset-error combination and archive/delete sequence. The current tests should not be described as exhaustive proof of every possible journey.

External/operator gates (unchanged): approve and run synthetic staging Auth/Storage/API lifecycle checks; review/apply the pending SQL before frontend rollout; verify actual catalog rights/assets/supplier status and current PostgreSQL-version parity; supply/validate production backend, domains, SMTP, support/operator and legal facts. Live account mutations, protected-preview authorization, migration application, push, draft PR and deployment remain separately authorized actions. No push, PR, deployment or live mutation occurred in this follow-up.

## Official references

- [Upgrade guide: utility changes, JavaScript configuration and browser minimums](https://tailwindcss.com/docs/upgrade-guide)
- [Official Vite installation](https://tailwindcss.com/docs/installation/using-vite)
- [Source detection and inline safelists](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Browser compatibility](https://tailwindcss.com/docs/compatibility)
