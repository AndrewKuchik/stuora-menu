I have the full picture: the exact `GLASS` paths, the `pathLength="1"` dash-trace that all 30 items share, the CSS transition-based liquid fill, the `mote-drop`/`splash` garnish system, the `--ease` (a plain ease-out, no overshoot), the reduced-motion freeze block, and the data tokens already present in `menu.json`. Everything below is written against that actual code so the next-window implementer can wire it without new artwork. This is the deliverable — returning it directly.

---

# STUORA MOTION BRIEF — "make the drink look drinkable"
Craft catalogue of browser-achievable entrance effects, mapped to the real `GLASS`/garnish system in `app.js` + `styles.css`. Mobile-Safari-first, no build step, palette-locked, reduced-motion-safe.

## 0. The one-paragraph diagnosis (why it currently feels cheap)
Every card runs the **identical** recipe: one `<path pathLength="1">` with `stroke-dashoffset: 1 → 0`, the **same** `--ease` `cubic-bezier(.22,.61,.36,1)`, the **same** ~1s duration, then a `scaleY(0→1)` fill. Because it is one path, one offset, one easing, one length for all 30 drinks, the eye reads "a machine traced a loop" 30 times. The client's "draws in a circle / counter-clockwise from one start point" is literally the dash animation walking the path from node 0. Nothing is wrong with the technique — a stemmed coupe drawing itself is genuinely lovely (that's why he likes Quince Gimlet / Vanilla & Grape Daiquiri). The fix is not "a better trace," it's **variety of technique keyed to glass type**, plus **layered choreography** so the moment lasts ~2.5s and feels composed, not looped.

## 1. STRATEGIC RECOMMENDATION (answers "is a different technology possible?")
**Yes — adopt GSAP as the choreography backbone, keep CSS for the cheap layers, add a tiny custom canvas for pollen. No WebGL by default.**

