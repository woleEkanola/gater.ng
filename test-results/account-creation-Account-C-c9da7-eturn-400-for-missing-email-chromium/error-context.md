# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: account-creation.spec.ts >> Account Creation APIs >> POST /api/auth/check-email - should return 400 for missing email
- Location: tests\e2e\account-creation.spec.ts:12:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Account Creation APIs", () => {
  4  |   test("POST /api/auth/check-email - should return exists=false for new email", async ({ request }) => {
  5  |     const response = await request.post("http://localhost:3000/api/auth/check-email", {
  6  |       data: JSON.stringify({ email: `new-${Date.now()}@test.com` }),
  7  |     });
  8  |     const data = await response.json();
  9  |     expect(data.exists).toBe(false);
  10 |   });
  11 | 
  12 |   test("POST /api/auth/check-email - should return 400 for missing email", async ({ request }) => {
  13 |     const response = await request.post("http://localhost:3000/api/auth/check-email", {
  14 |       data: JSON.stringify({}),
  15 |     });
> 16 |     expect(response.status()).toBe(400);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  17 |   });
  18 | 
  19 |   test("POST /api/auth/create-account - should create account with valid password", async ({ request }) => {
  20 |     const email = `e2e-create-${Date.now()}@test.com`;
  21 |     const response = await request.post("http://localhost:3000/api/auth/create-account", {
  22 |       data: JSON.stringify({ email, password: "testpass123" }),
  23 |     });
  24 |     expect(response.status()).toBe(200);
  25 |   });
  26 | 
  27 |   test("POST /api/auth/create-account - should reject short password", async ({ request }) => {
  28 |     const response = await request.post("http://localhost:3000/api/auth/create-account", {
  29 |       data: JSON.stringify({ email: `short-${Date.now()}@test.com`, password: "123" }),
  30 |     });
  31 |     expect(response.status()).toBe(400);
  32 |   });
  33 | 
  34 |   test("POST /api/auth/create-account - should reject missing password", async ({ request }) => {
  35 |     const response = await request.post("http://localhost:3000/api/auth/create-account", {
  36 |       data: JSON.stringify({ email: `missing-${Date.now()}@test.com` }),
  37 |     });
  38 |     expect(response.status()).toBe(400);
  39 |   });
  40 | 
  41 |   test("POST /api/auth/create-account - should reject missing email", async ({ request }) => {
  42 |     const response = await request.post("http://localhost:3000/api/auth/create-account", {
  43 |       data: JSON.stringify({ password: "testpass123" }),
  44 |     });
  45 |     expect(response.status()).toBe(400);
  46 |   });
  47 | 
  48 |   test("POST /api/auth/send-magic-link - should return 400 for missing email", async ({ request }) => {
  49 |     const response = await request.post("http://localhost:3000/api/auth/send-magic-link", {
  50 |       data: JSON.stringify({}),
  51 |     });
  52 |     expect(response.status()).toBe(400);
  53 |   });
  54 | });
  55 | 
  56 | test.describe("Checkout Success Page", () => {
  57 |   test("should load checkout success page", async ({ page }) => {
  58 |     await page.goto("/checkout/success?reference=invalid&orderId=invalid");
  59 |     await page.waitForTimeout(3000);
  60 |     expect(page.url()).toContain("checkout/success");
  61 |   });
  62 | });
  63 | 
  64 | test.describe("Public Pages", () => {
  65 |   test("should load homepage", async ({ page }) => {
  66 |     await page.goto("/");
  67 |     await expect(page.getByRole("heading", { name: "Discover events that inspire" })).toBeVisible({ timeout: 10000 });
  68 |   });
  69 | 
  70 |   test("should load events page", async ({ page }) => {
  71 |     await page.goto("/events");
  72 |     await expect(page.getByRole("heading", { name: "Upcoming Events" })).toBeVisible({ timeout: 10000 });
  73 |   });
  74 | 
  75 |   test("should load login page", async ({ page }) => {
  76 |     await page.goto("/login");
  77 |     await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible({ timeout: 10000 });
  78 |   });
  79 | 
  80 |   test("should load organizer page", async ({ page }) => {
  81 |     await page.goto("/organizer");
  82 |     await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });
  83 |   });
  84 | });
```