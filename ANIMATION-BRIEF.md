# Stuora Bar — Premium Animation Direction & Handoff

> **Это бриф-инструкция для следующего окна.** Прочитать этот файл + репозиторий, сначала ответить на вопросы §10 и правку **F**, затем строить по этапам M0→M7. Каждый указатель `file:line` сверен с текущим кодом. Правки из адверсариал-ревью — в блоке ниже, они авторитетны.

*Definitive build brief. A fresh session with only this document + the repo can start immediately. Every file:line pointer below was verified against the current `app.js` and `styles.css`.*

---

## 1. Executive vision

The Stuora menu should feel like a bartender making the drink *for you*. Today all 30 items perform the identical trick — one gold stroke traces the glass outline from a single start point (`stroke-dashoffset: 1→0`), then a liquid fills. As one animation it is lovely; thirty times it reads as a machine, not a bar. The new direction gives **each of the 7 glass archetypes its own motion language**, keeps the two stemmed reveals the client loves (Quince Gimlet, Vanilla & Grape Daiquiri) almost untouched, and **replaces the two clumsy tracers he named — the mug and the fizz highball — with a "materialise out of drifting gold pollen" reveal**. Every entrance is slower and layered (a composed ~2.5s pour, not a 1s loop), with spring/overshoot easing that CSS alone cannot author, so the liquid lands with weight and the garnish plinks into the surface. It stays luxury-through-restraint: bordeaux, brass, cream; garnish colours the only accents; magenta still logo-only.

---

## ⚠️ Corrections from adversarial review — READ FIRST (authoritative; override the body on conflict)

An independent reviewer verified every `file:line` pointer below is accurate and the GSAP-3.13-free / no-build / data-driven claims hold. Fold these in before building:

**A. Apply the per-glass DIRECTIONAL draw variety to the THUMBNAILS, not just the hero.** The "all 30 identical" complaint is really the *scroll* experience — 30 small line-glasses tracing the same way. The hero only ever shows one at a time. So the §3 per-glass draw directions (martini converge, shot bottom-up, rocks drop-in, coupe preserve…) MUST also drive the collapsed `.glass` thumbnail draw on `.revealed` — **DrawSVG only, no canvas/filters/particles in the list** (stays within the scroll budget). Otherwise the headline complaint is only half-fixed.

**B. The mug & highball THUMBNAILS must not clumsy-trace either.** The morph-from-pollen redesign is hero-only, but the user sees the clumsy mug-handle trace *while scrolling*. In the list, mug/highball thumbnails should fade/scale/blur-in (a mini "materialise"), never dashoffset-trace the handle.

**C. Sanction minimal per-glass path-splitting (resolves a §9 contradiction).** Martini "two rim points converging at the tip" and shot "both walls mirrored upward" are impossible on the current single continuous `d` — DrawSVG draws one stroke in authored order. This needs splitting those `d` strings into ordered sub-paths. That's per-GLASS (~5 paths), **not** per-drink art — it is sanctioned. §9's "don't re-target geometry" means *don't restyle silhouettes*; editing draw-order sub-paths for martini + shot (and splitting the mug, see D) is allowed and required. Coupe's authored order (rim→bowl→stem→foot) already matches the desired sequence — leave it.

**D. Mug is a compound path (body+handle in one `d`, `app.js:43`).** For "handle last", split the mug into two elements: body morphs from a blob; handle blurs/scales in after. MorphSVG also needs a source **blob `d`** authored for highball and mug (2 sanctioned per-glass paths — so it is not literally "zero new art").

**E. Pin GSAP 3.13+.** Plugins are free only in GSAP ≥ 3.13; older DrawSVG/MorphSVG are domain-locked *trial* files that refuse to run off-domain and throw console warnings. Download `gsap@3.13`+ core + DrawSVGPlugin + MorphSVGPlugin + MotionPathPlugin from the official CDN/npm and commit the exact minified files to `vendor/`. Guard each plugin separately: if MorphSVG fails to register, degrade mug/highball to the fade/mask fallback — don't dead-end.

**F. Coupe: preserve the pacing, don't triple it.** He loves the coupe at ~1s. Keep it near current speed; the ~2.8s "benchmark" + shimmer are **opt-in**, not mandatory. (See added §10 question.)

