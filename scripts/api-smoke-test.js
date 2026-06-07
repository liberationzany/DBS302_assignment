const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  }

  return { response, body };
}

async function login(email) {
  const { body } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "Password123!" })
  });

  if (!body.token) {
    throw new Error(`Login did not return token for ${email}`);
  }

  return body.token;
}

async function main() {
  const health = await request("/health");
  if (!health.body.ok) {
    throw new Error("Health check did not return ok=true");
  }

  const customerToken = await login("customer1@xyzshop.test");
  const adminToken = await login("admin@xyzshop.test");
  const smokeEmail = `api-smoke-${Date.now()}@xyzshop.test`;
  const smokeUser = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "API Smoke User",
      email: smokeEmail,
      password: "Password123!"
    })
  });
  const smokeToken = smokeUser.body.token;

  const productsResult = await request("/api/products?limit=5");
  const products = productsResult.body.products || [];
  if (products.length === 0) {
    throw new Error("Product list is empty. Run npm run seed first.");
  }

  const productId = products[0]._id;
  const firstDetail = await request(`/api/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${customerToken}`,
      "X-Visitor-Id": "api-smoke-test"
    }
  });
  const secondDetail = await request(`/api/products/${productId}`, {
    headers: {
      Authorization: `Bearer ${customerToken}`,
      "X-Visitor-Id": "api-smoke-test"
    }
  });

  const firstCache = firstDetail.response.headers.get("x-cache");
  const secondCache = secondDetail.response.headers.get("x-cache");

  if (!["miss", "hit"].includes(firstCache) || secondCache !== "hit") {
    throw new Error(`Unexpected cache headers: first=${firstCache}, second=${secondCache}`);
  }

  await request("/api/products/trending?limit=5");
  await request("/api/products/recently-viewed", {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  await request("/api/analytics/monthly-revenue", {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  await request("/api/analytics/low-stock", {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  const categorySlug = `api-smoke-${Date.now()}`;
  const createdCategory = await request("/api/categories", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: "API Smoke Category",
      slug: categorySlug,
      attributeDefinitions: [{ key: "demo", label: "Demo", type: "string" }]
    })
  });
  await request(`/api/categories/${createdCategory.body._id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "API Smoke Category Updated" })
  });
  await request(`/api/categories/${createdCategory.body._id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  await request("/api/users/me", {
    headers: { Authorization: `Bearer ${smokeToken}` }
  });
  await request("/api/users/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${smokeToken}` },
    body: JSON.stringify({ name: "API Smoke User Updated" })
  });
  await request(`/api/users/me/wishlist/${productId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${smokeToken}` }
  });
  await request(`/api/users/me/wishlist/${productId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${smokeToken}` }
  });

  const createdReview = await request(`/api/products/${productId}/reviews`, {
    method: "POST",
    headers: { Authorization: `Bearer ${smokeToken}` },
    body: JSON.stringify({
      rating: 5,
      title: "Smoke test review",
      body: "Created by automated smoke test."
    })
  });
  await request(`/api/reviews/${createdReview.body._id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${smokeToken}` },
    body: JSON.stringify({ rating: 4 })
  });
  await request(`/api/reviews/${createdReview.body._id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${smokeToken}` }
  });

  console.log(
    "API smoke test passed: health, auth, products, categories, profile, wishlist, reviews, Redis features, and analytics are reachable."
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
