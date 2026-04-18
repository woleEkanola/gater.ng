# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: new-features.spec.ts >> Homepage >> should display popular cities
- Location: tests\e2e\new-features.spec.ts:15:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Lagos')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Lagos')

```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("Homepage", () => {
  4   |   test("should load homepage with hero section", async ({ page }) => {
  5   |     await page.goto("/");
  6   |     await expect(page.locator("text=Discover events that")).toBeVisible();
  7   |   });
  8   | 
  9   |   test("should display category pills", async ({ page }) => {
  10  |     await page.goto("/");
  11  |     await expect(page.locator("text=Music")).toBeVisible();
  12  |     await expect(page.locator("text=Business")).toBeVisible();
  13  |   });
  14  | 
  15  |   test("should display popular cities", async ({ page }) => {
  16  |     await page.goto("/");
> 17  |     await expect(page.locator("text=Lagos")).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
  18  |     await expect(page.locator("text=Abuja")).toBeVisible();
  19  |   });
  20  | 
  21  |   test("should have working search form", async ({ page }) => {
  22  |     await page.goto("/");
  23  |     const searchInput = page.locator('input[placeholder*="Search"]');
  24  |     await searchInput.fill("test");
  25  |     await searchInput.press("Enter");
  26  |     await page.waitForTimeout(1000);
  27  |   });
  28  | });
  29  | 
  30  | test.describe("Events Page", () => {
  31  |   test("should load events page", async ({ page }) => {
  32  |     await page.goto("/events");
  33  |     await expect(page.locator("text=Upcoming Events")).toBeVisible();
  34  |   });
  35  | 
  36  |   test("should show category filter buttons", async ({ page }) => {
  37  |     await page.goto("/events");
  38  |     await expect(page.locator("button:has-text('All Categories')")).toBeVisible();
  39  |   });
  40  | 
  41  |   test("should toggle filters panel", async ({ page }) => {
  42  |     await page.goto("/events");
  43  |     await page.click("button:has-text('Filters')");
  44  |     await expect(page.locator("text=Price Range")).toBeVisible();
  45  |   });
  46  | 
  47  |   test("should filter by category", async ({ page }) => {
  48  |     await page.goto("/events?category=Music");
  49  |     await page.waitForLoadState("networkidle");
  50  |   });
  51  | 
  52  |   test("should filter by upcoming", async ({ page }) => {
  53  |     await page.goto("/events?filter=upcoming");
  54  |     await expect(page.locator("text=Upcoming Events")).toBeVisible();
  55  |   });
  56  | });
  57  | 
  58  | test.describe("Organizer Profile", () => {
  59  |   test("should show not found for invalid organizer", async ({ page }) => {
  60  |     await page.goto("/organizer/invalid-id-12345");
  61  |     await page.waitForLoadState("networkidle");
  62  |     const content = await page.locator("body").textContent();
  63  |     const hasNotFound = content?.toLowerCase().includes("not found") || content?.includes("404");
  64  |     expect(hasNotFound || true).toBe(true);
  65  |   });
  66  | 
  67  |   test("should have back button", async ({ page }) => {
  68  |     await page.goto("/organizer/test-id");
  69  |     const backButton = page.locator("text=Back");
  70  |     await expect(backButton).toBeVisible({ timeout: 5000 }).catch(() => {});
  71  |   });
  72  | });
  73  | 
  74  | test.describe("Wishlist", () => {
  75  |   test("should show login prompt on wishlist for unauthenticated", async ({ page }) => {
  76  |     await page.goto("/dashboard/wishlist");
  77  |     await expect(page).toHaveURL(/\/login/);
  78  |   });
  79  | });
  80  | 
  81  | test.describe("Profile Settings", () => {
  82  |   test("should show login prompt on profile for unauthenticated", async ({ page }) => {
  83  |     await page.goto("/dashboard/profile");
  84  |     await expect(page).toHaveURL(/\/login/);
  85  |   });
  86  | });
  87  | 
  88  | test.describe("Event Detail Page", () => {
  89  |   test("should display organizer section with link", async ({ page }) => {
  90  |     const response = await page.goto("/events");
  91  |     await page.waitForLoadState("networkidle");
  92  |   });
  93  | });
  94  | 
  95  | test.describe("Navigation", () => {
  96  |   test("should navigate to events from homepage", async ({ page }) => {
  97  |     await page.goto("/");
  98  |     await page.click("text=Discover Events");
  99  |     await expect(page).toHaveURL(/\/events/);
  100 |   });
  101 | 
  102 |   test("should have login link in header", async ({ page }) => {
  103 |     await page.goto("/");
  104 |     await expect(page.locator("text=Login")).toBeVisible();
  105 |   });
  106 | 
  107 |   test("should have get started link in header", async ({ page }) => {
  108 |     await page.goto("/");
  109 |     await expect(page.locator("text=Get Started")).toBeVisible();
  110 |   });
  111 | });
  112 | 
  113 | test.describe("Accessibility", () => {
  114 |   test("should have proper heading structure", async ({ page }) => {
  115 |     await page.goto("/events");
  116 |     const h1 = page.locator("h1");
  117 |     await expect(h1).toBeVisible();
```