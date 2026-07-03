I have the full picture now — I've read `menu.json`, and the `GLASS` + `GARNISH` + animation systems across `app.js` and `styles.css` (the actual motion lives in CSS: `stroke-dashoffset` trace + `scaleY` liquid + the `mote-drop`/`splash`/`layer-stack` keyframes). Here is the choreography brief.

---

# Stuora — Per-Glass Motion Choreography Brief

## 0. The diagnosis (why it currently feels cheap)
Every glass draws with the identical mechanism: `pathLength="1"` + `stroke-dashoffset: 1→0`. That trick can only trace from **one fixed start point in one direction**, so all 30 items trace the same way — on both surfaces where it fires:
- **List surface** (`.glass-wrap`, small 46×60 glass, on scroll-reveal) — 30 identical traces as you scroll = the "everything is the same" feeling.
- **Hero surface** (`.hero-glass`, 116×150, on tap-open) — same trace again, plus mote-drop garnish.

The fix is a **per-glass motion identity** that varies draw origin/direction/technique, expressed compactly in the list and lavishly in the hero.

## 1. Recommended technique change (answers "is a different technology possible?")
**Yes — adopt GSAP as a single UMD `<script>` (zero build, GitHub-Pages-safe), layered as progressive enhancement over the existing CSS (if the CDN is blocked, current CSS trace still runs).**

| Plugin (all now free, UMD) | What it unlocks that CSS cannot |
|---|---|
| **DrawSVGPlugin** | Draw a stroke from **any origin, any direction, reversed, or as a partial segment**, and stagger multi-subpath outlines in a chosen order. This alone kills "everything traces from the same point" — same path data, different draw per glass type. |
| **MotionPathPlugin** | Garnish that arcs/spirals/floats in on a curve (a citrus twist that actually spirals, pollen that drifts) instead of a straight tumble. |
| Core timeline + `gsap.matchMedia()` | Real sequencing (draw→fill→garnish→settle), per-glass easing, and a clean `prefers-reduced-motion` branch that snaps to the static end-state. |

**Particles (pollen / dust / effervescence / smoke):** do **not** add a heavyweight engine. Use one tiny `<canvas>` spun up only for the **open** card (the accordion is single-open, so never more than one instance), capped at ~20–24 particles, `requestAnimationFrame`, DPR-capped, and **torn down on close**. Particles fire **only on tap, never during scroll** — this protects 60fps scrolling and battery on iPhone. No WebGL, no `backdrop-filter` added.

## 2. Architecture: two surfaces, one identity
Each drink gets a **motion signature** derived entirely from data — `glass` picks the entrance family; `tint` colours liquid/glow/particles; an ingredient/name scan picks the **particle mood**; `signature:true` adds a flourish. The list reveal plays a 1–1.5s compact version of that identity (transform/DrawSVG only, cheap); the hero plays the full 2.4–3.4s version with particles.

## 3. Master mapping — 7 distinct entrances

