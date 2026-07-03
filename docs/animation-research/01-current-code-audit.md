# Stuora QR-Menu — Animation System Reference

A precise, current-state catalogue of every animation in the site. All pointers are `file:line`. Files audited: `app.js`, `styles.css`, `menu.json`, `index.html`; intent cross-checked against `design-spec.md` §5 and `PROJECT.md`. Absolute paths: `c:/Users/Admin/projects/QR StuoraMenu/{app.js,styles.css,menu.json,index.html}`.

---

## 0. Global mechanics (read first)

- **Everything is vanilla CSS transitions + `@keyframes`.** Zero JS animation, zero libraries, no `requestAnimationFrame`. JS only toggles two classes; CSS does all motion.
- **Two and only two triggers exist:**
  1. **Scroll-reveal** — the `.revealed` class added to a `.card` by an `IntersectionObserver` (`app.js:401-410`). Drives the *collapsed thumbnail* glass draw + liquid fill and the card fade-up. Fires **once** per card (`obs.unobserve`, `app.js:405`).
  2. **Tap-open** — the `.is-open` class toggled on a `.card` by `toggleCard` (`app.js:379-391`). Drives the entire *pour stage* (hero glass, glow, garnish, splash) or the *bites assembly*, plus the accordion and chevron.
- **Shared easing:** `--ease: cubic-bezier(.22,.61,.36,1)` (`styles.css:30`) — an ease-out used by virtually every transition/animation. A few use plain `ease` inside keyframes.
- **The "draw-itself" trick (used in two places):** the outline `<path>` gets attribute `pathLength="1"` (thumbnail `app.js:78`, hero `app.js:88`). CSS sets `stroke-dasharray:1; stroke-dashoffset:1` and transitions `stroke-dashoffset → 0`. Because `pathLength="1"` renormalises the *entire concatenated path* (all sub-paths, in document order) to total length 1, a single dash of length 1 starts fully pushed out of view and slides in as one continuous pen-stroke. Thumbnail: `styles.css:317-327,335`. Hero: `styles.css:461-470,479`.
- **The "fill" trick (used in two places):** the `liquid` `<path>` is `transform: scaleY(0)` with `transform-box: fill-box; transform-origin: 50% 100%`, transitioning to `scaleY(1)` — it rises from the base of its own fill-box. Thumbnail: `styles.css:328-336`. Hero: `styles.css:471-480`.
- **Stage DOM** is built in JS: `drinkStage()` (`app.js:238-243`) = `.stage-glow` + hero glass + garnish layer + splash; `bitesStage()` (`app.js:273-279`) for plates. The wrapper `.pour-stage` gets `--tint` and `--surf` custom props set inline (`app.js:349-350`), and `is-bite` when `glass==="plate"` (`app.js:347`).

---

## 1. Full animation catalogue

