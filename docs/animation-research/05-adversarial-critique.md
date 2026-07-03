I verified every file:line pointer in the brief against the actual `app.js` (446 lines), `styles.css` (650 lines), `index.html`, and `menu.json`. Here is the adversarial review.

---

## Verification result: pointers are accurate

Every one of the ~35 file:line references I checked is correct — `GLASS` 21-50, mug handle subpath at 43, highball box at 31, `shape()` 96-152, tomato highlight at 110, `GARNISH_TOKENS` 155-184, `garnishList` 186-204, `SURFACE` at 207, `drinkStage` 238-243, `toggleCard` 379-391, `initReveal` 395-411 (unobserve at 405), `--tint/--surf` at 349-350; and in CSS `--ease` at 30, tabs `backdrop-filter` 180-181, `.glass .outline` 317-327, on-states 335-336, `.stage-glow` 443-457, `.hero-glass` 461-480, reduced-motion 631-645. The glass→drink groupings in §3 all match menu.json (4 coupe, 2 martini, 13 shot, 4 rocks, 3 highball, 1 mug, 3 plate). The "GSAP plugins now free / no build / UMD" claim is real as of GSAP 3.13. The data-driven / one-JSON-line discipline is genuinely preserved. This is a strong, unusually accurate brief. The gaps below are real but are refinements, not rewrites.

---

## MUST FIX IN THE DOC

**1. The brief fixes the HERO but barely addresses the THUMBNAILS — which is literally where "all 30 identical" is seen.**
There are **two** animation surfaces: the small line-art glass in every collapsed card head (`.glass`, 46×60, draws on `.revealed` during scroll — `styles.css:317-336`) and the big hero glass in the expanded pour-stage (draws on `.is-open` tap — `:461-480`). The client's core complaint ("identical for all 30, drawing in a circle") is the **scroll experience of 30 thumbnails**, since the hero only ever shows one at a time. The brief pours 90% of its detail into the hero and relegates the list to one line ("transform/DrawSVG only, ~0.9-1.5s"). **Correction:** state explicitly that the per-glass *directional* draw variety (martini converge, shot bottom-up, rocks drop-in, etc.) is applied to the **thumbnail** draw too (DrawSVG only, no canvas/filters — cheap, already within the scroll budget), otherwise the list still scrolls as 30 near-identical traces and the headline complaint is only half-solved.

**2. The mug/fizz "clumsy trace" still happens in the thumbnail.** Same root issue: the mug and highball thumbnails still draw-trace their outline (incl. the clumsy handle) on scroll-reveal, because the morph redesign is hero-only. The user sees the clumsy mug-handle trace while scrolling *before* ever tapping. **Correction:** specify the mug/highball **thumbnail** must not trace either — at minimum a fade/scale-in (or a mini blur-in) instead of the dashoffset draw, so the "no clumsy trace" promise holds in the list, not only in the hero.

**3. Several prescribed draw directions are impossible on the current single-path geometry without splitting paths — which §9 forbids.** The martini "two rim points converging at the tip" and the shot "both walls mirrored, upward" require *two* strokes drawn toward a shared point. But `martini.outline` is one continuous subpath (`M22,32 L78,32 L50,76 Z …`) that DrawSVG can only draw in its authored order (rim → down to tip → up to other rim as **one** stroke), and the shot outline is a single closed loop. DrawSVG controls start/end %, not mirrored simultaneous origins. Achieving converge/mirror means **splitting those `d` strings into ordered subpaths** — i.e. editing GLASS geometry, which §9 explicitly says *"do not restyle, re-target how they animate."* **Correction:** resolve the contradiction — sanction the minimal path-splitting needed (it's per-glass, ~5 paths, not per-drink art) and note which glasses need it (martini, shot; verify coupe's authored order rim→bowl→stem→foot already matches the desired sequence — it does, by luck).

**4. Pin the GSAP version.** "All now free" is only true for GSAP **≥ 3.13**. Older DrawSVGPlugin/MorphSVGPlugin builds are Club-only and were **domain-locked trial** files that throw console warnings and refuse to run off-domain. A fresh session self-hosting from a stale CDN path could grab a paywalled/locked build. **Correction:** specify "download GSAP 3.13+ core + plugins from the official gsap npm/CDN (e.g. `gsap@3.13`), commit to `vendor/`," and name the exact files.

