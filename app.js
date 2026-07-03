/* ============================================================
   Stuora Bar — QR Menu
   Loads menu.json → sticky tabs + sections + cards.
   Each drink is drawn as a thin gold line-art glass (SVG) that
   "draws itself" and fills with its flavour tint on scroll-in.
   Tap a card → it expands (accordion) to reveal description +
   ingredients. Scroll-spy gilds the active tab.
   No frameworks, no dependencies.
   ============================================================ */

(function () {
  "use strict";

  const tabsEl    = document.getElementById("tabs");
  const menuEl    = document.getElementById("menu");
  const loadingEl = document.getElementById("loading");

  /* ---------- glassware: thin line-art system (viewBox 0 0 100 130) ----------
     outline = stroked silhouette (draws itself via pathLength=1 dash trick)
     liquid  = filled bowl interior (rises via scaleY on reveal)             */
  const GLASS = {
    shot: {
      outline: "M35,66 L39,112 Q39,116 43,116 L57,116 Q61,116 61,112 L65,66 Z",
      liquid:  "M38.5,80 L41,109 Q41,112.5 44,112.5 L56,112.5 Q59,112.5 59,109 L61.5,80 Z"
    },
    rocks: {
      outline: "M30,56 L33,113 Q33,117 37,117 L63,117 Q67,117 67,113 L70,56 Z",
      liquid:  "M33,82 L35.5,110.5 Q35.5,114 39,114 L61,114 Q64.5,114 64.5,110.5 L67,82 Z"
    },
    highball: {
      outline: "M38,30 L40,114 Q40,118 44,118 L56,118 Q60,118 60,114 L62,30 Z",
      liquid:  "M40,58 L41.5,111 Q41.5,115 45,115 L55,115 Q58.5,115 58.5,111 L60,58 Z"
    },
    martini: {
      outline: "M22,32 L78,32 L50,76 Z M50,76 L50,112 M34,114 L66,114",
      liquid:  "M31,41 L69,41 L50,71 Z"
    },
    coupe: {
      outline: "M26,40 L74,40 M26,40 Q50,74 74,40 M50,57 L50,112 M34,114 L66,114",
      liquid:  "M30,42 L70,42 Q50,66 30,42 Z"
    },
    mug: {
      outline: "M34,50 L36,113 Q36,117 40,117 L60,117 Q64,117 64,113 L66,50 Z M66,62 Q82,64 82,82 Q82,100 66,102",
      liquid:  "M37,64 L38.5,111 Q38.5,114 41,114 L59,114 Q61.5,114 61.5,111 L63,64 Z"
    },
    plate: {
      // Bites are food, not a drink — a quiet deco plate, no liquid fill.
      outline: "M22,86 Q50,72 78,86 Q50,100 22,86 Z M33,87 Q50,81 67,87"
    }
  };

  /* ---------- helpers ---------- */

  function tabLabel(title) {
    return title.replace(/^our\s+/i, "").trim();
  }

  function priceHTML(value, currency) {
    const cur = currency || "€";
    const num = Number.isInteger(value) ? value : value.toFixed(2);
    return `${num}<span class="cur">${cur}</span>`;
  }

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function glassSVG(type, tint) {
    const g = GLASS[type] || GLASS.rocks;
    const liquid = (g.liquid && tint)
      ? `<path class="liquid" d="${g.liquid}" fill="${tint}"/>`
      : "";
    return `<svg class="glass" viewBox="0 0 100 130" role="img" aria-label="${type} glass">`
      + `<g class="glass-g">${liquid}`
      + `<path class="outline" pathLength="1" d="${g.outline}"/></g></svg>`;
  }

  /* ---------- hero pour: a large glass that fills on open ---------- */
  function heroGlassSVG(type, tint) {
    const g = GLASS[type] || GLASS.rocks;
    const liquid = (g.liquid && tint)
      ? `<path class="h-liquid" d="${g.liquid}" fill="${tint}"/>`
      : "";
    return `<svg class="hero-glass" viewBox="0 0 100 130" role="img" aria-hidden="true">`
      + `${liquid}<path class="h-outline" pathLength="1" d="${g.outline}"/></svg>`;
  }

  /* ---------- garnish: every real ingredient gets its own little SVG ----------
     shape() draws one motif; GARNISH_TOKENS maps a keyword → {shape, colour};
     garnishList() scans the drink's name + ingredients and returns the set of
     motifs actually present, so each drink drops exactly what it's made of.   */
  const HERB = "#6c8a3a";
  function shape(k, c) {
    switch (k) {
      case "cherry":
        return `<g fill="${c}"><circle cx="8" cy="16" r="4"/><circle cx="16" cy="16" r="4"/></g>`
             + `<path d="M8 13 Q10 5 13 4 M16 13 Q14 6 13 4" stroke="${HERB}" stroke-width="1.2" fill="none"/>`;
      case "round":   // plum / quince / passionfruit — a single stone-fruit
        return `<ellipse cx="12" cy="13" rx="6.2" ry="7" fill="${c}"/>`
             + `<path d="M12 6 Q12 12 12 19" stroke="rgba(0,0,0,.18)" stroke-width="1" fill="none"/>`
             + `<path d="M12 6 Q13 3 15.5 3.5" stroke="${HERB}" stroke-width="1.2" fill="none"/>`;
      case "grape":
        return `<g fill="${c}"><circle cx="9" cy="12" r="3"/><circle cx="15" cy="12" r="3"/><circle cx="12" cy="9" r="3"/><circle cx="12" cy="15" r="3"/><circle cx="9.5" cy="17" r="2.6"/><circle cx="14.5" cy="17" r="2.6"/></g>`;
      case "tomato":
        return `<circle cx="12" cy="13" r="7" fill="${c}"/>`
             + `<path d="M12 7 l-3 -3 M12 7 v-4 M12 7 l3 -3" stroke="${HERB}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`
             + `<ellipse cx="9.5" cy="11" rx="1.5" ry="2.3" fill="rgba(255,255,255,.35)"/>`;
      case "fish":    // sprat
        return `<g fill="${c}"><path d="M4 12 Q10 7 17 12 Q10 17 4 12Z"/><path d="M17 12 l4 -3 v6Z"/></g>`
             + `<circle cx="7.5" cy="12" r="1" fill="#2a2f33"/>`;
      case "citrus":  // lime / lemon / orange wedge
        return `<path d="M3 15 A9 9 0 0 1 21 15 Z" fill="${c}"/>`
             + `<path d="M3 15 A9 9 0 0 1 21 15" fill="none" stroke="#f5e6c8" stroke-width="1"/>`
             + `<g stroke="#f5e6c8" stroke-width=".7" opacity=".85"><path d="M12 15 V6.5"/><path d="M12 15 L5.5 13.5"/><path d="M12 15 L18.5 13.5"/></g>`;
      case "pine":    // pine sprig
        return `<path d="M12 3 V21" stroke="${c}" stroke-width="1.6"/>`
             + `<g stroke="${c}" stroke-width="1.3" stroke-linecap="round"><path d="M12 7 l-5 3 M12 7 l5 3 M12 11 l-5 3 M12 11 l5 3 M12 15 l-4 2.5 M12 15 l4 2.5"/></g>`;
      case "leaf":    // dill / mint / herb
        return `<path d="M12 3 C18 8 18 17 12 21 C6 17 6 8 12 3Z" fill="${c}"/>`
             + `<path d="M12 5 V19" stroke="rgba(0,0,0,.25)" stroke-width="1"/>`;
      case "flower":  // hibiscus
        return `<g fill="${c}"><ellipse cx="12" cy="6.5" rx="3" ry="4"/><ellipse cx="17" cy="10" rx="3" ry="4" transform="rotate(72 17 10)"/><ellipse cx="15" cy="16" rx="3" ry="4" transform="rotate(144 15 16)"/><ellipse cx="9" cy="16" rx="3" ry="4" transform="rotate(216 9 16)"/><ellipse cx="7" cy="10" rx="3" ry="4" transform="rotate(288 7 10)"/></g>`
             + `<circle cx="12" cy="12" r="2.4" fill="#e0be3f"/>`;
      case "chilli":
        return `<path d="M6 6 Q9 6 10 9 Q13 18 18 19 Q12 21 9 15 Q6 10 6 6Z" fill="${c}"/>`
             + `<path d="M6 6 Q7 4 9 4" stroke="${HERB}" stroke-width="1.4" fill="none"/>`;
      case "mushroom":
        return `<path d="M4 12 A8 5 0 0 1 20 12 Z" fill="${c}"/>`
             + `<rect x="9.5" y="11.5" width="5" height="7.5" rx="2" fill="#d9c7a3"/>`;
      case "root":    // horseradish / carrot / ginger
        return `<path d="M12 4 Q15 12 12 20 Q9 12 12 4Z" fill="${c}"/>`
             + `<g stroke="${HERB}" stroke-width="1.2" stroke-linecap="round"><path d="M12 4 l-2.5 -2 M12 4 v-3 M12 4 l2.5 -2"/></g>`;
      case "stalk":   // rhubarb
        return `<path d="M9 4 Q13 12 11 20" stroke="${c}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
             + `<path d="M9 4 Q6 2 4 3 Q6 5 9 5Z" fill="${HERB}"/>`;
      case "pineapple":
        return `<ellipse cx="12" cy="15" rx="5.5" ry="6.5" fill="${c}"/>`
             + `<g stroke="rgba(0,0,0,.25)" stroke-width=".7"><path d="M8 11 l8 8 M16 11 l-8 8 M12 9 v12"/></g>`
             + `<path d="M12 9 l-3 -5 l3 2 l3 -2Z" fill="${HERB}"/>`;
      case "coconut":
        return `<circle cx="12" cy="13" r="7" fill="${c}"/>`
             + `<g fill="rgba(0,0,0,.4)"><circle cx="9" cy="11" r="1"/><circle cx="14" cy="10.5" r="1"/><circle cx="11.5" cy="14" r="1"/></g>`;
      case "bean":    // vanilla pod
        return `<rect x="10" y="4" width="4.2" height="16" rx="2.1" fill="${c}"/>`;
      default:        // berry cluster (raspberry / currant / lingonberry)
        return `<g fill="${c}"><circle cx="9" cy="12" r="3"/><circle cx="15" cy="12" r="3"/><circle cx="12" cy="9.5" r="3"/><circle cx="12" cy="14.5" r="3"/><circle cx="12" cy="12" r="3"/></g>`
             + `<path d="M12 8 Q12.5 4.5 15 4.5" stroke="${HERB}" stroke-width="1.1" fill="none"/>`;
    }
  }

  // keyword → motif. Order matters: specific terms before generic ones.
  const GARNISH_TOKENS = [
    { t: ["raspberry"],                 k: "berry",     c: "#c04a63" },
    { t: ["blackcurrant"],              k: "berry",     c: "#4e2340" },
    { t: ["redcurrant"],                k: "berry",     c: "#b23048" },
    { t: ["currant"],                   k: "berry",     c: "#8f2740" },
    { t: ["cowberry", "lingonberry"],   k: "berry",     c: "#a3281f" },
    { t: ["cherry"],                    k: "cherry",    c: "#7a1f2b" },
    { t: ["plum"],                      k: "round",     c: "#6a2f4a" },
    { t: ["quince"],                    k: "round",     c: "#d3a83a" },
    { t: ["passionfruit", "passion"],   k: "round",     c: "#c9772e" },
    { t: ["grape"],                     k: "grape",     c: "#7d5568" },
    { t: ["tomato"],                    k: "tomato",    c: "#c0341f" },
    { t: ["sprat"],                     k: "fish",      c: "#c2ccd2" },
    { t: ["lime"],                      k: "citrus",    c: "#8fa04a" },
    { t: ["lemon"],                     k: "citrus",    c: "#e0be3f" },
    { t: ["orange"],                    k: "citrus",    c: "#d68327" },
    { t: ["pine"],                      k: "pine",      c: "#4f6a2a" },
    { t: ["dill", "mint", "herb"],      k: "leaf",      c: "#6c8a3a" },
    { t: ["hibiscus"],                  k: "flower",    c: "#b23048" },
    { t: ["chilli", "chili"],           k: "chilli",    c: "#c0341f" },
    { t: ["mushroom"],                  k: "mushroom",  c: "#8a5a2a" },
    { t: ["horseradish", "hrenovuha"],  k: "root",      c: "#e6dcc0" },
    { t: ["carrot"],                    k: "root",      c: "#d1791f" },
    { t: ["ginger"],                    k: "root",      c: "#d9b877" },
    { t: ["rhubarb", "rabarbar"],       k: "stalk",     c: "#c05a6e" },
    { t: ["pineapple", "ananas"],       k: "pineapple", c: "#d9b23e" },
    { t: ["coconut"],                   k: "coconut",   c: "#e7ddc7" },
    { t: ["vanilla"],                   k: "bean",      c: "#5a3a24" },
    { t: ["jasmin", "oolong", "kombucha", "grape juice"], k: "leaf", c: "#8aa04a" },
    { t: ["citrus"],                    k: "citrus",    c: "#e0be3f" }
  ];

  function garnishList(item) {
    const hay = (item.name + " "
      + (Array.isArray(item.ingredients) ? item.ingredients.join(" ") : "") + " "
      + (item.description || "")).toLowerCase();
    const out = [];
    const seen = new Set();
    for (const row of GARNISH_TOKENS) {
      if (row.t.some(term => hay.includes(term))) {
        const key = row.k + row.c;
        if (!seen.has(key)) { seen.add(key); out.push({ k: row.k, c: row.c }); }
      }
      if (out.length >= 4) break;                 // keep it tasteful, max 4
    }
    if (!out.length) out.push({ k: "berry", c: item.tint || "#b5455f" });
    return out;
  }

  // where the drink's surface sits in the 158px stage — so garnish lands IN the drink
  const SURFACE = { martini: 58, coupe: 60, highball: 84, shot: 94, rocks: 92, mug: 88, plate: 96 };
  function surfaceY(type) { return SURFACE[type] || 90; }

  function garnishLayer(item) {
    const list = garnishList(item);
    const n = list.length;
    const base = surfaceY(item.glass);
    let html = `<span class="garnish-layer" aria-hidden="true">`;
    list.forEach((m, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = Math.round((t - 0.5) * 44);            // spread across the mouth
      const y = base + (i % 2 ? 11 : 2) + i * 2;       // settle into the drink
      const r = (i % 2 ? 1 : -1) * (8 + i * 7);        // gentle tumble
      const d = (0.5 + i * 0.15).toFixed(2);           // staggered fall
      const sz = 19 + (i % 2 ? 3 : 0);
      html += `<span class="mote" style="--x:${x}px;--y:${y}px;--r:${r}deg;--d:${d}s;--sz:${sz}px">`
           +  `<svg viewBox="0 0 24 24">${shape(m.k, m.c)}</svg></span>`;
    });
    return html + `</span>`;
  }

  // little juice splash at the surface once the garnish lands
  function splashLayer() {
    let html = `<span class="splash" aria-hidden="true"><i class="ripple"></i>`;
    [-12, -4, 5, 12].forEach((dx, i) => {
      html += `<i class="drop" style="--dx:${dx}px;--dd:${(1.02 + i * 0.05).toFixed(2)}s"></i>`;
    });
    return html + `</span>`;
  }

  // full drink stage: soft glow + hero glass that pours + garnish + splash
  function drinkStage(item) {
    return `<span class="stage-glow" aria-hidden="true"></span>`
         + heroGlassSVG(item.glass, item.tint)
         + garnishLayer(item)
         + splashLayer();
  }

  /* ---------- bites: each dish assembles from what it's actually made of ---------- */
  const DISH = "<svg viewBox='0 0 140 34'><ellipse cx='70' cy='17' rx='64' ry='14' fill='none' stroke='var(--gold)' stroke-width='1.4'/><ellipse cx='70' cy='15' rx='50' ry='10' fill='none' stroke='var(--gold-deep)' stroke-width='1'/></svg>";

  function bitePieces(item) {
    const name = (item.name || "").toLowerCase();
    if (name.includes("sandwich")) {
      // open sandwiches: bread base, spread, then assorted toppings
      return [
        { d: "0s",   ly: 104, lx: 0,  w: 132, svg: DISH },
        { d: ".16s", ly: 80,  lx: 0,  w: 96,  svg: "<svg viewBox='0 0 96 24'><rect x='3' y='4' width='90' height='16' rx='6' fill='#cdaa6e'/><rect x='3' y='4' width='90' height='5' rx='3' fill='#e0c489'/></svg>" },
        { d: ".30s", ly: 64,  lx: 0,  w: 86,  svg: "<svg viewBox='0 0 86 16'><rect x='3' y='3' width='80' height='10' rx='4' fill='#9a6a3c'/></svg>" },
        { d: ".44s", ly: 50,  lx: 0,  w: 84,  svg: "<svg viewBox='0 0 84 18'><ellipse cx='18' cy='9' rx='8' ry='4.5' fill='#c2ccd2'/><circle cx='42' cy='9' r='5.5' fill='#8a2f2a'/><circle cx='64' cy='9' r='5' fill='#7a9a3f'/></svg>" }
      ];
    }
    // pickled selection / house pickles: a dish scattered with pickles
    const cuke   = "<svg viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' fill='#7d9a44'/><circle cx='12' cy='12' r='6' fill='#c9d99a'/><g fill='#eaf1cf'><circle cx='12' cy='9.5' r='1'/><circle cx='9.6' cy='13' r='1'/><circle cx='14.4' cy='13' r='1'/></g></svg>";
    const onion  = "<svg viewBox='0 0 24 24'><circle cx='12' cy='12' r='9' fill='none' stroke='#dcc9d9' stroke-width='2.6'/><circle cx='12' cy='12' r='5.5' fill='none' stroke='#c3aec1' stroke-width='1.6'/></svg>";
    const olive  = "<svg viewBox='0 0 24 24'><ellipse cx='12' cy='12' rx='6' ry='7.5' fill='#5b6b2e'/><ellipse cx='12' cy='9' rx='1.6' ry='2' fill='#b4472c'/></svg>";
    const garlic = "<svg viewBox='0 0 24 24'><path d='M12 4 Q17 10 15 18 Q12 21 9 18 Q7 10 12 4Z' fill='#efe7d3'/><path d='M12 5 Q12 12 12 18' stroke='rgba(0,0,0,.12)' stroke-width='1'/></svg>";
    return [
      { d: "0s",   ly: 104, lx: 0,   w: 132, svg: DISH },
      { d: ".16s", ly: 84,  lx: -38, w: 30,  svg: cuke },
      { d: ".28s", ly: 80,  lx: -12, w: 30,  svg: onion },
      { d: ".40s", ly: 86,  lx: 16,  w: 26,  svg: olive },
      { d: ".52s", ly: 82,  lx: 40,  w: 24,  svg: garlic }
    ];
  }

  function bitesStage(item) {
    let html = `<span class="hero-plate" aria-hidden="true">`;
    bitePieces(item).forEach(l => {
      html += `<span class="layer" style="--ly:${l.ly}px;--lx:${l.lx}px;--d:${l.d};width:${l.w}px">${l.svg}</span>`;
    });
    return html + `</span>`;
  }

  /* ---------- render ---------- */

  function render(data) {
    const bar = data.bar || {};
    const currency = bar.currency || "€";
    const categories = (data.categories || []).filter(c => c.items && c.items.length);

    // Tabs
    categories.forEach((cat, i) => {
      const tab = el("button", "tab", tabLabel(cat.title));
      tab.type = "button";
      tab.dataset.target = cat.id;
      if (i === 0) tab.classList.add("active");
      tab.addEventListener("click", () => {
        const section = document.getElementById(cat.id);
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      tabsEl.appendChild(tab);
    });

    // Sections
    const frag = document.createDocumentFragment();
    let uid = 0;

    categories.forEach(cat => {
      const section = el("section", "section");
      section.id = cat.id;

      const head = el("div", "section-head");
      head.appendChild(el("h2", "section-title", cat.title));
      head.appendChild(el("div", "section-title-rule", '<span class="chev">&#9670;</span>'));
      if (cat.price != null) {
        head.appendChild(el("div", "section-price", `Each ${priceHTML(cat.price, currency)}`));
      }
      section.appendChild(head);

      cat.items.forEach(item => {
        const id = "d" + (uid++);
        const card = el("article", "card");
        if (item.signature) card.classList.add("is-signature");

        // --- collapsed head (the whole thing is one big tap target) ---
        const btn = el("button", "card-head");
        btn.type = "button";
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-controls", id);

        btn.appendChild(el("span", "glass-wrap", glassSVG(item.glass, item.tint)));

        const nameWrap = el("span", "card-name-wrap");
        nameWrap.appendChild(el("span", "card-name", item.name));
        if (item.signature) nameWrap.appendChild(el("span", "sig", "Signature"));
        btn.appendChild(nameWrap);

        // Per-item price only when it overrides the category price.
        if (item.price != null) {
          btn.appendChild(el("span", "card-price", priceHTML(item.price, currency)));
        }
        btn.appendChild(el("span", "chev-toggle", "&#8250;")); // ›
        card.appendChild(btn);

        // --- expandable detail ---
        const detail = el("div", "card-detail");
        detail.id = id;
        const inner = el("div", "card-detail-inner");
        const isBite = item.glass === "plate";
        const stage = el("div", "pour-stage" + (isBite ? " is-bite" : ""),
          isBite ? bitesStage(item) : drinkStage(item));
        if (item.tint) stage.style.setProperty("--tint", item.tint);
        if (!isBite) stage.style.setProperty("--surf", surfaceY(item.glass) + "px");
        inner.appendChild(stage);
        if (item.description) inner.appendChild(el("p", "card-desc", item.description));
        if (Array.isArray(item.ingredients) && item.ingredients.length) {
          const ul = el("ul", "ingredients");
          item.ingredients.forEach(ing => ul.appendChild(el("li", null, ing)));
          inner.appendChild(ul);
        }
        detail.appendChild(inner);
        card.appendChild(detail);

        // tap → toggle (single-open within the whole menu)
        btn.addEventListener("click", () => toggleCard(card, btn));

        section.appendChild(card);
      });

      frag.appendChild(section);
    });

    if (loadingEl) loadingEl.remove();
    menuEl.appendChild(frag);

    initReveal();
    initScrollSpy(categories.map(c => c.id));
  }

  /* ---------- accordion ---------- */

  function toggleCard(card, btn) {
    const open = card.classList.contains("is-open");
    // close any other open card (tidy, single-open)
    if (!open) {
      document.querySelectorAll(".card.is-open").forEach(c => {
        c.classList.remove("is-open");
        const b = c.querySelector(".card-head");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }
    card.classList.toggle("is-open", !open);
    btn.setAttribute("aria-expanded", String(!open));
  }

  /* ---------- reveal on scroll: fade-up + glass draws + liquid fills ---------- */

  function initReveal() {
    const cards = document.querySelectorAll(".card");
    if (!("IntersectionObserver" in window)) {
      cards.forEach(c => c.classList.add("revealed"));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    cards.forEach(c => io.observe(c));
  }

  /* ---------- scroll-spy: gild the active tab ---------- */

  function initScrollSpy(ids) {
    const sections = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!("IntersectionObserver" in window) || !sections.length) return;

    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActiveTab(e.target.id); });
    }, { rootMargin: "-64px 0px -70% 0px", threshold: 0 });

    sections.forEach(s => spy.observe(s));
  }

  function setActiveTab(id) {
    tabsEl.querySelectorAll(".tab").forEach(t => {
      const on = t.dataset.target === id;
      t.classList.toggle("active", on);
      if (on) t.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  }

  /* ---------- boot ---------- */

  fetch("menu.json", { cache: "no-cache" })
    .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .then(render)
    .catch(err => {
      console.error("Stuora menu failed to load:", err);
      if (loadingEl) loadingEl.remove();
      menuEl.appendChild(el("p", "error",
        "The menu could not be poured just now.<br>Please refresh, or ask our staff."));
    });
})();