| Glass (count) | Silhouette entrance (origin / technique) | Liquid behaviour | Garnish / particle treatment | Timing (list → hero) |
|---|---|---|---|---|
| **shot** (13 infusions) | **Etch + glint.** Both walls DrawSVG **upward from the base**, mirrored, decisive; a single brass sheen sweeps L→R once as it sets (a stamped maker's-mark, not a slow trace). | Brisk bottom-up fill with a small **overshoot + meniscus wobble** — a quick pour that settles. | Minimal: **one** hero garnish perched on the rim (no tumble). Particle mood by scan (smoke for "smoked", none otherwise). | 1.0s → **1.8s** (deliberately crisp — there are 13). |
| **rocks** (4) | **Set down + ice.** Outline **fades and drops in from above with a weighty settle** (placed on the bar), then a brass-outlined **ice cube tumbles in and lands** — the rocks-only motif. | Slow, viscous fill that **pours over the ice**, with a refraction highlight around the cube. Spirit-forward, no bubbles. | One placed twist/cherry with an **expressed-oil glint**; particle = spore/ember/none by scan. | 1.4s → **2.6s** (heavy ease, weighty). |
| **highball** (3) — *redesign* | **Condense from effervescence.** No trace: a **rising column of bubbles/pollen** streams up and the gold outline **sets bottom→top in its wake** — conjured by the fizz. | Bottom-up fill with **continuous fine effervescence**; gentle looped bubbling after fill (low count). | **Pollen/aroma dust** drifting at the mouth + bubbles inside; stalk/wedge rests on the rim. | 1.4s → **3.0s** (dreamy). |
| **martini** (2) | **Precision V.** The two rim points DrawSVG **downward and converge at the cone's tip**, then stem draws down, foot draws outward — pure deco geometry. | Cone fills from the **tip up**; a single garnish **descends vertically on an unseen pick** to the vertex with a micro-splash. | One **skewered, centred** garnish — deliberate placement, not a tumble. | 1.2s → **2.4s** (sharp, precise ease). |
| **coupe** (4) — *preserve* | **Blown-glass curve (the one he loves).** Keep the graceful stemmed self-draw: rim arc L→R, bowl curve, stem down, foot — one unhurried gold line, refined with a soft shimmer settle at the end. | Gentle rise; **frothy meniscus cap if `egg white` present** (data-driven foam). | Airy **drift-and-settle** — petals/berries float down slowly. | 1.5s → **2.8s** (soft, the luxury benchmark). |
| **mug** (1) — *redesign* | **Frost-mist materialise.** No trace: a cloud of cold **frost-dust/vapour gathers** and the copper mug **resolves from blurry→crisp within the mist**, handle last. | Vigorous **ginger-beer effervescence** filling with deep tint, plus a **slow chilli-ember warm glow that breathes once** at the base (cold mist above, warm ember below). | Pollen/frost-dust drift; berries + chilli + lime settle. Ember glow is the signature effect. | 1.4s → **3.2s** (atmospheric). |
| **plate** (3 bites) | **Plating.** Oval draws in one quick sweep, then components are **placed one-by-one** with soft drop-shadows (chef plating — already distinct; keep & enrich). | None (food). | Final **dusting flourish** (pepper/herb flecks sprinkle as the last beat); optional steam wisp. | — → **2.6s** (staggered placement). |

**Hero beat structure (consistent skeleton, per-glass weighting):** (1) vessel forms → (2) liquid → (3) garnish → (4) settle/signature. Each glass just redistributes the time and swaps the technique in beat 1 and the particle in beats 2–3.

## 4. Signature flourish (Tomato & Sprats Mary, Mushroom Old Fashioned, Smoked Plum Vodka)
Driven off `signature:true`, layered on top of the glass entrance:
- **A brass "✦ Signature" filigree seal etches in** beside the finished glass as a final beat, and the `stage-glow` pulses once more (a held, richer close). Longer hold (~+0.4s).
- **Themed particle**, auto-selected from ingredients (no per-drink art):
  - **Tomato & Sprats Mary** (highball, "smoke curling / briny") → **smoke curl + briny salt-sparkle** (its highball entrance stays condense-from-particles, but the particle *flavour* is smoke, not bright pollen).
  - **Mushroom Old Fashioned** (rocks, "woodland") → **warm spore-dust drift** settling downward, plus the rocks ice cube.
  - **Smoked Plum Vodka** (shot, "woodsmoke") → a slow **smoke wisp rising** from the shot's surface — turns the plainest vessel (a shot) into a small piece of theatre.
- Magenta stays **logo-only**; all signature accenting is brass.

## 5. Per-drink notes (every drink the client named)

| Drink | Glass | Verdict | Note |
|---|---|---|---|
| **Quince Gimlet** | coupe | **PRESERVE** | Keep the exact blown-glass stemmed draw he loves; only lengthen (~2.8s) and add the shimmer settle. Honeyed quince → warm gold `tint`, a `round`(quince) garnish drifting down. |
| **Vanilla & Grape Daiquiri** | coupe | **PRESERVE** | Same beloved stemmed reveal. Grape cluster + vanilla-pod garnish drift-settle; soft mauve tint. Do **not** change the mechanism. |
| **Rhubarb Fizz** | highball | **REDESIGN** | Kill the tall trace. Blush bubbles rise → glass sets in their wake → continuous fizz fill → **pollen drift** → rhubarb `stalk` rests on rim. This is the flagship "magical" highball. |
| **Blackcurrant & Chilli Mule** | mug | **REDESIGN** | Kill the clumsy mug/handle trace. **Frost-mist gathers → copper mug resolves from mist (handle last) → ginger-beer effervescence fills → chilli-ember glow breathes once → berries+chilli+lime settle.** The mug becomes the most magical card. |
| **Tomato & Sprats Mary** | highball | **SIGNATURE** | Highball condense-entrance but **smoke-flavoured** particles + briny sparkle; sprat + tomato garnish (upgraded, see §6); ✦ seal + extra hold. |
| **Mushroom Old Fashioned** | rocks | **SIGNATURE** | Rocks set-down + **ice cube**, then **spore-dust** drift; mushroom garnish placed with oil-glint; ✦ seal. |
| **Smoked Plum Vodka** | shot | **SIGNATURE** | Shot etch-glint, then a **rising smoke wisp**; plum `round` garnish on the rim; ✦ seal — theatre from the humblest glass. |

## 6. Garnish icon upgrades (richer sprat/tomato & friends)
Client likes the sprat and tomato and wants tastier variants. All stay inline-SVG and keyword-driven (adding a drink is still **one JSON line**):
- **Master "candied/wet" pass (authored once, applies to all motifs):** add a reusable `<defs>` 2-stop gradient + a single specular highlight + soft drop-shadow so every fruit reads glossy and appetising instead of flat.
- **Sprat:** add fine scale cross-hatch, a brass belly highlight, gill line and a small tail-fan — a jewel-like fish, same silhouette.
- **Tomato:** deeper-red rim → bright centre gradient, a crisp specular gloss and a tiny water-droplet — "ripe and wet."
- **Berries:** per-drupelet highlights (raspberry), a frosted bloom on blackcurrant.
- **Citrus:** pith ring + glossy wedge highlight + two juice droplets.
- **Per-glass garnish *motion*** (via MotionPath): martini = single skewered vertical descent; coupe = airy slow drift; rocks = one placed twist with oil-glint; highball/mug = float in on the pollen/fizz. Same motif set, different behaviour by glass — more variety at zero extra art.

## 7. Data-driven model + where per-drink authoring is worth it
Add a `PARTICLE_TOKENS` scan mirroring `GARNISH_TOKENS`, so the **particle mood is derived, never hand-set**:
- `smoked`/`smoke`/`sprat`/`brine` → **smoke** · `mushroom` → **spore** · `chilli`/`chili` → **ember** · `soda`/`ginger beer`/`tonic`/`kombucha`/`sparkling` → **effervescence** · highball/mug fruity default → **pollen** · else glass default (rocks→ice, coupe→petals, martini/shot→none).
- Effervescence also auto-true when `glass ∈ {highball, mug}`.
- Result: **adding a new drink = one JSON line**; its entrance, liquid, garnish, particle mood and signature flourish are all inferred from `glass` + `tint` + `ingredients` + `signature`. No bespoke per-drink artwork.

**Where per-drink authoring is genuinely worth it (and acceptable per the brief):** only the **Bites plating layouts** (`bitePieces()` in app.js already hand-authors sandwich vs pickle stacks). Food plating benefits from real per-dish composition, and there are only 3. Everything else stays fully generative.

## 8. Guardrails (must-hold constraints)
- **Scroll = cheap:** list reveal uses DrawSVG + transform/opacity only, `IntersectionObserver` unobserve-after-reveal (already present). **No particles during scroll.**
- **Particles = tap-only, one instance, ≤24 motes, canvas torn down on close.** No WebGL, no added `backdrop-filter`.
- **`prefers-reduced-motion`:** `gsap.matchMedia()` reduced branch snaps to the tasteful static end-state (fully-drawn gold glass, filled liquid, garnish at rest, seal shown) — no canvas created at all. Mirrors the existing reduced-motion CSS block.
- **Palette lock:** brass/bordeaux/cream only; garnish colours are the only off-palette accents; magenta reserved for the logo. Smoke = grey-brass, pollen/ember = warm brass/tint, never neon.
- **Longer & luxurious:** all durations lifted from ~1s to 1.8–3.4s per the client's wish, with the coupe (his favourite) as the pacing benchmark.

Relevant files for the implementer: motion lives in `c:/Users/Admin/projects/QR StuoraMenu/styles.css` (trace/fill/mote/splash/layer keyframes) and `c:/Users/Admin/projects/QR StuoraMenu/app.js` (`GLASS`, `shape`, `GARNISH_TOKENS`, `garnishLayer`, `drinkStage`, `bitePieces`); GSAP `<script>` tags go in `c:/Users/Admin/projects/QR StuoraMenu/index.html`.

---

**Recap (по-русски).** Задача: спроектировать разную анимацию появления для каждого из 7 типов бокалов, чтобы 30 позиций не «рисовались» одинаково, с сохранением любимых бокалов на ножке и «магическим» редизайном кружки и хайбола. Решено: да — задан отдельный характер входа на каждый бокал (шот-«штамп», рокс с кубиком льда, хайбол/кружка «собираются из пузырьков и пыльцы», мартини-точность, купе сохранён, тарелка-«плейтинг»), плюс флориш для 3 сигнатур, апгрейд иконок-гарниров и полностью data-driven частицы. Эффективность метода: высокая — всё выводится из полей `glass/tint/ingredients/signature`, добавление напитка = одна строка JSON; ручная авторская вёрстка оправдана только для 3 закусок. Было→стало: одинаковая обводка у всех 30 → 7 разных входов + отдельная подача сигнатур, рекомендация перейти на GSAP (UMD, без сборки) как прогрессивное улучшение поверх текущего CSS, при сохранении 60fps и `prefers-reduced-motion`.