---

## SHOULD ADD

**5. MorphSVG needs a source blob that doesn't exist yet, and the mug is a compound path.** "Morph from a soft blob" requires authoring a blob `d` for highball and for mug — that's 2 new paths (per-glass, within budget, but not "zero new art," which §5 claims for garnish). Worse: `mug.outline` is a **compound path** (body + handle in one `d`, line 43). MorphSVG interpolating a single blob into a two-subpath target produces garbage unless subpath counts match. The brief's own "handle last" wording implies the handle should resolve separately — so the mug must be **split into two elements** (body morphs from blob; handle blurs/scales in after). **Correction:** flag the blob source paths as a required (sanctioned) asset, and specify splitting the mug body/handle for independent reveal.

**6. Preserving the coupe vs. tripling its duration is a contradiction.** §3 says "PRESERVE — the one he loves," then "lengthen to ~2.8s and add brass shimmer-settle." He loves it *at ~1s*. Nearly 3× slower + a new shimmer is a remix of his favorite, not preservation. **Correction:** make the coupe changes opt-in and conservative (keep close to current pacing, shimmer optional), and put "how much may we touch the coupe?" in the §10 client questions.

**7. Canvas bokeh blur is a per-frame perf trap.** "A few blurred for bokeh depth" via `ctx.filter`/`shadowBlur` per particle per frame, with `globalCompositeOperation='lighter'`, at DPR 2 — that's the one thing that can jank a mid/low iPhone. **Correction:** pre-render each blurred dot **once to an offscreen sprite** and `drawImage` it; never run a canvas filter in the rAF loop.

**8. Full 3.2s replay on every re-tap will feel slow.** Single-open accordion + one-shot timeline means re-opening the same mug replays 3.2s each time. **Correction:** after first play per card, snap subsequent opens to a fast ~0.6s settle (store a "seen" flag on the card).

---

## NICE TO HAVE

**9. Per-plugin (not just per-GSAP) fallback.** If core loads but MorphSVG fails to register, highball/mug get nothing. Specify: guard each plugin; on MorphSVG absence, degrade those two to the FALLBACK mask/fade-in (which the brief already describes for Motion One) rather than dead-ending.

**10. Validation tooling assumes Node/Playwright.** `npx playwright screenshot` needs npm installed — contradicts the "no npm" project spirit and the beginner user on Windows may not have it. Note a manual-screenshot fallback so M0–M7 validation can't stall.

**11. Canvas needs `aria-hidden="true"`** (decorative) — consistent with every other layer in the code.

**12. Simultaneous filter load during mid-scroll open.** The hero's animating `filter: blur(6px)→0` runs *at the same time* as the sticky tabs' `backdrop-filter` during a mid-scroll tap — two GPU filter ops at once, the exact worst-case the budget targets. Worth one sentence acknowledging it and capping the blur radius.

---

## Missing effect ideas to push toward 10/10

- **Meniscus tension line + a single travelling specular glint** on the liquid surface as it settles (one 1px gold highlight sweeping the surf line once). Reads as "wet/appetising" far more than fill alone, and it's transform/opacity-cheap. The brief mentions a light-sweep but not a surface-tension meniscus rim — that's the "juicy" cue the client asked for.
- **Condensation micro-droplets** beading on the outside of the rocks/highball glass after fill (2-3 static gold-lit dots, no loop) — the single strongest "cold and real, want-to-drink-it" signal, zero animation cost.
- **Tint-reactive stage-glow pulse synced to the pour** — drive the existing `.stage-glow` opacity (`:457`) from the GSAP timeline so the glow *breathes up* as liquid rises, instead of a flat CSS fade. Reuses existing DOM, makes the drink feel like it's radiating.
- **Garnish "plink" ripple offset by depth** — stagger each garnish's impact ripple by its landing `y` so multiple garnishes plink in sequence, not in unison. Uses the existing `ripple`/`SURFACE` system, adds perceived craft for free.