I have the full picture. I read all four load-bearing files; no further exploration is needed. Returning the brief.

---

# Stuora Menu — Animation Technology Brief

## What the code actually does today (so we fix the right thing)

There are **two** animation moments, both currently driven by the same one trick:

1. **Collapsed glass, on scroll** (`.glass .outline` in styles.css): IntersectionObserver adds `.card.revealed`; the outline draws via `stroke-dashoffset 1→0` (1.1s) and the liquid fills via `scaleY` (.85s). This runs **30× identically** — this is the client's "every glass draws the same, counter-clockwise" complaint.
2. **Hero pour stage, on tap** (`.pour-stage` / `.card.is-open`): a 116×150 hero glass draws + pours, garnish `mote`s tumble in (`@keyframes mote-drop`), a `splash` ripples, `stage-glow` blooms; bites assemble in layers.

Crucially: the repetitiveness is **not** a limitation of CSS — it is that **one technique is wired to all seven glass archetypes**. The `coupe`/`martini` stemmed silhouettes (Quince Gimlet, Vanilla & Grape Daiquiri) have few, symmetrical strokes, so the draw reads as elegant — the client likes those. The `mug` outline (`…Q82,64 82,82 Q82,100 66,102` — the handle) and the tall `highball` trace awkwardly from one origin — the client dislikes exactly those. So the mandate is: **differentiate the entrance per archetype, and for mug/highball stop tracing the outline entirely** in favour of a "condense out of pollen / morph up" reveal.

Everything must remain **driven by `item.glass` + `item.tint` + the `GARNISH_TOKENS` scan** (new drink = one JSON line). Per-drink bespoke authoring is only defensible for the **3 signatures** (Tomato & Sprats Mary, Mushroom Old Fashioned, Smoked Plum Vodka) — that is the one sanctioned place.

---

## Option-by-option assessment

