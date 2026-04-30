(function () {
  const products = window.BZC_PRODUCTS || [];
  const money = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const ADMIN_WHATSAPP_NUMBER = "2349036925667";
  const state = { visible: 8 };
  const routeMap = {
    "": "index.html",
    "/": "index.html",
    "index": "index.html",
    "home": "index.html",
    "shop": "shop.html",
    "product": "product.html",
    "checkout": "checkout.html",
    "about": "about.html",
    "contact": "contact.html",
    "terms": "terms.html",
    "faq": "faq.html",
    "page-not-found": "page-not-found.html",
    "404": "404.html"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const cartKey = "bzc_cart_v1";

  function initPreloader() {
    document.body.classList.add("site-loading");
    const loader = document.createElement("div");
    loader.className = "bzc-preloader";
    loader.innerHTML = `
      <div class="preloader-mark">
        <img src="assets/img/zara beauty collection.png" alt="Beauty Zara Collections">
      </div>`;
    document.body.prepend(loader);
    const startedAt = Date.now();
    window.addEventListener("load", () => {
      const remaining = Math.max(0, 3000 - (Date.now() - startedAt));
      window.setTimeout(() => {
        loader.classList.add("is-hidden");
        document.body.classList.remove("site-loading");
      }, remaining);
      window.setTimeout(() => loader.remove(), remaining + 500);
    }, { once: true });
  }

  function routeUrl(path) {
    if (!path || /^(https?:|mailto:|tel:|#|data:)/.test(path)) return path;
    const [, rawPath = "", suffix = ""] = path.match(/^([^?#]*)(.*)$/) || [];
    const normalizedPath = rawPath || "index";
    const parts = normalizedPath.split("/");
    const last = parts.pop() || "index";
    const nextFile = /\.[a-z0-9]+$/i.test(last) ? last : (routeMap[last] || `${last}.html`);
    parts.push(nextFile);
    return `${parts.join("/")}${suffix}`;
  }

  function getCart() {
    try { return JSON.parse(localStorage.getItem(cartKey)) || []; } catch (_) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
    renderCart();
  }

  function cartTotals(cart = getCart()) {
    return cart.reduce((acc, item) => {
      acc.qty += item.qty;
      acc.total += item.price * item.qty;
      return acc;
    }, { qty: 0, total: 0 });
  }

  function addToCart(id, qty = 1, options = {}) {
    const product = products.find((item) => item.id === id);
    if (!product) return;
    const cart = getCart();
    const signature = `${id}|${options.size || ""}|${options.color || ""}`;
    const existing = cart.find((item) => item.signature === signature);
    if (existing) existing.qty += qty;
    else cart.push({
      signature,
      id,
      title: product.title,
      price: product.price,
      image: product.image,
      size: options.size || product.sizes[0],
      color: options.color || product.colors[0],
      qty
    });
    saveCart(cart);
    openCart();
  }

  function productCard(product) {
    const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
    return `
      <article class="product-card">
        <a href="${routeUrl(`product?id=${product.id}`)}" class="product-media" aria-label="View ${product.title}">
          <span class="product-badge">${product.badge}</span>
          <img src="${product.image}" loading="lazy" alt="${product.title}">
        </a>
        <div class="product-body">
          <div class="d-flex justify-content-between gap-2 align-items-start">
            <div>
              <p class="product-category">${product.category}</p>
              <h3><a href="${routeUrl(`product?id=${product.id}`)}">${product.title}</a></h3>
            </div>
            <span class="discount">-${discount}%</span>
          </div>
          <div class="price-row">
            <strong>${money.format(product.price)}</strong>
            <span>${money.format(product.oldPrice)}</span>
          </div>
          <div class="product-actions">
            <button class="btn btn-dark btn-sm" data-add="${product.id}">Add to cart</button>
            <a class="btn btn-outline-dark btn-sm" href="${routeUrl(`product?id=${product.id}`)}">View</a>
          </div>
        </div>
      </article>`;
  }

  function filterProducts() {
    const search = ($("#productSearch")?.value || "").toLowerCase();
    const gender = $("#filterGender")?.value || "";
    const size = $("#filterSize")?.value || "";
    const color = $("#filterColor")?.value || "";
    const category = $("#filterCategory")?.value || "";
    const price = $("#filterPrice")?.value || "";
    const sort = $("#sortProducts")?.value || "newest";

    let output = products.filter((product) => {
      const inSearch = `${product.title} ${product.category} ${product.gender}`.toLowerCase().includes(search);
      const inPrice = !price || product.price <= Number(price);
      return inSearch &&
        (!gender || product.gender === gender) &&
        (!size || product.sizes.includes(size)) &&
        (!color || product.colors.includes(color)) &&
        (!category || product.category === category) &&
        inPrice;
    });

    output.sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "popularity") return b.popularity - a.popularity;
      return new Date(b.date) - new Date(a.date);
    });
    return output;
  }

  function renderGrid() {
    const grid = $("#productGrid");
    if (!grid) return;
    grid.innerHTML = `<div class="skeleton-card"></div><div class="skeleton-card d-none d-md-block"></div><div class="skeleton-card d-none d-lg-block"></div>`;
    window.setTimeout(() => {
      const filtered = filterProducts();
      const pageItems = filtered.slice(0, state.visible);
      grid.innerHTML = pageItems.map(productCard).join("") || `<div class="empty-state">No products match your filters yet.</div>`;
      $("#resultCount") && ($("#resultCount").textContent = `${filtered.length} styles found`);
      const loadMore = $("#loadMore");
      if (loadMore) loadMore.classList.toggle("d-none", state.visible >= filtered.length);
    }, 180);
  }

  function renderHome() {
    const featured = $("#featuredProducts");
    const recommended = $("#recommendedProducts");
    if (featured) featured.innerHTML = products.slice(0, 8).map(productCard).join("");
    if (recommended) recommended.innerHTML = products.slice(8, 12).map(productCard).join("");
  }

  function renderSharedFooter() {
    const footers = $$("[data-shared-footer]");
    if (!footers.length) return;
    const year = new Date().getFullYear();
    const html = `
      <div class="container">
        <div class="row g-4 align-items-start">
          <div class="col-lg-4">
            <h2><img class="footer-logo" src="assets/img/zara beauty collection.png" alt="Beauty Zara Collections"></h2>
            <p>Affordable fashion for retail buyers, bulk shoppers, and wholesale customers.</p>
            <div class="social-icons mt-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fa-brands fa-tiktok"></i></a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="https://wa.me/${ADMIN_WHATSAPP_NUMBER}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
            </div>
          </div>
          <div class="col-6 col-lg-2">
            <h3 class="h5">Shop</h3>
            <p><a href="${routeUrl("shop")}">All products</a></p>
            <p><a href="${routeUrl("shop?category=Women%20Wears")}">Women wears</a></p>
            <p><a href="${routeUrl("shop?category=Bags")}">Bags</a></p>
          </div>
          <div class="col-6 col-lg-2">
            <h3 class="h5">Company</h3>
            <p><a href="${routeUrl("about")}">About</a></p>
            <p><a href="${routeUrl("contact")}">Contact</a></p>
            <p><a href="${routeUrl("terms")}">Terms</a></p>
          </div>
          <div class="col-lg-4">
            <h3 class="h5">Newsletter</h3>
            <form class="d-flex gap-2">
              <input class="form-control" type="email" placeholder="Email address" aria-label="Email address">
              <button class="btn btn-gold" type="button">Join</button>
            </form>
            <p class="small mt-3 mb-0">&copy; ${year} Beauty Zara Collections. All rights reserved.</p>
          </div>
        </div>
      </div>`;
    footers.forEach((footer) => footer.innerHTML = html);
  }

  function injectNavSearch() {
    $$(".navbar-nav").forEach((nav) => {
      if ($("[data-open-search]", nav)) return;
      const cartItem = $("[data-open-cart]", nav)?.closest(".nav-item");
      const searchItem = document.createElement("li");
      searchItem.className = "nav-item ms-lg-3";
      searchItem.innerHTML = `
        <button class="btn-icon" data-open-search aria-label="Search products">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        </button>`;
      if (cartItem) nav.insertBefore(searchItem, cartItem);
      else nav.appendChild(searchItem);
    });
  }

  function createSearchOverlay() {
    if ($("#searchOverlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "search-overlay";
    overlay.id = "searchOverlay";
    overlay.innerHTML = `
      <div class="search-panel" role="dialog" aria-modal="true" aria-labelledby="searchTitle">
        <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
          <div>
            <p class="eyebrow mb-1">Product search</p>
            <h2 class="h3 mb-0" id="searchTitle">Find an item fast</h2>
          </div>
          <button class="btn btn-sm btn-outline-dark" data-close-search>Close</button>
        </div>
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input id="globalSearchInput" type="search" placeholder="Search dresses, bags, shirts, colors..." autocomplete="off">
        </div>
        <div class="search-results" id="globalSearchResults"></div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function searchProducts(query) {
    const term = query.trim().toLowerCase();
    if (!term) return products.slice(0, 6);
    return products.filter((product) => {
      const haystack = [
        product.title,
        product.category,
        product.gender,
        product.badge,
        product.description,
        product.sizes.join(" "),
        product.colors.join(" ")
      ].join(" ").toLowerCase();
      return haystack.includes(term);
    }).slice(0, 8);
  }

  function renderSearchResults(query = "") {
    const results = $("#globalSearchResults");
    if (!results) return;
    const matches = searchProducts(query);
    results.innerHTML = matches.map((product) => `
      <a class="search-result" href="${routeUrl(`product?id=${product.id}`)}">
        <img src="${product.image}" alt="${product.title}" loading="lazy">
        <span>
          <strong>${product.title}</strong>
          <small>${product.category} • ${product.colors.join(", ")}</small>
        </span>
        <em>${money.format(product.price)}</em>
      </a>
    `).join("") || `
      <div class="empty-state mb-0">
        No items matched your search. Try "bag", "shirt", "dress", "black", or "yellow".
      </div>`;
  }

  function openSearch() {
    createSearchOverlay();
    renderSearchResults();
    $("#searchOverlay")?.classList.add("is-open");
    window.setTimeout(() => $("#globalSearchInput")?.focus(), 50);
  }

  function closeSearch() {
    $("#searchOverlay")?.classList.remove("is-open");
  }

  function initScrollTop() {
    if ($("#scrollTopButton")) return;
    const button = document.createElement("button");
    button.className = "scroll-top-btn";
    button.id = "scrollTopButton";
    button.type = "button";
    button.setAttribute("aria-label", "Scroll to top");
    button.innerHTML = `<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>`;
    document.body.appendChild(button);

    const toggleButton = () => {
      button.classList.toggle("is-visible", window.scrollY > 420);
    };

    window.addEventListener("scroll", toggleButton, { passive: true });
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    toggleButton();
  }

  function renderProductDetail() {
    const detail = $("#productDetail");
    if (!detail) return;
    const id = new URLSearchParams(location.search).get("id") || products[0]?.id;
    const product = products.find((item) => item.id === id) || products[0];
    document.title = `${product.title} | Beauty Zara Collections`;
    detail.innerHTML = `
      <div class="row g-4 g-lg-5">
        <div class="col-lg-6">
          <div class="detail-gallery">
            <div class="zoom-wrap" id="zoomWrap">
              <img id="mainProductImage" src="${product.image}" alt="${product.title}" loading="eager">
            </div>
            <div class="thumb-row">
              ${[product.image, ...products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3).map((item) => item.image)].map((src) => `
                <button class="thumb" data-thumb="${src}"><img src="${src}" alt="" loading="lazy"></button>
              `).join("")}
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <p class="eyebrow">${product.category}</p>
          <h1 class="detail-title">${product.title}</h1>
          <div class="price-row detail-price"><strong>${money.format(product.price)}</strong><span>${money.format(product.oldPrice)}</span><em>${product.badge}</em></div>
          <p class="detail-copy">${product.description}</p>
          <div class="selector-block">
            <label>Size</label>
            <div class="choice-row" id="sizeChoices">${product.sizes.map((size, i) => `<button class="${i === 0 ? "active" : ""}" data-size="${size}">${size}</button>`).join("")}</div>
          </div>
          <div class="selector-block">
            <label>Color</label>
            <div class="choice-row" id="colorChoices">${product.colors.map((color, i) => `<button class="${i === 0 ? "active" : ""}" data-color="${color}">${color}</button>`).join("")}</div>
          </div>
          <div class="qty-wrap">
            <label for="productQty">Quantity</label>
            <div class="qty-control"><button data-qty="-1">-</button><input id="productQty" value="1" inputmode="numeric"><button data-qty="1">+</button></div>
          </div>
          <div class="detail-actions">
            <button class="btn btn-dark btn-lg" id="detailAdd">Add to cart</button>
            <button class="btn btn-gold btn-lg" id="detailBuy">Buy now</button>
          </div>
          <div class="trust-strip mt-4">
            <span>Secure checkout</span><span>Fast delivery</span><span>Wholesale friendly</span>
          </div>
        </div>
      </div>`;

    const selected = { size: product.sizes[0], color: product.colors[0] };
    $$(".choice-row button").forEach((button) => button.addEventListener("click", () => {
      const parent = button.parentElement;
      $$("button", parent).forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      if (button.dataset.size) selected.size = button.dataset.size;
      if (button.dataset.color) selected.color = button.dataset.color;
    }));
    $$(".thumb").forEach((button) => button.addEventListener("click", () => $("#mainProductImage").src = button.dataset.thumb));
    $$("[data-qty]").forEach((button) => button.addEventListener("click", () => {
      const input = $("#productQty");
      input.value = Math.max(1, Number(input.value || 1) + Number(button.dataset.qty));
    }));
    $("#detailAdd").addEventListener("click", () => addToCart(product.id, Number($("#productQty").value || 1), selected));
    $("#detailBuy").addEventListener("click", () => {
      addToCart(product.id, Number($("#productQty").value || 1), selected);
      location.href = routeUrl("checkout");
    });
    $("#zoomWrap").addEventListener("mousemove", (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      $("#mainProductImage").style.transformOrigin = `${x}% ${y}%`;
    });
  }

  function renderCart() {
    const cart = getCart();
    const totals = cartTotals(cart);
    $$(".cart-count").forEach((el) => el.textContent = totals.qty);
    $$(".cart-total").forEach((el) => el.textContent = money.format(totals.total));
    const list = $("#cartItems");
    if (list) {
      list.innerHTML = cart.map((item) => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.title}">
          <div>
            <h4>${item.title}</h4>
            <p>${item.size} / ${item.color}</p>
            <strong>${money.format(item.price)}</strong>
            <div class="cart-line-actions">
              <button data-cart-dec="${item.signature}">-</button><span>${item.qty}</span><button data-cart-inc="${item.signature}">+</button>
              <button data-remove="${item.signature}">Remove</button>
            </div>
          </div>
        </div>`).join("") || `<p class="empty-cart">Your cart is ready for beautiful things.</p>`;
    }
    const checkoutItems = $("#checkoutItems");
    if (checkoutItems) {
      checkoutItems.innerHTML = cart.map((item) => `
        <div class="checkout-line"><span>${item.title} x ${item.qty}</span><strong>${money.format(item.price * item.qty)}</strong></div>
      `).join("") || `<p>Your bag is empty.</p>`;
      $("#checkoutQty").textContent = totals.qty;
      $("#checkoutSubtotal").textContent = money.format(totals.total);
      $("#checkoutTotal").textContent = money.format(totals.total);
    }
  }

  function updateCart(signature, delta) {
    const cart = getCart().map((item) => item.signature === signature ? { ...item, qty: Math.max(1, item.qty + delta) } : item);
    saveCart(cart);
  }

  function removeCart(signature) {
    saveCart(getCart().filter((item) => item.signature !== signature));
  }

  function openCart() { $("#cartDrawer")?.classList.add("is-open"); $("#cartBackdrop")?.classList.add("is-open"); }
  function closeCart() { $("#cartDrawer")?.classList.remove("is-open"); $("#cartBackdrop")?.classList.remove("is-open"); }

  function checkoutToWhatsApp(event) {
    event.preventDefault();
    const cart = getCart();
    if (!cart.length) return openCart();
    const form = new FormData(event.currentTarget);
    const totals = cartTotals(cart);
    const lines = cart.map((item, index) => `${index + 1}. ${item.title} - ${item.size}/${item.color} x ${item.qty} = ${money.format(item.price * item.qty)}`).join("\n");
    const message = `New Beauty Zara Collections Order\n\nCustomer: ${form.get("name")}\nPhone: ${form.get("phone")}\nLocation: ${form.get("address")}\nDelivery: ${form.get("delivery")}\n\nItems (${totals.qty})\n${lines}\n\nTotal: ${money.format(totals.total)}\n\nNote: ${form.get("note") || "None"}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    if (window.Swal) {
      window.Swal.fire({
        icon: "success",
        title: "Order sent successfully",
        text: "Your order summary has been prepared for WhatsApp confirmation.",
        confirmButtonColor: "#111111"
      });
    } else {
      alert("Order sent successfully.");
    }
  }

  function contactToWhatsApp(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = `Beauty Zara Collections Enquiry\n\nName: ${form.get("name")}\nPhone: ${form.get("phone")}\nTopic: ${form.get("topic")}\n\nMessage:\n${form.get("message")}`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  function countdown() {
    const el = $("#promoCountdown");
    if (!el) return;
    const target = Date.now() + 36 * 60 * 60 * 1000;
    window.setInterval(() => {
      const distance = Math.max(0, target - Date.now());
      const hours = Math.floor(distance / 3600000);
      const minutes = Math.floor((distance % 3600000) / 60000);
      const seconds = Math.floor((distance % 60000) / 1000);
      el.textContent = `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    }, 1000);
  }

  function hydrateShopFromUrl() {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    if (category && $("#filterCategory")) $("#filterCategory").value = category;
  }

  function newsletter() {
    const popup = $("#newsletterPopup");
    if (!popup || sessionStorage.getItem("bzc_newsletter_seen")) return;
    window.setTimeout(() => popup.classList.add("is-open"), 2500);
  }

  function initLazySections() {
    const sections = $$(".lazy-section");
    if (!sections.length) return;
    document.body.classList.add("lazy-enabled");

    const loadSection = (section) => {
      section.classList.add("is-visible");
      $$("img[data-lazy-src]", section).forEach((image) => {
        image.src = image.dataset.lazySrc;
        image.removeAttribute("data-lazy-src");
        image.addEventListener("load", () => image.classList.add("is-loaded"), { once: true });
      });
    };

    if (!("IntersectionObserver" in window)) {
      sections.forEach(loadSection);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadSection(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "220px 0px", threshold: 0.01 });

    sections.forEach((section) => observer.observe(section));
  }

  function initRouteState() {
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const route = file.endsWith(".html") ? file : `${file || "index"}.html`;
    const normalizedRoute = route === ".html" ? "index.html" : route;
    $$("[data-route]").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === normalizedRoute);
    });
  }

  function initHtmlRouteLinks() {
    $$("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || /^(https?:|mailto:|tel:|#|data:)/.test(href)) return;
      link.setAttribute("href", routeUrl(href));
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.dataset.add) addToCart(target.dataset.add);
    if (target.dataset.cartInc) updateCart(target.dataset.cartInc, 1);
    if (target.dataset.cartDec) updateCart(target.dataset.cartDec, -1);
    if (target.dataset.remove) removeCart(target.dataset.remove);
    if (target.dataset.openCart !== undefined) openCart();
    if (target.dataset.closeCart !== undefined) closeCart();
    if (target.dataset.openSearch !== undefined) openSearch();
    if (target.dataset.closeSearch !== undefined) closeSearch();
    if (target.dataset.closeNewsletter !== undefined) {
      $("#newsletterPopup")?.classList.remove("is-open");
      sessionStorage.setItem("bzc_newsletter_seen", "1");
    }
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches("#globalSearchInput")) {
      renderSearchResults(event.target.value);
      return;
    }
    if (event.target.matches(".shop-control")) {
      state.visible = 8;
      renderGrid();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches(".shop-control")) {
      state.visible = 8;
      renderGrid();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    initPreloader();
    initRouteState();
    injectNavSearch();
    renderSharedFooter();
    initHtmlRouteLinks();
    initScrollTop();
    hydrateShopFromUrl();
    initLazySections();
    renderHome();
    renderGrid();
    renderProductDetail();
    renderCart();
    countdown();
    newsletter();
    $("#loadMore")?.addEventListener("click", () => { state.visible += 4; renderGrid(); });
    $("#checkoutForm")?.addEventListener("submit", checkoutToWhatsApp);
    $("#contactForm")?.addEventListener("submit", contactToWhatsApp);
    $("#cartBackdrop")?.addEventListener("click", closeCart);
  });
})();