| # | Name | Trigger | Mechanism | Duration / delay / easing | Elements |
|---|---|---|---|---|---|
| 1 | Neon breathe | always-on loop | `@keyframes neon-breathe` opacity 1→.86 + shrinking text-shadow | 5.5s, no delay, `--ease`, `infinite` | `.logo-neon` |
| 2 | Thumbnail outline draw | scroll-reveal | `stroke-dashoffset 1→0`, `pathLength=1` | 1.1s, no delay, `--ease` | `.glass .outline` |
| 3 | Thumbnail liquid fill | scroll-reveal | `scaleY 0→1`, fill-box | 0.85s, **.15s** delay, `--ease` | `.glass .liquid` |
| 4 | Card reveal fade-up | scroll-reveal | `opacity 0→1`, `translateY(18px)→0` | 0.7s, no delay, `--ease` | `.card` |
| 5 | Accordion open | tap-open | `grid-template-rows 0fr→1fr` + opacity + visibility | 0.38s, `--ease` | `.card-detail` |
| 6 | Chevron rotate | tap-open | `transform: rotate(90deg)` + opacity | 0.35s, `--ease` | `.chev-toggle` |
| 7 | Stage glow bloom | tap-open | `opacity 0→.34`, `blur(7px)` radial | 0.9s, **.4s** delay, `--ease` | `.stage-glow` |
| 8 | Hero outline draw | tap-open | `stroke-dashoffset 1→0`, `pathLength=1` | 1s, **.1s** delay, `--ease` | `.hero-glass .h-outline` |
| 9 | Hero liquid pour | tap-open | `scaleY 0→1`, fill-box | 0.9s, **.5s** delay, `--ease` | `.hero-glass .h-liquid` |
| 10 | Garnish drop motes | tap-open | `@keyframes mote-drop` fall + bounce | 0.9s, per-mote delay `--d` (.5s +), `--ease`, `both` | `.mote` (×1–4) |
| 11 | Juice ripple | tap-open | `@keyframes ripple` scale .3→1.5, fade | 1s, **1.05s** delay, `--ease` | `.splash .ripple` |
| 12 | Juice droplets | tap-open | `@keyframes droplet` rise + fade | 0.7s, per-drop delay `--dd` (~1.02s+), `--ease` | `.splash .drop` (×4) |
| 13 | Bites layer assembly | tap-open (plate) | `@keyframes layer-stack` drop into stack | 0.55s, per-layer delay `--d`, `--ease`, `both` | `.layer` (×4–5) |
| 14 | Scroll-spy gilding | scroll (observer) | class `.active` toggled; color/border/box-shadow transition | 0.3s, `--ease` | `.tab` |
| 15 | Tab smooth-scroll | tap tab / spy | `scrollIntoView({behavior:"smooth"})` | native | window / `.tabs` |
| 16 | Frosted glass (static) | always | `backdrop-filter: blur(9px) saturate(1.1)` | none (not motion) | `.tabs`, `.tab.active` glow |

### Per-animation detail

**1. Neon breathe** — `styles.css:121` applies `animation: neon-breathe 5.5s var(--ease) infinite` to `.logo-neon`; keyframes at `styles.css:123-128` dip opacity to .86 and swap to a smaller 5-layer magenta `text-shadow` at the 48% mark, then return. Only always-running animation on the page. Touches the single `<span class="logo-neon">Stuora</span>` (`index.html:31`). This is the "one magenta neon reserved for the logo" per design law.

**2. Thumbnail outline draw** — the small line-art glass in every collapsed card row. SVG built by `glassSVG()` (`app.js:71-79`): `<path class="outline" pathLength="1" d="…">` inside `.glass-wrap` (46×60px, `styles.css:315`; viewBox `0 0 100 130`). Start state `stroke-dashoffset:1` (`styles.css:326`); `.card.revealed .glass .outline { stroke-dashoffset:0 }` (`styles.css:335`) drives it. Stroke is `--gold`, width 1.6, round caps/joins (`styles.css:318-322`).

**3. Thumbnail liquid fill** — `<path class="liquid" fill="${tint}">` (`app.js:74`). `scaleY(0)→scaleY(1)` on reveal (`styles.css:336`), opacity .82. Only emitted when the glass type *has* a `liquid` path **and** the item has a `tint` (`app.js:73`) — so `plate` items (no `liquid` key, `app.js:46-49`) have no fill.

**4. Card reveal fade-up** — `.card` starts `opacity:0; transform:translateY(18px)` (`styles.css:291-293`); `.card.revealed { opacity:1; transform:none }` (`styles.css:295`). Observer in `initReveal()` (`app.js:395-411`): `rootMargin:"0px 0px -8% 0px", threshold:0.08`, un-observes after firing (one-shot). No-IO fallback marks all cards revealed immediately (`app.js:397-400`).

**5–6. Accordion + chevron** — `toggleCard()` (`app.js:379-391`) is single-open: before opening a card it removes `.is-open` from any other open card (`app.js:382-388`), then toggles `.is-open` and updates `aria-expanded`. The detail uses the grid-rows height trick: `.card-detail { grid-template-rows:0fr; opacity:0; visibility:hidden }` (`styles.css:387-393`) → `.card.is-open .card-detail { grid-template-rows:1fr; opacity:1; visibility:visible }` (`styles.css:394-399`); inner wrapper is `overflow:hidden` (`styles.css:400`). Chevron `›` rotates to 90° (`styles.css:384`).

