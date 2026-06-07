const state = {
  token: localStorage.getItem("token") || "",
  email: localStorage.getItem("email") || "",
  selectedProduct: null
};

const els = {
  sessionState: document.querySelector("#sessionState"),
  logoutBtn: document.querySelector("#logoutBtn"),
  loginForm: document.querySelector("#loginForm"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  searchForm: document.querySelector("#searchForm"),
  searchText: document.querySelector("#searchText"),
  category: document.querySelector("#category"),
  products: document.querySelector("#products"),
  productDetail: document.querySelector("#productDetail"),
  cacheBadge: document.querySelector("#cacheBadge"),
  cart: document.querySelector("#cart"),
  checkoutBtn: document.querySelector("#checkoutBtn"),
  refreshCart: document.querySelector("#refreshCart"),
  refreshRealtime: document.querySelector("#refreshRealtime"),
  trending: document.querySelector("#trending"),
  recentlyViewed: document.querySelector("#recentlyViewed"),
  loadAnalytics: document.querySelector("#loadAnalytics"),
  monthlyRevenue: document.querySelector("#monthlyRevenue"),
  lowStock: document.querySelector("#lowStock"),
  toast: document.querySelector("#toast")
};

function headers(extra = {}) {
  return {
    "Content-Type": "application/json",
    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    ...extra
  };
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: headers(options.headers)
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = body && body.error ? body.error : `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return { body, response };
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 2800);
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function updateSession() {
  els.sessionState.textContent = state.token ? `Signed in: ${state.email}` : "Signed out";
}

function renderProducts(products) {
  if (!products.length) {
    els.products.innerHTML = '<div class="empty">No products found.</div>';
    return;
  }

  els.products.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <h3>${product.name}</h3>
          <div class="muted">${product.category ? product.category.name : "Uncategorized"}</div>
          <div class="price">${money(product.basePrice)}</div>
          <div class="tags">
            ${(product.tags || []).slice(0, 3).map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
          <button type="button" data-product="${product._id}">View detail</button>
        </article>
      `
    )
    .join("");
}

function renderDetail(product) {
  state.selectedProduct = product;
  const variant = product.variants && product.variants[0];

  els.productDetail.innerHTML = `
    <dl>
      <dt>Name</dt><dd>${product.name}</dd>
      <dt>Price</dt><dd>${money(product.basePrice)}</dd>
      <dt>Brand</dt><dd>${product.brand || "N/A"}</dd>
      <dt>Variant</dt><dd>${variant ? variant.sku : "N/A"}</dd>
    </dl>
    <p>${product.description}</p>
    <button type="button" id="addSelectedToCart">Add first variant to cart</button>
  `;

  document.querySelector("#addSelectedToCart").addEventListener("click", () => addToCart(product));
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (els.searchText.value.trim()) params.set("q", els.searchText.value.trim());
  if (els.category.value) params.set("category", els.category.value);
  params.set("limit", "12");

  const { body } = await api(`/api/products?${params.toString()}`);
  renderProducts(body.products || []);
}

async function loadProduct(id) {
  const { body, response } = await api(`/api/products/${id}`, {
    headers: { "X-Visitor-Id": localStorage.getItem("visitorId") || crypto.randomUUID() }
  });
  const cache = response.headers.get("X-Cache") || "none";
  els.cacheBadge.textContent = `Cache: ${cache}`;
  els.cacheBadge.className = `badge ${cache}`;
  renderDetail(body);
  await loadRealtime();
}

async function addToCart(product) {
  if (!state.token) {
    showToast("Sign in before adding to cart for the checkout demo.");
    return;
  }

  const variant = product.variants && product.variants[0];
  if (!variant) {
    showToast("Product has no variant.");
    return;
  }

  await api(`/api/cart/items/${product._id}`, {
    method: "PUT",
    body: JSON.stringify({ variantSku: variant.sku, quantity: 1 })
  });
  showToast("Added to cart.");
  await loadCart();
}

