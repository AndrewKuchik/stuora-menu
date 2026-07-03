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

  /* ---------- garnish motifs (tiny SVG dropped into the hero glass) ---------- */
  const HERB = "#6c8a3a";
  function motif(kind, color) {
    switch (kind) {
      case "cherry":
        return `<g fill="${color}"><circle cx="8" cy="16" r="4"/><circle cx="16" cy="16" r="4"/></g>`
             + `<path d="M8 13 Q10 5 13 4 M16 13 Q14 6 13 4" stroke="${HERB}" stroke-width="1.2" fill="none"/>`;
      case "plum":
        return `<ellipse cx="12" cy="13" rx="6" ry="7" fill="${color}"/>`
             + `<path d="M12 6 Q12 13 12 20" stroke="rgba(0,0,0,.22)" stroke-width="1" fill="none"/>`;
      case "grape":
        return `<g fill="${color}"><circle cx="9" cy="12" r="3"/><circle cx="15" cy="12" r="3"/><circle cx="12" cy="9" r="3"/><circle cx="12" cy="15" r="3"/><circle cx="9.5" cy="17" r="2.6"/><circle cx="14.5" cy="17" r="2.6"/></g>`;
      case "citrus":
        return `<path d="M3 15 A9 9 0 0 1 21 15 Z" fill="${color}"/>`
             + `<path d="M3 15 A9 9 0 0 1 21 15" fill="none" stroke="#f5e6c8" stroke-width="1"/>`
             + `<g stroke="#f5e6c8" stroke-width=".7" opacity=".8"><path d="M12 15 V6.5"/><path d="M12 15 L5.5 13.5"/><path d="M12 15 L18.5 13.5"/></g>`;
      case "leaf":
        return `<path d="M12 3 C18 8 18 17 12 21 C6 17 6 8 12 3Z" fill="${HERB}"/>`
             + `<path d="M12 5 V19" stroke="#4f6a2a" stroke-width="1"/>`;
      case "chilli":
        return `<path d="M6 6 Q9 6 10 9 Q13 18 18 19 Q12 21 9 15 Q6 10 6 6Z" fill="${color}"/>`
             + `<path d="M6 6 Q7 4 9 4" stroke="${HERB}" stroke-width="1.4" fill="none"/>`;
      case "mushroom":
        return `<path d="M4 12 A8 5 0 0 1 20 12 Z" fill="${color}"/>`
             + `<rect x="9.5" y="11.5" width="5" height="7.5" rx="2" fill="#d9c7a3"/>`;
      case "bean":
        return `<rect x="10" y="4" width="4.2" height="16" rx="2.1" fill="${color}"/>`;
      default: /* berry */
        return `<g fill="${color}"><circle cx="9" cy="12" r="3"/><circle cx="15" cy="12" r="3"/><circle cx="12" cy="9.5" r="3"/><circle cx="12" cy="14.5" r="3"/><circle cx="12" cy="12" r="3"/></g>`
             + `<path d="M12 8 Q12.5 4.5 15 4.5" stroke="${HERB}" stroke-width="1.1" fill="none"/>`;
    }
  }

  function inferGarnish(item) {
    if (item.garnish) return item.garnish;               // explicit override
    const s = (item.name + " " + (item.description || "")).toLowerCase();
    const tint = item.tint || "#b5455f";
    const has = (...w) => w.some(x => s.includes(x));
    if (has("cherry"))                                    return { kind: "cherry", color: tint, count: 3 };
    if (has("plum"))                                      return { kind: "plum",   color: tint, count: 3 };
    if (has("grape"))                                     return { kind: "grape",  color: tint, count: 3 };
    if (has("raspberry", "currant", "cowberry", "lingonberry", "clover", "berry"))
                                                          return { kind: "berry",  color: tint, count: 4 };
    if (has("mushroom"))                                  return { kind: "mushroom", color: "#8a5a2a", count: 3 };
    if (has("vanilla"))                                   return { kind: "bean",   color: "#5a3a24", count: 3 };
    if (has("pine", "dill", "mint", "herb", "hibiscus", "hrenovuha", "horseradish", "carrot"))
                                                          return { kind: "leaf",   color: HERB, count: 3 };
    if (has("lime", "mule", "margarita", "gimlet", "fizz", "rhubarb", "rabarbar"))
                                                          return { kind: "citrus", color: "#8fa04a", count: 3 };
    if (has("lemon", "passionfruit", "ananas", "pineapple", "coconut", "kombucha", "oolong", "jasmin", "quince"))
                                                          return { kind: "citrus", color: "#d6b24a", count: 3 };
    return { kind: "berry", color: tint, count: 4 };
  }

  function garnishLayer(item) {
    const gz = inferGarnish(item);
    const n = Math.max(1, gz.count || 3);
    let html = `<span class="garnish-layer" aria-hidden="true">`;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = Math.round((t - 0.5) * 42);            // -21..21 px across the mouth
      const y = 92 + (i % 2 ? 12 : 0) + i * 2;         // settle depth into the drink
      const r = (i % 2 ? 1 : -1) * (10 + i * 6);       // gentle tumble
      const d = (0.42 + i * 0.13).toFixed(2);          // staggered fall
      const sz = 17 + (i % 2 ? 3 : 0);
      html += `<span class="mote" style="--x:${x}px;--y:${y}px;--r:${r}deg;--d:${d}s;--sz:${sz}px">`
           +  `<svg viewBox="0 0 24 24">${motif(gz.kind, gz.color)}</svg></span>`;
    }
    return html + `</span>`;
  }

  function bitesStage() {
    // a plate, then layers dropping and stacking (open-sandwich feel)
    const L = [
      { d: "0s",   ly: 100, w: 128, svg: `<svg viewBox="0 0 128 40"><ellipse cx="64" cy="20" rx="58" ry="13" fill="none" stroke="var(--gold)" stroke-width="1.4"/><ellipse cx="64" cy="18" rx="44" ry="9" fill="none" stroke="var(--gold-deep)" stroke-width="1"/></svg>` },
      { d: ".14s", ly: 74,  w: 92,  svg: `<svg viewBox="0 0 92 26"><rect x="3" y="4" width="86" height="18" rx="7" fill="#cdaa6e"/></svg>` },
      { d: ".28s", ly: 60,  w: 84,  svg: `<svg viewBox="0 0 84 20"><rect x="3" y="3" width="78" height="13" rx="5" fill="#8a5a3a"/></svg>` },
      { d: ".42s", ly: 48,  w: 80,  svg: `<svg viewBox="0 0 80 18"><g fill="#7a1f2b"><circle cx="22" cy="9" r="5"/><circle cx="40" cy="9" r="5"/><circle cx="58" cy="9" r="5"/></g></svg>` }
    ];
    let html = `<span class="hero-plate" aria-hidden="true">`;
    L.forEach(l => {
      html += `<span class="layer" style="--ly:${l.ly}px;--d:${l.d};width:${l.w}px">${l.svg}</span>`;
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
        const stageHTML = isBite
          ? bitesStage()
          : `${heroGlassSVG(item.glass, item.tint)}${garnishLayer(item)}`;
        inner.appendChild(el("div", "pour-stage" + (isBite ? " is-bite" : ""), stageHTML));
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