**7. Stage glow** — `.stage-glow` (`styles.css:443-457`) is a 132×132 radial-gradient disc of `--tint`, positioned at `top:var(--surf,84px)`, `filter:blur(7px)`, `opacity:0` → `.card.is-open .stage-glow { opacity:.34 }` (`styles.css:457`). Longest lead-in delay of the "bloom" group (.4s). Note: `backdrop-filter`-free (just a blurred element), cheaper than the tab frost.

**8–9. Hero pour glass** — built by `heroGlassSVG()` (`app.js:82-89`): `.hero-glass` 116×150 (`styles.css:460`), same viewBox, `drop-shadow` (`styles.css:478`). `.h-outline` draws (`styles.css:461-470`, on-state `:479`); `.h-liquid` pours (`styles.css:471-477`, on-state `:480`). The staggered delays (.1s draw, .5s liquid) create the "made-to-order" pour choreography.

**10. Garnish motes** — `garnishLayer()` (`app.js:210-226`) emits up to 4 `.mote` spans, each carrying inline custom props `--x,--y,--r,--d,--sz` and an inline 24×24 motif SVG. `.mote` sits at `left:50%; top:0; opacity:0` (`styles.css:484-493`). On open: `animation: mote-drop .9s var(--ease) var(--d) both` (`styles.css:495`). Keyframes `mote-drop` (`styles.css:496-502`): start at `translate(--x, -34px) scale(.5)` opacity 0; fade in by 30%; reach `(--x,--y)` at 68%; **overshoot up 7px at 80% (the bounce)**; settle at 100%. Per-mote values computed at `app.js:216-221`: `--x = round((t-0.5)*44)` spread across the mouth, `--y = base + (i%2?11:2) + i*2`, `--r` alternating tumble, `--d = 0.5 + i*0.15`s staggered fall, `--sz` 19 or 22px.

**11–12. Juice splash** — `splashLayer()` (`app.js:229-235`): one `.ripple` + four `.drop` (dx = −12,−4,5,12; dd = 1.02+i·0.05s, `app.js:231-233`). `.ripple` (`styles.css:506-516`) is a `--tint`-bordered ellipse at `top:var(--surf)`; on open `animation: ripple 1s var(--ease) 1.05s` (`styles.css:517`), keyframes scale .3→1.5 fade (`:518-521`). `.drop` (`styles.css:522-532`) are 6px `--tint` dots; `animation: droplet .7s var(--ease) var(--dd)` (`:533`), keyframes rise 2px→−24px + fade (`:534-538`). These fire *last* in the timeline, i.e. as the garnish lands.

**13. Bites layer assembly** — plates (`glass:"plate"`) route to `bitesStage()` (`app.js:273-279`) via the `isBite` branch (`app.js:346-348`). `bitePieces()` (`app.js:248-271`) returns an ordered array of layers: a `DISH` base ellipse pair (`app.js:246`) plus name-driven pieces — **sandwich** path builds bread→spread→toppings (`app.js:250-257`); otherwise a **pickle** scatter of `cuke/onion/olive/garlic` inline SVGs (`app.js:260-269`). Each `.layer` carries `--ly,--lx,--d` and width. `.layer` starts `translate(-50%,-42px) opacity:0` (`styles.css:542-548`); on open `animation: layer-stack .55s var(--ease) var(--d) both` (`:550`), keyframes drop from −42px to `--ly` with slight `scale(.9)→1` (`:551-555`). Delays in the data (`0s, .16s, .28s…`) sequence the stacking.

**14. Scroll-spy** — `initScrollSpy()` (`app.js:415-424`): a second `IntersectionObserver`, `rootMargin:"-64px 0px -70% 0px", threshold:0`, calls `setActiveTab()` (`app.js:426-433`) which toggles `.active` and `scrollIntoView`s the active tab to center. `.tab` transitions color/border/background 0.3s (`styles.css:201`); `.tab.active` gets gold border + `box-shadow` glow (`styles.css:212-218`).