function renderCart(items) {
  if (!items.length) {
    els.cart.innerHTML = '<div class="empty">Cart is empty.</div>';
    return;
  }

  els.cart.innerHTML = items
    .map(
      (item) => `
        <div class="cart-row">
          <div>
            <strong>${item.productId}</strong>
            <div class="muted">${item.variantSku} x ${item.quantity}</div>
          </div>
          <button class="ghost" type="button" data-remove="${item.productId}">Remove</button>
        </div>
      `
    )
    .join("");
}

async function loadCart() {
  if (!state.token) {
    renderCart([]);
    return;
  }
  const { body } = await api("/api/cart");
  renderCart(body);
}

async function checkout() {
  if (!state.token) {
    showToast("Sign in first.");
    return;
  }

  const shippingAddress = {
    label: "Demo",
    line1: "123 Market Street",
    city: "Thimphu",
    country: "Bhutan",
    postalCode: "11001"
  };

  const { body } = await api("/api/orders", {
    method: "POST",
    body: JSON.stringify({ shippingAddress })
  });

  showToast(`Order placed: ${body.orderNumber}`);
  await loadCart();
  await loadRealtime();
}

function renderRanked(el, rows, formatter) {
  if (!rows.length) {
    el.innerHTML = '<li class="empty">No data yet.</li>';
    return;
  }
  el.innerHTML = rows.map(formatter).join("");
}

async function loadRealtime() {
  const trendingResult = await api("/api/products/trending?limit=5");
  renderRanked(
    els.trending,
    trendingResult.body,
    (row) => `<li><span title="${row.productId}">${row.productId.slice(-8)}</span> · ${row.score}</li>`
  );

  if (state.token) {
    const viewedResult = await api("/api/products/recently-viewed");
    renderRanked(els.recentlyViewed, viewedResult.body, (id) => `<li>${id.slice(-8)}</li>`);
  } else {
    els.recentlyViewed.innerHTML = '<li class="empty">Sign in to track.</li>';
  }
}

async function loadAnalytics() {
  const [monthly, lowStock] = await Promise.all([
    api("/api/analytics/monthly-revenue"),
    api("/api/analytics/low-stock")
  ]);

  els.monthlyRevenue.textContent = JSON.stringify(monthly.body, null, 2);
  els.lowStock.textContent = JSON.stringify(lowStock.body.slice(0, 12), null, 2);
}

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const { body } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: els.email.value, password: els.password.value })
  });

  state.token = body.token;
  state.email = body.user.email;
  localStorage.setItem("token", state.token);
  localStorage.setItem("email", state.email);
  updateSession();
  showToast("Signed in.");
  await Promise.all([loadCart(), loadRealtime()]);
});

document.querySelectorAll("[data-login]").forEach((button) => {
  button.addEventListener("click", () => {
    els.email.value = button.dataset.login;
    els.password.value = "Password123!";
  });
});

els.logoutBtn.addEventListener("click", () => {
  state.token = "";
  state.email = "";
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  updateSession();
  renderCart([]);
  showToast("Signed out.");
});

els.searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadProducts();
});

els.products.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-product]");
  if (button) {
    await loadProduct(button.dataset.product);
  }
});

els.cart.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-remove]");
  if (button) {
    await api(`/api/cart/items/${button.dataset.remove}`, { method: "DELETE" });
    await loadCart();
  }
});

els.checkoutBtn.addEventListener("click", checkout);
els.refreshCart.addEventListener("click", loadCart);
els.refreshRealtime.addEventListener("click", loadRealtime);
els.loadAnalytics.addEventListener("click", async () => {
  try {
    await loadAnalytics();
  } catch (err) {
    showToast(err.message);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  showToast(event.reason.message || "Request failed.");
});

if (!localStorage.getItem("visitorId")) {
  localStorage.setItem("visitorId", crypto.randomUUID());
}

updateSession();
loadProducts().catch((err) => showToast(err.message));
loadCart().catch(() => {});
loadRealtime().catch(() => {});
