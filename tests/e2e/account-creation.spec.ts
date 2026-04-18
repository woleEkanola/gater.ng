import { test, expect } from "@playwright/test";

test.describe("Account Creation APIs", () => {
  test("POST /api/auth/check-email - should return exists=false for new email", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/auth/check-email", {
      data: JSON.stringify({ email: `new-${Date.now()}@test.com` }),
    });
    const data = await response.json();
    expect(data.exists).toBe(false);
  });

  test("POST /api/auth/check-email - should return 400 for missing email", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/auth/check-email", {
      data: JSON.stringify({}),
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/auth/create-account - should create account with valid password", async ({ request }) => {
    const email = `e2e-create-${Date.now()}@test.com`;
    const response = await request.post("http://localhost:3000/api/auth/create-account", {
      data: JSON.stringify({ email, password: "testpass123" }),
    });
    expect(response.status()).toBe(200);
  });

  test("POST /api/auth/create-account - should reject short password", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/auth/create-account", {
      data: JSON.stringify({ email: `short-${Date.now()}@test.com`, password: "123" }),
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/auth/create-account - should reject missing password", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/auth/create-account", {
      data: JSON.stringify({ email: `missing-${Date.now()}@test.com` }),
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/auth/create-account - should reject missing email", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/auth/create-account", {
      data: JSON.stringify({ password: "testpass123" }),
    });
    expect(response.status()).toBe(400);
  });

  test("POST /api/auth/send-magic-link - should return 400 for missing email", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/auth/send-magic-link", {
      data: JSON.stringify({}),
    });
    expect(response.status()).toBe(400);
  });
});

test.describe("Checkout Success Page", () => {
  test("should load checkout success page", async ({ page }) => {
    await page.goto("/checkout/success?reference=invalid&orderId=invalid");
    await page.waitForTimeout(3000);
    expect(page.url()).toContain("checkout/success");
  });
});

test.describe("Public Pages", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Discover events that inspire" })).toBeVisible({ timeout: 10000 });
  });

  test("should load events page", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByRole("heading", { name: "Upcoming Events" })).toBeVisible({ timeout: 10000 });
  });

  test("should load login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible({ timeout: 10000 });
  });

  test("should load organizer page", async ({ page }) => {
    await page.goto("/organizer");
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  });
});