**15. Smooth scroll** — tab tap → `section.scrollIntoView({behavior:"smooth",block:"start"})` (`app.js:294-297`); reinforced by `html { scroll-behavior:smooth }` (`styles.css:35`).

**16. Frosted glass (not motion, but perf-relevant)** — `.tabs` uses `backdrop-filter: blur(9px) saturate(1.1)` (+ `-webkit-` prefix) (`styles.css:180-181`). This is the single most expensive GPU effect on the page during scroll on Mobile Safari and is the one thing to watch for jank/battery — flagged here because the next implementer must respect the 60fps/battery constraint.

### Pour-stage orchestration timeline (on tap-open)

Reading the delays together, one tap plays a deliberate "pour" sequence:

```
t=0.10s  hero outline begins drawing        (1.0s)
t=0.40s  stage-glow blooms                   (0.9s)
t=0.50s  hero liquid pours up                (0.9s)
t=0.50s+ garnish motes tumble & bounce       (0.9s each, staggered +0.15s)
t=1.05s  ripple expands at the surface       (1.0s)
t~1.05s+ droplets leap and fade              (0.7s each, staggered)
```

---

## 2. Why all 7 outline draws look identical — and why mug/highball read clumsy while gimlet/coupe read elegant

### Why the *gesture* is identical for every glass

Every glass type is drawn by the **same one-line trace**: identical `pathLength="1"` (`app.js:78,88`), identical `stroke-dasharray:1; stroke-dashoffset:1→0` (`styles.css:324-326,335,467-468,479`), identical duration/easing, identical stroke (`--gold`, round caps/joins). `pathLength="1"` normalises the **whole `d` string** — *including every sub-path* — to total length 1, and the single length-1 dash slides in uniformly. So no matter how many sub-paths a glass has, the animation is always "one continuous pen draws the entire silhouette, top-of-string to end-of-string, at constant normalised speed." The signature moment is the *uniform single trace*, not the glassware — which is exactly why all seven feel like the same effect.

### How each `GLASS` path is composed (`app.js:21-50`) and where the trace starts

| Glass | Sub-paths | Composition & draw order | Feel |
|---|---|---|---|
| **shot** (`:23`) | 1 closed (`…Z`) | top-left rim → down left wall → round base → up right wall → `Z` closes the **rim last** | box, but small so mild |
| **rocks** (`:27`) | 1 closed | same tumbler loop, wider/shorter | box |
| **highball** (`:31`) | 1 closed | start top-left, **two very long parallel verticals** dominate, `Z` snaps the rim across at the end | mechanical "U + lid" |
| **mug** (`:43`) | **2** (body closed + handle open) | tumbler body `…Z`, then pen **jumps** to `(66,62)` and draws a detached C-handle as a trailing stroke | two disjoint gestures |
| **martini** (`:35`) | **3** open/closed | bowl triangle (`M22,32 L78,32 L50,76 Z`) → stem (`M50,76 L50,112`) → foot (`M34,114 L66,114`), **top→bottom** | sketch gesture |
| **coupe** (`:39`) | **4** open | rim chord (`M26,40 L74,40`) → bowl curve (`Q50,74`) → stem → foot, **top→bottom** | sketch gesture |
| **plate** (`:48`) | 2 (ellipse + arc) | plate ellipse `…Z` then inner arc; no liquid | quiet, flat |

### Why mug + highball read clumsy

- **They are a single closed box.** highball (`app.js:31`) and the mug body (`app.js:43`) start at the **top-left rim corner and immediately crawl down one long vertical wall**, across the base, up the other equally-long vertical, and the `Z` draws the **rim (top opening) LAST**. For most of the animation the pen is grinding out two parallel straight verticals — there's no expressive curve, and the glass looks bottomless/open until a lid-line snaps across at the final instant. That reads as utilitarian, not drawn.
- **The mug is worse because of its second sub-path.** After the body's `Z`, the concatenated trace **teleports** from the rim to `(66,62)` and draws the handle `Q82,64 82,82 Q82,100 66,102` as a separate, detached, un-closed loop hanging off the wall (`app.js:43`). One silhouette becomes **two disconnected gestures**, the second one a lopsided "ear" that starts in mid-air. The single-pen illusion breaks.