| Layer | Tech | Why | Qualifies (no build)? |
|---|---|---|---|
| Choreography / timelines / spring eases / varied line-draw / morph | **GSAP core + DrawSVG + MorphSVG + MotionPath** (now free) | One `<script>` UMD tag. Timelines let you *sequence* draw → pour → garnish → ripple → sweep as one 2.5s piece. `elastic`/`back` give overshoot the CSS `--ease` can't. `DrawSVG` makes varied origins/directions a one-liner. Superb on mobile Safari. | ✅ single UMD/IIFE tag from CDN or self-hosted |
| Cheap continuous/one-shot layers: glow, condensation, bubbles, light-sweep, foam | **Plain CSS** transitions/keyframes (as today) | Compositor-only (transform/opacity/filter). Zero JS cost. | ✅ |
| Pollen / dust / bokeh field | **~70-line custom `<canvas>`** (preferred) or **tsParticles-slim** | One canvas, ~25 soft gold dots, created when a card opens and **destroyed on close** so only one ever runs. Full control of palette. | ✅ (tsParticles-slim is one UMD tag if you'd rather not hand-roll) |
| Real refraction / true fluid sim | **three.js or PixiJS** — *offered, not recommended* | Genuine glass refraction/caustics are gorgeous but cost battery + bytes and jank low-end iPhones. **Reserve for the 3 signatures only, behind a capability check, with the CSS version as fallback.** | ✅ but gate it |

Net: **one new dependency (GSAP)**, one small canvas module, everything else CSS. This is the honest sweet spot between "10/10 expensive" and "must hold 60fps on an iPhone in a dark bar."

## 2. THE VARIETY SYSTEM — entrance registry keyed to `glass` (the core fix)
Adding a drink stays **one JSON line**: the entrance is selected at render time from data you already have — `item.glass`, `item.signature`, and ingredient tokens (scan `ingredients[]` exactly like `garnishList()` does today for `soda`/`ginger beer`/`kombucha` → fizz, `smoke`/`smoked`/`mushroom` → smoke, `egg white` → foam, `chilli` → ember). No per-drink artwork. Map:

| Glass (drinks) | Entrance character | Line-reveal treatment | Signature layer |
|---|---|---|---|
| **shot** — 13 Infusions | quick, confident "single measure" | draw base-up, fast (0.5s), `back.out` overshoot on the liquid slam | Smoked Plum → wisp of smoke |
| **rocks** — Negroni, Old Fashioned, Boulevardier, Milk Punch | weighty, slow, spirituous | draw **two subpaths**: walls, then base line wipes L→R | Mushroom OF → earthy smoke curl |
| **highball** — Tomato&Sprats Mary, Rhubarb Fizz, Kombucha | tall → **materialise, don't trace** | outline **fades+sharpens** in (no dash walk); fizz drinks add rising bubbles | Tomato&Sprats Mary → savoury smoke + celery/sprat |
| **martini** — Hanky Panky, Cherry Manhattan | elegant, stemmed (client-loved family) | `DrawSVG "50% 50%"→"0% 100%"` = **bowl grows outward from centre**, stem draws downward, base last | — |
| **coupe** — Vanilla&Grape Daiquiri, Quince Gimlet, Clover Club, Redcurrant&Hibiscus Margarita | **KEEP & ELEVATE** (his favourites) | same stemmed draw he loves, but from-centre + meniscus + light-sweep | Clover Club → cream foam cap forms |
| **mug** — Blackcurrant & Chilli Mule | **FLAGSHIP MAGIC FIX** — never trace | outline condenses out of **golden pollen**; add condensation + ginger bubbles + slow chilli ember | (its own special piece) |
| **plate** — 3 Bites | culinary assemble (keep) | layered stack (as today) + plate sheen + settle shadow | — |

This single table dissolves the "all 30 identical" complaint: seven distinct motion languages, auto-assigned from data.

---

## 3. THE EFFECTS CATALOGUE
Each: **Idea / How in-browser / Perf on iPhone / Restraint**. Palette-locked to bordeaux/gold/cream; garnish colours are the only off-palette accents; magenta stays logo-only.

### A. Varied SVG line reveals — same skill, many origins & directions
**Idea:** break the "one loop from node 0" monotony without redrawing any silhouette.
**How (five cheap levers, mix per glass):**
1. **Reverse direction** — `stroke-dashoffset: -1 → 0` draws the *other way* (his "counter-clockwise" becomes clockwise for half the glasses). Zero code beyond a sign flip.
2. **Draw-from-centre** — GSAP `DrawSVG("50% 50%" → "0% 100%")`: the line grows outward from the middle in both directions. Reads completely unlike a trace; perfect for symmetric bowls (martini/coupe).
3. **Sequenced subpaths** — your `martini`, `coupe`, `mug` outlines are already multi-`M` paths. Split them and give each its own draw with a stagger: *bowl blooms → stem falls → base wipes*. Instant "characterful entrance."
4. **Per-glass easing** — shot uses `power4.out` (snap), rocks uses a slow `power2.inOut`, martini uses `back.out(1.4)` (a whisker of overshoot at the tip). The *motion signature* differs even where geometry is close.
5. **Vary origin node** — start the dash at the rim vs the base vs the stem foot; a rim-start on a coupe "pours light down into the bowl."
**Perf:** Low (SVG stroke on compositor). **Restraint:** keep stroke gold, 1.4px, `round` joins as now; only *one* lever per glass so it never looks busy.

### B. Spring / overshoot & anticipation easing
**Idea:** the "expensive" feel is 80% easing. Things should dip back before they launch (anticipation) and overshoot-settle (weight).
**How:** GSAP `back.out`, `elastic.out(1, 0.5)`, and a 1–2 frame anticipation (scale 1→0.96→1.03→1). Apply to: liquid slam (shot), ice-cube drop (rocks), garnish landing, foam cap. Your CSS `--ease` cannot overshoot — this is a headline reason to bring GSAP.
**Perf:** Low. **Restraint:** overshoot ≤ 3–4%; luxury is a *hint* of bounce, never a cartoon.

### C. Liquid POUR with meniscus / surface-tension / (faux) refraction
**Idea:** upgrade the static `scaleY` fill into an actual pour that has a surface.
**How:**
- **Pour stream:** a thin `--tint` rounded rect drops from stage-top into the mouth (~350ms) *before* the fill rises — cause and effect.
- **Rising fill:** keep `scaleY(0→1)` from base (you already have `transform-box:fill-box; origin 50% 100%`), but drive it with GSAP so it eases into place, not linear.
- **Meniscus:** an `<ellipse>` highlight riding the liquid's top edge, a touch wider than the interior with a lighter gold rim — that's the surface-tension read. It rises with the fill and does a tiny settle wobble.
- **Faux refraction (no WebGL):** the glass stroke *behind* the liquid gets a subtle lighter tint + 1px horizontal shift, so the outline looks "bent" through liquid. 95% of the impression, 0.1% of the cost.
**Perf:** Low–Med. **Restraint:** meniscus opacity ~0.5, gold; no rainbow caustics.

### D. Settling ripple
**Idea:** you have one ripple; make it read as surface settling.
**How:** 2–3 concentric `<ellipse>`/border-radius rings at the meniscus, staggered 120ms, scale-out + fade, `power2.out`. Fire once when the pour lands and again when garnish drops.
**Perf:** Low. **Restraint:** 1.5px `--tint` stroke, quick, gone in <1s.

### E. Rising bubbles / effervescence — for Fizz / Mule / Kombucha
**Idea:** carbonation is pure appetite appeal; it also *is* the elegant replacement for the disliked tall-glass trace.
**How:** N=8–12 small circles inside the liquid region, `@keyframes rise` translateY from just-below-surface upward, gentle sinusoidal x-wobble (per-bubble `--i` phase), scale-in then pop at the meniscus. **Data-driven:** only render when `ingredients` contains soda / ginger beer / sparkling / kombucha — so it auto-enables for Rhubarb Fizz, Blackcurrant & Chilli Mule, Kombucha and nothing else. One JSON line unaffected.
**Perf:** Low (CSS transforms). Cap the count; stop the loop on card close. **Restraint:** cream/gold bubbles at low alpha, small, unhurried — Champagne, not soda-pop.

### F. Condensation droplets on cold glass
**Idea:** "so cold you want it." Best on the mug (cold mule) and highballs.
**How:** 10–16 tiny radial-gradient dots on the *outside* wall with a top highlight; a few sit on a vertical track and slowly slide down then stop (a `translateY` + easing). Pure CSS, positioned within the glass bbox.
**Perf:** Low. **Restraint:** white/cream at 15–25% alpha, sparse, no fog.

### G. Bloom / soft glow
**Idea:** your `.stage-glow` already works; make it feel like light *in* the liquid.
**How:** keep the blurred radial of `--tint`; add a second, tighter warm-gold specular near the meniscus that pulses up once as the fill completes. Optionally a one-shot brightness bloom on the whole glass at "full."
**Perf:** Low (blur a small element, not `backdrop-filter`). **Restraint:** peak opacity ~0.34 as now; one pulse, then idle.

### H. POLLEN / DUST / BOKEH field — the client's explicit ask, and the mug/fizz hero
**Idea:** the mug and Rhubarb Fizz shouldn't be *drawn* — they should **condense out of drifting golden dust**, magically.
**How:** a small `<canvas>` sized to the stage (~150px). ~20–25 particles = soft radial-gradient dots in gold `#C9A24B`/`#E8C982` at low alpha, a few blurred (bokeh depth), slow upward/lateral drift, gentle size/opacity flicker. Sequence for the "materialise" entrance: dust converges → glass outline **fades in + blur(6px)→blur(0) + scale(1.04→1)** (no dash trace at all) → liquid fades up → dust thins out over ~2.5s and settles to a faint ambient shimmer, then stops. Create canvas on open, `cancelAnimationFrame` + remove on close → **only one canvas ever alive**.
**Perf:** Low–Med. A single 150px canvas with 25 dots is trivial; the discipline is "one at a time, destroyed on close, never during scroll." **Restraint:** gold only, few, slow, additive glow via low alpha; it's a *reveal flourish that fades*, not a permanent snow-globe. This is the single biggest "expensive/magical" win and directly fixes both drinks he named.

### I. Gooey / turbulence filters — smoke, mist, steam (Smoked Plum, Mushroom, Tomato&Sprats)
**Idea:** the signature smoky drinks get real curling smoke.
**How:** two paths — (1) **gooey merge** (Lucas Bebber technique): `feGaussianBlur` + `feColorMatrix` alpha-contrast so rising smoke blobs fuse into organic wisps; (2) **displacement wisp:** `feTurbulence` + `feDisplacementMap` with an animated `baseFrequency`/offset for drifting smoke that dissipates upward. Grey-gold, low opacity, from the meniscus, rising and fading.
**Perf:** **High — the one to fence.** `feDisplacementMap` is the most expensive SVG filter. Keep the filter *region tiny* (just above the glass), run it **only for the ≤3 smoky signatures**, one-shot ~1.5s, **never during scroll**, and drop it entirely under reduced-motion / low-power. Prefer the gooey (blur+matrix) variant on phones; reserve displacement for capable devices.
**Restraint:** a thread of smoke, translucent, gone in 2s — Connaught Bar, not a fog machine.

### J. Morphing between shapes (MorphSVG)
**Idea:** a couture flourish for signatures and glass↔hero continuity.
**How:** GSAP `MorphSVG`. Uses: the small collapsed glass icon morphs its outline into the hero glass on open (continuity); or a garnish morphs (citrus wheel → twist) for a signature. Use *sparingly*.
**Perf:** Low. **Restraint:** one morph per special moment, ≤3 drinks; morphing everything reads gimmicky.

### K. Staggered ingredient drops — squash & stretch + juice splash
**Idea:** you already drop garnish with a bounce; make it land like real fruit hitting liquid.
**How:** enrich the existing `mote-drop`: add **anticipation** (hang a beat at top), **squash on impact** (scaleY↓/scaleX↑ for 1 frame at landing), **crown splash** of small `--tint` droplets radiating from impact, plus your ripple ring, then a slow settle/idle bob. Drive with a GSAP timeline so drops stagger and the splash fires exactly on contact. Keep max 4 (as now).
**Perf:** Low. **Restraint:** squash ≤ 15%, 3–5 droplets, tint-coloured — one honest plink per garnish.

### L. Specular light-sweep across the glass
**Idea:** the Apple "sheen" — the single cheapest cue that says premium/expensive.
**How:** a pseudo-element band `linear-gradient(105deg, transparent, rgba(255,255,255,.45), transparent)` masked to the glass shape (`mask`/`clip`), swept once via `translateX`/`background-position` right after the fill completes. `mix-blend-mode: screen`, scoped to the stage only.
**Perf:** Low. **Restraint:** one pass, ~600ms, subtle; a glint, not a strobe.

### Richer garnish variants (he likes the sprat & tomato — keep the system, deepen it)
Stay inside the existing `shape()` SVG system (still one JSON line):
- **2-tone fills + specular** — add a lighter rim + a white highlight blob to fruit for roundness (you already do this on tomato; extend to cherry/plum/grape/berry).
- **Depth** — keep the drop-shadow; add a faint contact shadow on the meniscus where the garnish rests.
- **Micro-life** — a slow idle bob/rotate after landing so garnish feels buoyant, not pasted.
- **Signature-only morph** — a lime wheel that morphs to a twist (MorphSVG) for a couture touch.
No new per-drink artwork; you're enriching motifs the token-scanner already places.

---

## 4. SIGNATURE TREATMENT (the 3 that must feel special)
`Tomato & Sprats Mary`, `Mushroom Old Fashioned`, `Smoked Plum Vodka` — keyed off `signature:true` + tokens:
- **Longer, layered timeline** (~2.8s) with an extra beat the others don't get.
- **A bespoke "essence" layer**: smoke curl (Mushroom/Smoked Plum/Tomato&Sprats via `smoke`/`smoked`/`mushroom` tokens) using effect I; the gold "Signature" label gets a one-shot glimmer.
- **This is the sanctioned place for per-drink authoring** (see §6): a hand-tuned smoke path or ember for these ≤3 items is acceptable because there are ≤3 and they're flagged in data. Everything else stays fully generic.

---

## 5. CHOREOGRAPHY, DURATION & PERF PLAN
**Longer but layered, not slower.** One GSAP timeline per opened card, ~2.2–2.8s total, staged so something is always arriving:
`0–0.9s` glass reveal (draw/materialise per glass) → `0.5–1.4s` pour + meniscus → `1.0–1.9s` garnish drops (staggered) → `1.4–2.4s` ripple + light-sweep → `2.0–2.8s` glow settle / dust thins / smoke dissipates.

**Mobile-Safari rules (non-negotiable):**
- **Only the open card animates.** You already gate on `.is-open`; keep that. The *scroll-reveal* on collapsed cards should stay light — a fade-up + optional quick sweep, **no canvas/particles/filters on scroll**.
- Animate **transform / opacity / filter** only; never layout props. Add `will-change` on entrance start, remove on complete.
- **One canvas, one filter region at a time**; destroy on close; cap particles ≤25, bubbles ≤12.
- **No infinite loops** except the existing cheap neon breathe; bubbles/dust loop only while open and stop on close (battery).
- **`prefers-reduced-motion`:** extend the block you already have — freeze to the finished state (drawn glass, full liquid, static glow, garnish resting, **no** dust/smoke/sweep/bubbles). Also honour it as a proxy for low-power. Kill `feDisplacementMap` here.
- **Test target:** a mid/low iPhone in Low Power Mode; watch for jank when opening a card *mid-scroll*.

---

## 6. GUARDRAILS FOR THE IMPLEMENTER (protect the constraints)
- **One-JSON-line law holds.** Entrance = f(`glass`, `signature`, ingredient tokens). Reuse the exact word-boundary scan from `garnishList()` for fizz/smoke/foam/chilli/ice detection. A new drink = one line, entrance auto-assigned.
- **Per-drink authoring is sanctioned ONLY for the ≤3 signatures** (bespoke smoke/ember), and even those key off tokens. No bespoke art for the other 27.
- **Palette is law.** New light/dust/glow/foam use only `--gold`/`--gold-light`/`--cream` and the drink's `--tint`; garnish colours are the sole off-palette accents; **magenta `--neon` stays logo-only.**
- **Don't break** what works: keep `pathLength="1"` for the glasses that *do* still draw (shots/rocks/stemmed), the accordion grid-rows trick, scroll-spy, the reduced-motion freeze, the `SURFACE` map (garnish must still land *in* the liquid).
- **GSAP loading:** self-host the UMD file (offline-safe on GitHub Pages) or CDN; register `DrawSVGPlugin`/`MorphSVGPlugin`/`MotionPathPlugin`; feature-detect and fall back to the current CSS transition if GSAP fails to load (progressive enhancement — the menu must never depend on JS animation to be readable).

## 7. REFERENCE ANCHORS (concrete, mapped to effects)
- **Apple product pages** (AirPods Pro, Apple Watch Ultra, iPhone) → specular light-sweep (L), spring/overshoot (B), restrained scroll-choreographed reveals. The gold standard for "expensive through restraint."
- **Patrón — "Art of Patrón" / patrontequila.com** → premium liquid & gold-on-dark motion (C, G).
- **Hendrick's Gin (hendricksgin.com)** → Victorian-deco whimsy, botanical/particle drift (H, garnish).
- **Hennessy, Dom Pérignon, The Macallan** → luxury dark+gold restraint, slow reveals (B, G) — your tonal north stars.
- **Aviation Gin / Monkey Shoulder / Espolòn** → contemporary spirit-brand motion, liquid + type.
- **Diageo brand sites (Johnnie Walker, Tanqueray)** → liquid/pour and gold linework (C).
- **Dead Rabbit (deadrabbit.com) & Employees Only** → your own reference bars; art-deco line-art idiom (A) — proof the draw-on *is* on-brand when varied.
- **Awwwards "Sites of the Day" in the spirits/cocktail category** → pour/refraction/particle showcases; mine for pacing, not palette.
- **Cocktail apps (Mixel, Highball)** → tasteful recipe-reveal motion and garnish iconography (K, garnish).
- **Technique anchors:** Codrops/tympanus.net (SVG line-drawing & filter tutorials — A, I); Lucas Bebber's "Gooey" on CSS-Tricks (I); GSAP DrawSVG/MorphSVG/MotionPath demos (A, B, J); tsParticles "pollen"/bokeh presets (H).

**Priority order for max "want-to-drink-it" per effort:** (1) Variety system §2 + varied line reveals (A) — kills the core complaint; (2) Pollen materialise (H) on mug + fizz — fixes the two he named, delivers "magic"; (3) light-sweep (L) + spring easing (B) — cheap "expensive"; (4) pour+meniscus (C) + bubbles (E) — juice/appetite; (5) signature smoke (I) — couture accent; (6) richer garnish + condensation (F) — finishing polish.

---

**Итог (recap):**
- **Задача:** собрать богатое меню премиальных, «сочных» анимаций входа для карточек напитков, привязанное к реальному коду (GLASS/гарнир), под mobile Safari, без сборки, в рамках палитры.
- **Решено:** да — выдан полный каталог из 12 эффектов + система вариативности «тип бокала → своя анимация», прямые ответы на каждую претензию клиента, рекомендация по технологии (GSAP + лёгкий canvas, WebGL — только для 3 сигнатур), бюджет производительности и правила reduced-motion.
- **Эффективность метода:** высокая — сначала прочитал `app.js`/`styles.css`/`menu.json`, поэтому все советы конкретны и внедряются точечно, без нового арта; правило «один напиток = одна строка JSON» сохранено.
- **Было → стало:** было — одинаковый «обвод по кругу» у всех 30 позиций (~1с, дёшево-повторяемо) → стало — 7 разных характерных входов по типам бокала, «магическое проявление из золотой пыльцы» для кружки и физза, слоистая хореография ~2.5с, отдельная подача для сигнатур.