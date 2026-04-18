# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: events.spec.ts >> Dashboard >> should redirect unauthenticated user from dashboard
- Location: tests\e2e\events.spec.ts:58:7

# Error details

```
Error: expect(page).not.toHaveURL(expected) failed

Expected pattern: not /\/dashboard/
Received string: "http://localhost:3000/dashboard"
Timeout: 5000ms

Call log:
  - Expect "not toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3000/dashboard"

```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Events Page", () => {
  4  |   test("should load events page", async ({ page }) => {
  5  |     await page.goto("/events");
  6  |     await expect(page).toHaveTitle(/Events|Gater/);
  7  |   });
  8  | 
  9  |   test("should display list of events", async ({ page }) => {
  10 |     await page.goto("/events");
  11 |     const eventCards = page.locator('[class*="card"], [class*="Card"]');
  12 |     await page.waitForLoadState("networkidle");
  13 |   });
  14 | });
  15 | 
  16 | test.describe("Event Details", () => {
  17 |   test("should show 404 for non-existent event", async ({ page }) => {
  18 |     const response = await page.goto("/events/non-existent-event-" + Date.now());
  19 |     expect([200, 404]).toContain(response?.status() || 404);
  20 |   });
  21 | });
  22 | 
  23 | test.describe("Checkout Flow", () => {
  24 |   test("should require email for checkout", async ({ page }) => {
  25 |     await page.goto("/events/test-event");
  26 |     const checkoutButton = page.locator('button:has-text("Proceed to Payment"), button:has-text("Checkout")');
  27 |     
  28 |     if (await checkoutButton.isVisible()) {
  29 |       await checkoutButton.click();
  30 |       const errorToast = page.locator('[class*="toast"], text=Email is required');
  31 |       await expect(errorToast).toBeVisible({ timeout: 5000 }).catch(() => {});
  32 |     }
  33 |   });
  34 | });
  35 | 
  36 | test.describe("Checkout Phone Field", () => {
  37 |   test("should have phone input field in checkout form", async ({ page }) => {
  38 |     await page.goto("/events/test-event");
  39 |     
  40 |     const phoneInput = page.locator('input[id="phone"], input[type="tel"]');
  41 |     await page.waitForLoadState("networkidle");
  42 |   });
  43 | });
  44 | 
  45 | test.describe("Authentication", () => {
  46 |   test("should load login page", async ({ page }) => {
  47 |     await page.goto("/login");
  48 |     await expect(page.locator("body")).toBeVisible();
  49 |   });
  50 | 
  51 |   test("should load register page", async ({ page }) => {
  52 |     await page.goto("/register");
  53 |     await expect(page.locator("body")).toBeVisible();
  54 |   });
  55 | });
  56 | 
  57 | test.describe("Dashboard", () => {
  58 |   test("should redirect unauthenticated user from dashboard", async ({ page }) => {
  59 |     await page.goto("/dashboard");
> 60 |     await expect(page).not.toHaveURL(/\/dashboard/);
     |                            ^ Error: expect(page).not.toHaveURL(expected) failed
  61 |   });
  62 | });
  63 | 
  64 | test.describe("Checkout Phone Persistence", () => {
  65 |   test("should capture phone number in checkout", async ({ page }) => {
  66 |     const testEventSlug = "test-event-" + Date.now();
  67 |     
  68 |     await page.goto(`/checkout/${testEventSlug}`);
  69 |     
  70 |     const phoneInput = page.locator('input[id="phone"]');
  71 |     if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  72 |       await phoneInput.fill("08012345678");
  73 |       const value = await phoneInput.inputValue();
  74 |       expect(value).toBe("08012345678");
  75 |     }
  76 |   });
  77 | });
```