### Why the stemmed gimlet/coupe (and martini) read elegant

- **They are several short OPEN sub-paths ordered top→bottom** (`app.js:35,39`). The trace naturally reads as *bowl → stem → foot* — exactly the order a person sketches a cocktail glass. The **first gesture is the expressive wide bowl** (a confident triangle for martini, a shallow `Q` cup for coupe), not a long wall.
- **Strong element contrast carries the eye:** a wide shallow bowl, then a single quick thin vertical stem, then a small foot bar. The thin stem between two graceful wide shapes gives rhythm and proportion. The tumblers have none of that contrast — just a rectangle.
- **No pen-jump feels wrong** because the sub-path breaks land at *anatomically expected* seams (bowl-to-stem, stem-to-foot), so the eye reads them as pen lifts a sketcher would make, not as glitches.

**Net:** clumsy = one closed box dominated by long parallel verticals with the rim drawn last (highball), optionally plus a detached appended handle (mug). Elegant = multiple short open sub-paths drawn top-to-bottom with a wide bowl first and a thin stem for contrast (martini, coupe). Same trace engine, opposite path composition.

---

## 3. Garnish system

### `GARNISH_TOKENS` — keyword → motif map (`app.js:155-184`)

An ordered array of rows `{ t:[keywords], k:shapeKey, c:colour }`. **Order matters — specific terms precede generic** (comment `app.js:154`); e.g. `raspberry/blackcurrant/redcurrant/lingonberry` all map to shape `berry` but with distinct colours and sit before the generic `citrus` catch-all at the end (`app.js:183`). Colours here are the **only sanctioned off-palette accents** (real fruit/herb hues like `#c04a63`, `#8fa04a`, `#d68327`). 28 rows covering the actual `menu.json` vocabulary (berries, cherry, plum/quince/passionfruit, grape, tomato, sprat→fish, citrus, pine, dill/mint/herb→leaf, hibiscus→flower, chilli, mushroom, horseradish/carrot/ginger→root, rhubarb→stalk, pineapple, coconut, vanilla→bean, jasmin/oolong/kombucha→leaf).

### `shape(k, c)` — motif renderer (`app.js:96-152`)

A `switch` returning an inline SVG fragment (24×24 viewBox) per shape key. Cases: `cherry, round, grape, tomato, fish, citrus, pine, leaf, flower, chilli, mushroom, root, stalk, pineapple, coconut, bean`, and **`default` = berry cluster** (`app.js:148-150`). A shared `HERB = "#6c8a3a"` constant (`app.js:95`) draws stems/leaves/caps consistently across motifs. `c` is the token colour; some motifs hardcode small accents (citrus pith `#f5e6c8`, flower centre `#e0be3f`, fish eye `#2a2f33`).

### `garnishList(item)` — matching (`app.js:186-204`)

- **Haystack = `item.name` + `item.ingredients` joined, lowercased** — deliberately **not** the prose `description` (`app.js:190-191`), so descriptive words don't trigger stray garnish.
- **Matcher = `\b` + term + `s?` + `\b`** (`app.js:192`): whole-word with optional plural. This is why `pine ≠ pineapple`, `herb ≠ herbal`, `currant ≠ redcurrant` (noted in the comment `app.js:188-189`).
- Iterates tokens in order; pushes `{k,c}` **deduped by `k+c`** (`app.js:196-199`); **caps at 4** for restraint (`app.js:200`).
- **Fallback:** if nothing matched, one `berry` motif tinted with `item.tint` (or `#b5455f`) (`app.js:202`) — so every drink drops at least one thing.

### `SURFACE` landing map (`app.js:207-208`)