**G. Perf traps to avoid:** pre-render each blurred pollen dot **once** to an offscreen sprite and `drawImage` it — never run `ctx.filter`/`shadowBlur` in the rAF loop. Cap the hero `blur()` radius (it runs alongside the tabs' `backdrop-filter` on a mid-scroll tap — two GPU filters at once). Give the canvas `aria-hidden="true"`.

**H. Fast replay on re-tap:** re-opening the same card should snap to a ~0.6s settle after the first full play (store a `seen` flag on the card) so the ~3s reveal never feels slow the second time.

**Four extra effects to push toward 10/10** (all cheap): (1) a meniscus surface-tension rim + one travelling specular glint as the liquid settles; (2) 2–3 static condensation droplets on rocks/highball after fill ("cold & real"); (3) drive `.stage-glow` opacity **from the timeline** so the glow breathes up as liquid rises; (4) offset each garnish's impact ripple by its landing depth so they plink in sequence, not unison.

**Validation note (Windows, no npm):** the plan mentions `npx playwright` — that needs npm. On this machine use the existing headless **Edge** method instead: `msedge --headless=new --screenshot --window-size=390,844 --virtual-time-budget=6000` with a card forced open (add `.is-open`), plus a second run under `prefers-reduced-motion`.


## 2. Chosen approach / technology

**PRIMARY: GSAP (free) as a progressive-enhancement layer over the existing CSS, plus a ~50-line hand-rolled `<canvas>` pollen emitter.**

- **GSAP core + DrawSVGPlugin + MorphSVGPlugin + MotionPathPlugin**, all now 100% free, all UMD `<script>` tags, **zero build**. This is the only stack that maps 1:1 onto the client's verbatim asks: DrawSVG draws any stroke *from any origin/direction/segment* (kills "everything traces the same way" with the paths we already have); MorphSVG dissolves the mug/highball silhouette *up out of* a blob instead of tracing it; MotionPath arcs garnish in on a curve; the timeline sequences draw→pour→garnish→settle as one luxurious piece with `back`/`elastic` overshoot.
- **Pollen/effervescence = one tiny custom `<canvas>`, not a particle library.** The accordion is single-open, so at most one canvas is ever alive; it is created on tap-open, capped at ≤24 particles, DPR-capped, and `cancelAnimationFrame`'d + removed on close. ~2KB of our own code beats tsParticles' ~35KB and gives exact palette control at a 158px stage. **Particles fire on tap only, never during scroll.**
- **Progressive enhancement is mandatory.** GSAP is loaded, then feature-detected. If it (or the CDN) fails, the current CSS `.revealed`/`.is-open` transitions still run and the menu is fully readable. The menu must never depend on JS animation to function.

**FALLBACK (if we later want near-zero-dependency, or for a graceful low-end path): Motion One (~4–18KB) + the same canvas.** It delivers per-archetype entrances (clip/mask reveals, directional dash-draws by relocating the dash origin, spring settle) and the pollen — but it **cannot** do the true path *morph*; mug/highball degrade to a mask-wipe reveal instead of a blob-morph. Decide PRIMARY unless the client vetoes a ~45KB dependency.

**Weight budget & loading (self-host in the repo so GitHub Pages serves it — no third-party CDN runtime dependency):**

```html
<!-- before </body>, before app.js -->
<script src="vendor/gsap.min.js"></script>
<script src="vendor/DrawSVGPlugin.min.js"></script>
<script src="vendor/MorphSVGPlugin.min.js"></script>
<script src="vendor/MotionPathPlugin.min.js"></script>
```

| | gzip, cached once |
|---|---|
| GSAP core | ~24 KB |
| DrawSVG + MorphSVG + MotionPath | ~15 KB |
| Hand-rolled canvas pollen | ~2 KB |
| **PRIMARY total** | **~40–50 KB** |
| FALLBACK (Motion One + canvas) | ~6–20 KB |

No per-drink assets. Both totals are comfortably under any mobile budget.

---

## 3. Per-glass + per-drink choreography plan

This table is the core fix for "all 30 identical." The entrance is selected at render time from data you already have: `item.glass` picks the family, `item.tint` colours liquid/glow/pollen, an ingredient/name scan picks particle mood, `item.signature` adds a flourish. **Adding a drink stays one JSON line.**

| Glass (drinks) | Silhouette entrance (the differentiator) | Liquid | Garnish / particle | Verdict |
|---|---|---|---|---|
| **coupe** (Vanilla & Grape Daiquiri, Quince Gimlet, Clover Club, Redcurrant & Hibiscus Margarita) | **PRESERVE — the one he loves.** Keep the stemmed self-draw: rim arc → bowl curve → stem down → foot. Only lengthen to ~2.8s and add a soft brass shimmer-settle at the end. | Gentle rise; frothy meniscus cap if `egg white` present. | Airy slow **drift-and-settle** (MotionPath), petals/berries float down. | Refine, do not touch the mechanism. |
| **martini** (Hanky Panky, Cherry Manhattan) | **Precision V.** DrawSVG the two rim points *downward, converging at the cone tip*, then stem down, then foot outward. Deco geometry, sharp ease `back.out(1.4)`. | Fills from the tip up. | One **skewered, centred** garnish descends vertically with a micro-splash. | New identity, still elegant. |
| **shot** (13 Infusions) | **Etch + glint.** Both walls DrawSVG *upward from the base*, mirrored; a single brass sheen sweeps L→R once. Crisp (there are 13). Seed a tiny per-item variance from `hash(item.name)` so they never fire in lockstep. | Brisk bottom-up fill with a small `back.out` overshoot + meniscus wobble. | Minimal: one garnish perched on the rim, no tumble. | Fast, confident. |
| **rocks** (Negroni, Old Fashioned, Boulevardier, Milk Punch) | **Set down + ice.** Outline fades/drops in from above with a weighty settle; then a brass-outlined **ice cube tumbles in and lands** (rocks-only motif). Slow `power2.inOut`. | Slow viscous fill pouring over the ice, refraction highlight round the cube. | One placed twist/cherry with an expressed-oil glint. | Weighty, spirituous. |
| **highball** (Rhubarb Fizz, Kombucha, Tomato & Sprats Mary) | **REDESIGN — magical, no trace.** A rising column of bubbles/pollen streams up and the gold outline **sets bottom→top in its wake** (MorphSVG from a soft blob + `blur(6px)→0`, `scale(1.04→1)`). Conjured by the fizz, never drawn. | Bottom-up fill with continuous fine effervescence. | **Pollen drift** at the mouth + bubbles inside; stalk/wedge on the rim. | Flagship "magic" #1. |
| **mug** (Blackcurrant & Chilli Mule) | **REDESIGN — flagship magic.** No trace of the clumsy handle. A cloud of cold **frost-dust gathers → copper mug resolves blurry→crisp within the mist, handle last** (MorphSVG + blur/scale). | Vigorous ginger-beer effervescence fills with deep tint; a slow **chilli-ember glow breathes once** at the base (cold mist above, warm ember below). | Frost-dust drift; berries + chilli + lime settle. | Flagship "magic" #2 — the two drinks he named by name. |
| **plate** (3 Bites) | **PRESERVE + enrich.** Oval draws in one quick sweep, then components placed one-by-one (chef plating — the existing `layer-stack`). Add plate sheen + settle shadow + a final pepper/herb dusting flourish. | None (food). | — | Keep; it's already distinct. |

**Signature flourishes** (`Tomato & Sprats Mary`, `Mushroom Old Fashioned`, `Smoked Plum Vodka`, keyed on `item.signature`): +0.4s hold, a brass "✦ Signature" filigree seal etches in as a final beat, the glow pulses once more, and a **themed smoke/spore particle** rises (see §4). This is the one sanctioned place for per-drink authoring — a hand-tuned smoke path for ≤3 flagged items. Everything else stays fully generative.

---

## 4. Particle / pollen + effervescence system

**One module, one canvas, tap-only.** `initStageParticles(stageEl, mood, tint)` is called by `toggleCard` when a card opens and returns a teardown handle stored on the card; closing (or opening another card) calls teardown.

- **Canvas:** sized to the `.pour-stage` (~158px tall), `position:absolute; inset:0; pointer-events:none`, appended into `.pour-stage`. DPR capped at `min(devicePixelRatio, 2)`.
- **Moods** (all warm brass/tint, low alpha, additive via `globalCompositeOperation='lighter'` at low opacity):
  - `pollen` — ~20–24 soft radial-gradient gold dots (`#C9A24B`/`#E8C982`), a few blurred for bokeh depth, slow upward drift + flicker; converge on the glass during the reveal, then thin to a faint ambient shimmer and stop. (highball/mug fruity default)
  - `effervescence` — 8–12 small bubbles rising inside the liquid region with a sinusoidal x-wobble per `--i` phase, pop at the meniscus. Auto-on when `glass ∈ {highball, mug}` or ingredients contain soda/ginger beer/tonic/sparkling/kombucha.
  - `smoke` — grey-brass wisps rising and dissipating from the surface; signature-only.
  - `ember` — a single warm chilli glow that breathes once (mug/chilli).
- **Derivation (`PARTICLE_TOKENS`, mirrors `GARNISH_TOKENS` word-boundary scan):** `smoked/smoke/sprat/brine → smoke` · `mushroom → spore` · `chilli/chili → ember` · `soda/ginger beer/tonic/kombucha/sparkling → effervescence` · highball/mug fruity default → `pollen` · else glass default. Result: particle mood is inferred, never hand-set — **still one JSON line per drink.**

**Perf budget:** one canvas, ≤24 particles, rAF loop that runs *only while a card is open*; `cancelAnimationFrame` + `canvas.remove()` on close so nothing loops in the background (battery). No WebGL, no added `backdrop-filter`. A single 158px canvas with 24 dots is trivial on iPhone.

**Reduced-motion:** if `matchMedia('(prefers-reduced-motion: reduce)').matches`, **the canvas is never created** and no rAF starts. GSAP timelines snap to end-state (§6). This also serves as a low-power proxy. `feDisplacementMap` smoke (if ever used for signatures) is disabled here.

---

## 5. Garnish icon upgrade notes

Keep the token-scanned inline-SVG system in `shape()` (`app.js:96-152`) — the client likes the sprat and tomato; we deepen, not replace. All still one JSON line.

- **Master "candied/wet" pass, authored once, applied to all motifs:** a reusable `<defs>` 2-stop gradient + one specular highlight ellipse + the existing soft drop-shadow, so every fruit reads glossy and ripe instead of flat. (The tomato already has a highlight at `app.js:110` — extend that treatment to cherry/plum/grape/berry.)
- **Sprat** (`fish`, `app.js:111-113`): add fine scale cross-hatch, a brass belly highlight, a gill line and a small tail-fan — a jewel-like fish, same silhouette.
- **Tomato** (`app.js:107-110`): deeper-red rim → bright-centre gradient, crisp gloss, a tiny water droplet.
- **Berries / citrus:** per-drupelet highlights, frosted bloom on blackcurrant; citrus pith ring + glossy wedge + two juice droplets.
- **Garnish *motion* per glass (MotionPath, zero new art):** martini = single skewered vertical descent; coupe = airy slow drift; rocks = one placed twist with oil-glint; highball/mug = float in on the pollen/fizz. Same motif set, different behaviour — more variety at zero extra artwork.

---

## 6. Timing & easing philosophy

**Longer but *layered*, not slower** — something is always arriving so it never feels sluggish. One GSAP timeline per opened card, staged:

```
t 0.0–0.9s   vessel forms      (draw / morph / materialise, per glass)
t 0.5–1.4s   liquid pours + meniscus rises & settles
t 1.0–1.9s   garnish drops (staggered, MotionPath, squash-on-impact)
t 1.4–2.4s   ripple rings + one specular light-sweep
t 2.0–2.8s   glow settles / pollen thins / smoke dissipates
```

- **Hero (tap-open) totals:** shot ~1.8s · martini ~2.4s · rocks ~2.6s · **coupe ~2.8s (the pacing benchmark — his favourite)** · highball ~3.0s · mug ~3.2s · plate ~2.6s. Signatures +0.4s hold.
- **List (scroll-reveal) stays short — ~0.9–1.5s, transform/DrawSVG only, no canvas/filters** — so scrolling is never gated.
- **Easing = 80% of the "expensive" feel.** Per-glass signatures: shot `power4.out` (snap), rocks `power2.inOut` (slow), martini `back.out(1.4)`, coupe soft custom ease + shimmer. Overshoot ≤ 3–4% (`back.out`/`elastic.out(1,0.5)`) — a *hint* of bounce, never cartoon. Add 1–2 frames of anticipation (scale 1→0.96→1.03→1) on liquid slam, ice drop, garnish landing.
- **Reduced-motion:** `gsap.matchMedia()` reduced branch calls `tl.progress(1).pause()` / `gsap.set(...end-state...)` — fully-drawn gold glass, filled liquid, static glow, garnish at rest, seal shown, **no** pollen/smoke/sweep/bubbles. Mirrors the existing CSS block at `styles.css:631-645`.

---

## 7. Phased implementation plan

Ship incrementally; validate each milestone with a **headless screenshot** (e.g. `npx playwright screenshot --viewport-size=390,844`, iPhone-width, one card forced open via `.is-open`, and a second run with `prefers-reduced-motion`). Compare against the design law each time.

- **M0 — Scaffolding.** Self-host GSAP + 3 plugins in `vendor/`, add `<script>` tags to `index.html`, `gsap.registerPlugin(...)`, feature-detect. Refactor `toggleCard` (`app.js:379-391`) to build a GSAP timeline per open card and tear it down on close; keep CSS as the no-JS fallback. *Validate: card still opens with GSAP present and with GSAP script removed (screenshot both).*
- **M1 — Entrance factory.** Build `entranceFor(item)` keyed on `item.glass`, returning a timeline builder. Implement coupe (preserve) + martini + shot + rocks first (DrawSVG variety, per-glass easing). *Validate: screenshot one coupe, one martini, one shot, one rocks open — four visibly different reveals.*
- **M2 — Canvas pollen module.** `initStageParticles` + `PARTICLE_TOKENS`. Wire mood derivation. *Validate: screenshot a highball mid-reveal showing pollen; confirm canvas is removed from DOM after close (assert `querySelector('canvas')===null`).*
- **M3 — The two flagships.** MorphSVG "materialise from pollen/mist" for highball (Rhubarb Fizz) + mug (Blackcurrant & Chilli Mule), incl. mug ember + frost-mist. *Validate: screenshot both at ~40% progress — glass emerging from dust, not tracing.*
- **M4 — Pour, meniscus, ripple, light-sweep, effervescence, spring easing.** Upgrade the `scaleY` fill into a GSAP-driven pour with meniscus + settling rings + one specular sweep. *Validate: screenshot a fizz + a rocks at "full" showing meniscus + sweep.*
- **M5 — Garnish glow-up + MotionPath landing** (§5). *Validate: screenshot the sprat and tomato close-up, glossy variants.*
- **M6 — Signatures** (✦ seal, themed smoke/spore, extra hold) for the 3 flagged items. *Validate: screenshot each signature's seal beat.*
- **M7 — Reduced-motion + perf pass.** `gsap.matchMedia()` reduced branch, `will-change` add-on-start/remove-on-complete, particle caps. *Validate: reduced-motion screenshot = tasteful static end-state, no canvas; DevTools/Instruments fps trace opening a card mid-scroll on a mid iPhone in Low Power Mode.*

---

## 8. Risks & mobile performance budget

- **Target:** hold ~60fps, especially opening a card *mid-scroll* on a mid/low iPhone in Low Power Mode. Weight ceiling ~50KB gzip (met). No battery drain from background loops.
- **Only the open card animates** — already gated on `.is-open`; keep it. Scroll-reveal stays light (transform/opacity/DrawSVG only, **no canvas/particles/filters on scroll**). The reveal observer already unobserves after firing (`app.js:405`) — keep that one-shot.
- **Animate transform / opacity / filter only, never layout.** Add `will-change` on entrance start, remove on complete (don't leave it set — it costs memory).
- **`backdrop-filter` caution:** the sticky `.tabs` already runs `backdrop-filter: blur(9px) saturate(1.1)` (`styles.css:180-181`) — the single most expensive GPU effect during scroll. **Do not add any new `backdrop-filter`.** The `.stage-glow` is a cheap blurred element, not a backdrop-filter — keep it that way.
- **One canvas at a time, ≤24 particles, torn down on close.** No infinite loops except the existing cheap neon breathe. `feDisplacementMap` smoke, if ever used, is signature-only, tiny filter region, one-shot, killed under reduced-motion.
- **Big WebGL is out** (three.js/Pixi/shaders) — against the battery + restraint law and would compound the tabs' backdrop-filter.
- **Keeping it data-driven:** entrance = `f(glass, signature, ingredient tokens)` reusing the exact word-boundary scan from `garnishList` (`app.js:186-204`). New drink = one line; entrance, liquid, garnish, particle mood, signature flourish all inferred. Per-drink authoring sanctioned **only** for the ≤3 signatures (bespoke smoke) and the 3 bites plating layouts (`bitePieces`, `app.js:248-271`, already bespoke). No bespoke art for the other 27.

---

## 9. Where the current code is (exact edit points)

All motion lives in **`styles.css`** (keyframes/transitions) and **`app.js`** (DOM builders + the class-toggle hooks). GSAP `<script>` tags go in **`index.html`**. Absolute paths under `C:\Users\Admin\projects\QR StuoraMenu\`.

**`app.js`:**
- `GLASS` object, `app.js:21-50` — the 7 silhouette paths (+ liquid paths). Source geometry for DrawSVG/MorphSVG; **do not restyle, re-target** how they animate. The mug's second sub-path (the handle, `app.js:43`) and the highball single closed box (`app.js:31`) are the two clumsy tracers to replace with morph.
- `glassSVG()` `app.js:71-79` (list thumbnail) and `heroGlassSVG()` `app.js:82-89` (hero) — both emit `pathLength="1"` + `.outline`/`.h-outline`. **Keep `pathLength="1"` for the glasses that still draw** (coupe/martini/shot/rocks); for mug/highball, DrawSVG/MorphSVG will drive the same nodes.
- `drinkStage()` `app.js:238-243` — assembles `.stage-glow` + hero glass + `garnishLayer` + `splashLayer`. **This is where the pollen canvas host + timeline root plug in.**
- `bitesStage()` `app.js:273-279` + `bitePieces()` `app.js:248-271` — keep; enrich with sheen/shadow/dusting.
- `garnishLayer()` `app.js:210-226` — currently emits `.mote`s with inline `--x/--y/--r/--d`. Rework the *landing* via MotionPath; keep the `SURFACE` map (`app.js:207`) so garnish still lands in the liquid.
- `shape()` `app.js:96-152` + `GARNISH_TOKENS` `app.js:155-184` — garnish glow-up (§5) and the new sibling `PARTICLE_TOKENS`.
- `garnishList()` scan `app.js:186-204` — reuse verbatim for particle-mood detection.
- `toggleCard()` `app.js:379-391` — **the tap-open hook.** Build/teardown the GSAP timeline + canvas here.
- `initReveal()` `app.js:395-411` — the scroll hook; keep it light, no particles.

**`styles.css`:**
- Thumbnail draw/fill: `.glass .outline` `styles.css:317-327` + `.card.revealed` on-states `:335-336`.
- Hero draw/pour: `.hero-glass .h-outline` `:461-470`, `.h-liquid` `:471-477`, on-states `:479-480`. **GSAP will override these transitions; leave them as the no-JS fallback.**
- Garnish/splash/bites keyframes: `mote-drop` `:496-502`, `ripple` `:518-521`, `droplet` `:534-538`, `layer-stack` `:551-555`.
- `.stage-glow` `:443-457` (cheap glow — extend with a tighter gold specular near the meniscus).
- **`--ease`** `styles.css:30` (a plain ease-out, no overshoot — the reason we bring GSAP).
- **Reduced-motion block `:631-645`** — the exact end-state the `gsap.matchMedia()` reduced branch must mirror.
- `--tint`/`--surf` custom props are set inline on `.pour-stage` at `app.js:349-350` — reuse for pollen colour + surface line.

**`index.html`** — add the 4 `<script>` tags (§2) before `app.js`.

---

## 10. Open decisions for the client (answer at the start of next window)

1. **Dependency size:** OK to add ~45KB (cached once) of GSAP for the full "morph out of pollen" magic (PRIMARY)? Or stay ~6–20KB with Motion One, accepting that mug/highball *dissolve-in* rather than truly *morph* (FALLBACK)?
2. **Pollen palette:** brass gold pollen only (safest, most restrained), or may pollen/dust also pick up each drink's `--tint` for the fruity ones? (Affects how "magical vs. tasteful" the two flagships read.)
3. **Signature smoke:** approve real curling smoke (SVG filter) on the 3 signatures — accepting it's the one effect fenced to tap-only/one-shot/off under low-power — or keep signatures to a brass ✦ seal + extra glow pulse only (cheaper, zero filter risk)?
4. **Duration ceiling:** is ~2.8–3.2s for the flagship hero reveals the right "luxurious," or does he want it reined to ~2.2s max so tapping never feels slow?
5. **Ice/meniscus scope:** add the rocks ice-cube + meniscus/faux-refraction upgrades now (M4), or ship the 7 distinct entrances first (M0–M3) and treat liquid realism as a fast-follow?

---
