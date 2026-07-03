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