`SURFACE = { martini:58, coupe:60, highball:84, shot:94, rocks:92, mug:88, plate:96 }`; `surfaceY(type)` returns the value or `90` default. This Y (in the 158px stage) is used **twice**: (a) as the garnish `base` in `garnishLayer` (`app.js:213`) so motifs settle *into the liquid surface* of that glass, and (b) written to CSS as `--surf` on the stage (`app.js:350`), which positions `.stage-glow` (`styles.css:446`), the ripple (`styles.css:509`), and the droplets (`styles.css:524`). So the flavour-coloured splash and glow all key off the same surface line as the garnish.

### `garnishLayer(item)` — placement math (`app.js:210-226`)

Emits `<span class="garnish-layer">` containing up to 4 `.mote`s. Per mote i of n: `t=i/(n-1)` (or 0.5 if single); `--x = round((t-0.5)*44)` spread across the mouth; `--y = base + (i%2?11:2) + i*2` settle depth; `--r = ±(8+i*7)deg` tumble; `--d = (0.5+i*0.15)s` staggered fall; `--sz = 19 (+3 on odd)`. Each mote wraps `shape(m.k,m.c)` in a 24×24 SVG.

**Adding a new drink stays one JSON line:** the garnish is derived entirely from `name`+`ingredients` scanning — no per-drink artwork. Per-drink *bespoke* authoring exists **only** for bites, in `bitePieces()` (`app.js:248-271`), which branches on the dish name.

---

## 4. Reduced-motion block (`styles.css:631-645`)

`@media (prefers-reduced-motion: reduce)` freezes every animation to a tasteful finished end-state (nothing is left half-drawn):

| Line | What it freezes | End state shown |
|---|---|---|
| `632` | `html scroll-behavior:auto` | no smooth scroll |
| `633` | `.logo-neon animation:none` | neon breathe stopped (full glow held) |
| `634` | `.card transition:opacity .3s; transform:none` | reveal keeps a gentle **fade only**, no translate |
| `635` | `.glass .outline` | `transition:none; stroke-dashoffset:0` — thumbnail glass shown **fully drawn** |
| `636` | `.glass .liquid` | `transition:none; scaleY(1)` — thumbnail **fully filled** |
| `637` | `.chev-toggle, .card-detail transition:none` | accordion **snaps** open/closed instantly (still functional) |
| `639` | `.hero-glass .h-outline` | `transition:none; stroke-dashoffset:0` — hero **fully drawn** |
| `640` | `.hero-glass .h-liquid` | `transition:none; scaleY(1)` — hero **fully poured** |
| `641` | `.stage-glow` | `transition:none; opacity:.3` — glow shown **static** |
| `642` | `.mote` | `animation:none; opacity:1; translate(--x,--y) rotate(--r)` — garnish shown **already landed** (no drop/bounce) |
| `643` | `.splash` | `display:none` — ripple + droplets **removed entirely** |
| `644` | `.layer` | `animation:none; opacity:1;` final `translate(--lx,--ly)` — bites shown **already assembled** |

Note the deliberate asymmetry: card reveal keeps a soft 0.3s opacity fade (`:634`) rather than being fully static, but the splash is the one element deleted outright (`:643`) rather than frozen — it has no meaningful still frame.

---

## Appendix — DOM / class map for a fresh session

- Collapsed row: `.card > button.card-head > .glass-wrap > svg.glass > g.glass-g > (path.liquid, path.outline)` (`app.js:76-78,328`).
- Expanded drink: `.card-detail-inner > .pour-stage[style=--tint,--surf] > (.stage-glow, svg.hero-glass>(path.h-liquid,path.h-outline), .garnish-layer>.mote*, .splash>(.ripple,.drop*4))` (`app.js:238-243,343-351`).
- Expanded bite: `.pour-stage.is-bite > .hero-plate > .layer*` (`app.js:273-279,347`).
- Glass silhouettes live only in the `GLASS` object (`app.js:21-50`); flavour colours + glass type live only in `menu.json` (`glass`, `tint`). 30 items, 7 glass types (`shot/rocks/highball/martini/coupe/mug/plate`).