| # | Tech | Premium effects it unlocks | Mobile-Safari perf / battery | Weight (gzip) | License | True no-build? | Data-driven + reduced-motion fit |
|---|---|---|---|---|---|---|---|
| a | **CSS + WAAPI** | Directional draw (by moving dash origin), clip/mask reveals, cubic-bezier overshoot, transform/opacity choreography. **No** true path morph, **no** real particle field, **no** physics springs. | **Best.** transform/opacity are compositor-accelerated. SVG filters (feTurbulence/feDisplacement) are the only trap — expensive on iPhone. | **0** | native | yes | Perfect — it's the current architecture. |
| b | **Motion One** | `spring()`/`glide()` physics, `stagger()`, timelines, scroll(). Adds the natural **overshoot/settle** raw CSS can't author cleanly. No draw-as-feature, no morph, no particles. | **Excellent** — thin wrapper over WAAPI; compositor-accelerated for transform/opacity; springs may fall to rAF. Very battery-friendly. | ~4KB core / ~18KB full | MIT (free) | yes (1 ESM/IIFE) | Great; reads `matchMedia` trivially. |
| c | **anime.js** | Timeline, stagger, **SVG line-draw helper**, **path-morph (only if point counts match)**, motion-along-path, elastic/spring eases — a lot in one dep. | Good, but animates by writing inline styles every rAF on the **main thread** → riskier for 30 glasses revealing *during scroll* than compositor CSS. Fine for one-at-a-time tap. | ~14–17KB | MIT (free) | yes (UMD) | Good, but our glass paths have wildly different point counts, so its morph is mostly unusable here. |
| d | **GSAP core + DrawSVG + MorphSVG + MotionPath** | **The exact vocabulary the brief asks for:** DrawSVG = draw *any* stroke from any origin/segment/direction with easing (kills the "same counter-clockwise" problem); MorphSVG = morph *arbitrary* `d`→`d` even with mismatched points (mug can dissolve into a swirl and reform — real "magic"); MotionPath = garnish/pollen riding curves; best-in-class timeline + custom overshoot eases + longer luxurious sequences. | **The most mobile-proven rAF engine** (batched matrix transforms, lag smoothing). Holds 60fps for discrete, one-at-a-time pours + a few scroll reveals. It is main-thread rAF, so it is *not* the tool to push a field of hundreds of nodes. | core ~24KB + 3 plugins ~15KB ≈ **~40–50KB**, one-time cached | **Now 100% free, all plugins** (Webflow) | yes (UMD `<script>` per plugin, CDN or self-host) | Excellent — build one "entrance factory" keyed on `item.glass`; reduced-motion → `tl.progress(1).pause()`. |
| e | **lottie-web** | Highest "hand-drawn juicy" ceiling — anything an AE designer draws. | SVG renderer = heavy DOM; canvas better; fine as a one-shot on tap, poor as always-on. | runtime ~60–70KB **+ each JSON 20–200KB** | MIT runtime (needs After Effects to author) | runtime yes, **but authoring needs AE + a motion designer** | **Wrong model.** It's pre-baked per-asset artwork; it can't compose "up-to-4 token garnishes + runtime tint" per drink. Breaks "commit one JSON line." Only justifiable for the 3 signatures. |
| f | **Rive (canvas)** | State machines, **runtime inputs (tint drivable)**, mesh deform, tiny vector assets — more parametric than Lottie. | Canvas/GPU, generally smooth; wasm load cost; one shared canvas needed. | wasm runtime **~150–200KB** + tiny .riv | runtime free/open; editor free+paid | runtime yes, **but authoring is in the Rive editor** | Same per-asset authoring friction as Lottie + heavy wasm. Over-engineered here; signatures-only at most. |
| g | **SVG SMIL** | Draw, animateMotion (pollen on a path), begin/end chaining. No morph of differing paths, no springs. | Supported but a platform dead-end; awkward to couple to JS tap state (`beginElement()`). | 0 | native | yes | Poor coordination with data-driven JS; no upside over CSS/WAAPI. **Skip.** |
| h | **Canvas 2D (hand-rolled)** | **Real pollen/dust field**, liquid wobble, generative sparks — full control, tint-driven. | 2D canvas is CPU-rasterized; a **single bounded 158px emitter while one card is open** is cheap; stop rAF on close/offscreen. Many at once would cost. | **~1–2KB your code** | native | yes | Excellent as the dedicated pollen layer; you maintain ~40 lines. |
| i | **three.js / Pixi / WebGL** | The refraction/caustics/fluid ceiling. | **Expensive & thermally risky on iPhone** — the brief itself flags large WebGL. Compounds the `backdrop-filter` already on the sticky tabs. | 100–150KB+ | free | yes | **Against the restraint + battery law.** Reserve, at most, for a single hero — not 30 cards. **Recommend against.** |
| j | **tsParticles** | Declarative pollen/dust/embers with emitters, gravity, twinkle — the "floating pollen" vocabulary without writing canvas. | Canvas-based; fine at 30–60 particles if you cap count, disable retina scaling, and pause offscreen; greedy if misconfigured. | slim ~30–40KB | MIT | yes (UMD) | Its full-container model is a slightly awkward fit for a 158px per-card stage; a hand-rolled emitter (h) is lighter and more controllable for something this small. |

---

## Ranked recommendation

### PRIMARY — GSAP (free) for the vector choreography **+ a tiny hand-rolled canvas-2D pollen layer**

GSAP core + **DrawSVGPlugin + MorphSVGPlugin + MotionPathPlugin** is the one stack that maps 1:1 onto the client's *verbatim* asks, and it is now entirely free with no build step (UMD script tags). Wire a small **entrance factory keyed on `item.glass`** so each archetype gets a distinct, characterful entrance instead of the single uniform trace:

- **`coupe` / `martini` (stemmed — the ones he loves): keep an elegant DrawSVG draw**, but vary origin/direction and give the bowl a spring settle. Refine, don't replace.
- **`mug` / `highball` (the clumsy tracers he dislikes): do NOT draw the outline.** MorphSVG the silhouette *up out of* a swirl (blob → glass), while the canvas pollen condenses into its shape and the tint pours. This is the "appears magically, with pollen/dust" he asked for.
- **`shot` (13 infusions): a quick, low, warm entrance** — and seed a tiny per-item variance from a hash of `item.name` so the 13 shots never fire in lockstep.
- **`rocks`: a weighty settle**; **`plate` (bites): keep the layer-stack assembly.**
- **Signatures (3): the sanctioned place to spend extra** — an added MotionPath garnish flourish or a denser pollen burst. This is where per-drink authoring is acceptable.

