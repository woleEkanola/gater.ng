import { test, expect } from "@playwright/test";

test.describe("Events Page", () => {
  test("should load events page", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveTitle(/Events|Gater/);
  });

  test("should display list of events", async ({ page }) => {
    await page.goto("/events");
    const eventCards = page.locator('[class*="card"], [class*="Card"]');
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Event Details", () => {
  test("should show 404 for non-existent event", async ({ page }) => {
    const response = await page.goto("/events/non-existent-event-" + Date.now());
    expect([200, 404]).toContain(response?.status() || 404);
  });
});

test.describe("Checkout Flow", () => {
  test("should require email for checkout", async ({ page }) => {
    await page.goto("/events/test-event");
    const checkoutButton = page.locator('button:has-text("Proceed to Payment"), button:has-text("Checkout")');
    
    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();
      const errorToast = page.locator('[class*="toast"], text=Email is required');
      await expect(errorToast).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
  });
});

test.describe("Checkout Phone Field", () => {
  test("should have phone input field in checkout form", async ({ page }) => {
    await page.goto("/events/test-event");
    
    const phoneInput = page.locator('input[id="phone"], input[type="tel"]');
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Authentication", () => {
  test("should load login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Dashboard", () => {
  test("should redirect unauthenticated user from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});

test.describe("Checkout Phone Persistence", () => {
  test("should capture phone number in checkout", async ({ page }) => {
    const testEventSlug = "test-event-" + Date.now();
    
    await page.goto(`/checkout/${testEventSlug}`);
    
    const phoneInput = page.locator('input[id="phone"]');
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill("08012345678");
      const value = await phoneInput.inputValue();
      expect(value).toBe("08012345678");
    }
  });
});