Why the **separate canvas pollen layer** instead of pushing particles through GSAP: GSAP is main-thread rAF and should choreograph a *handful* of vector elements, not a field of hundreds of DOM nodes. A ~40-line canvas emitter, **bounded to the currently-open card, tint-coloured, and stopped on close/offscreen**, keeps the "pollen" cheap and off GSAP's tween list. Build it, don't buy tsParticles — it's lighter (~2KB vs ~35KB) and precisely controllable at 158px.

**Garnish upgrade (richer, still token-driven, zero new art):** the existing `shape()` motifs (the sprat, the tomato) stay data-driven; give them a linear-gradient fill + one specular highlight ellipse + a subtle MotionPath tumble as they land. Tastier, still just SVG, still chosen by `GARNISH_TOKENS`.

**Reduced-motion:** on `prefers-reduced-motion`, don't start the canvas emitter and freeze every GSAP timeline with `tl.progress(1).pause()` (or `gsap.set` to end-state) — mirroring the existing CSS reduced-motion block, which already freezes outline/liquid/motes to their finished state.

**Longer & more luxurious:** current draws are ~1s; take the pour-stage timelines to **1.8–2.6s** with staggered beats (draw/morph → pour → garnish MotionPath → settle), eased with a gentle `back`/custom overshoot. The tiny collapsed-glass scroll reveal stays short (~0.9s) so scrolling never feels gated.

### FALLBACK — CSS + Web Animations API, lifted by **Motion One** (~4–18KB), same canvas pollen layer

If we want to stay near-zero-dependency (or as the graceful-degradation / older-device path): keep everything native and add **Motion One** only for spring/overshoot choreography. This still delivers **seven distinct per-archetype entrances** (clip/mask reveals, directional dash-draws by relocating the dash origin, spring settle) plus the same canvas pollen — best-in-class battery and compositor performance. What it **cannot** do is the true path-**morph** "magic" for the mug/highball; those would fall back to a mask-wipe reveal instead of a morph. This is also the natural substrate GSAP degrades to.

### Rejected for this site
- **lottie-web / Rive** — pre-baked per-asset artwork fights the token-composed, one-JSON-line data model; only defensible as an optional flourish on the 3 signatures.
- **three.js / Pixi / WebGL shaders** — against the battery + restraint law on iPhone, and would compound the `backdrop-filter` already on the sticky tabs.
- **SMIL** — platform dead-end, poor coupling to the JS tap state.
- **anime.js** — fine, but its morph needs matched point counts (ours don't match) and it's main-thread during scroll; GSAP strictly dominates it now that GSAP is free.

### Total weight budget
**PRIMARY ≈ 42–52KB gzip, cached once:** GSAP core (~24KB) + DrawSVG/MorphSVG/MotionPath (~15KB) + hand-rolled canvas pollen (~2KB). No per-drink assets.
**FALLBACK ≈ 6–20KB gzip:** Motion One + canvas pollen.

Both stay comfortably under any reasonable mobile budget, load as plain `<script>`/ESM (self-host the files in the repo so GitHub Pages serves them and there's no third-party CDN dependency), require no build step, and keep the "add a drink = one line in `menu.json`" law intact.

**Relevant files:** `C:\Users\Admin\projects\QR StuoraMenu\app.js` (the `GLASS` archetype map, `garnishList`/`GARNISH_TOKENS`, `SURFACE`, and the `.revealed` / `.is-open` render hooks — this is where the entrance factory plugs in), `C:\Users\Admin\projects\QR StuoraMenu\styles.css` (current draw/pour keyframes + the `prefers-reduced-motion` block to mirror), `C:\Users\Admin\projects\QR StuoraMenu\menu.json` (the data contract that must stay one-line-per-drink).