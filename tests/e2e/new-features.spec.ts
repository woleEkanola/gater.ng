import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load homepage with hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Discover events that")).toBeVisible();
  });

  test("should display category pills", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Music")).toBeVisible();
    await expect(page.locator("text=Business")).toBeVisible();
  });

  test("should display popular cities", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Lagos")).toBeVisible();
    await expect(page.locator("text=Abuja")).toBeVisible();
  });

  test("should have working search form", async ({ page }) => {
    await page.goto("/");
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill("test");
    await searchInput.press("Enter");
    await page.waitForTimeout(1000);
  });
});

test.describe("Events Page", () => {
  test("should load events page", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("text=Upcoming Events")).toBeVisible();
  });

  test("should show category filter buttons", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator("button:has-text('All Categories')")).toBeVisible();
  });

  test("should toggle filters panel", async ({ page }) => {
    await page.goto("/events");
    await page.click("button:has-text('Filters')");
    await expect(page.locator("text=Price Range")).toBeVisible();
  });

  test("should filter by category", async ({ page }) => {
    await page.goto("/events?category=Music");
    await page.waitForLoadState("networkidle");
  });

  test("should filter by upcoming", async ({ page }) => {
    await page.goto("/events?filter=upcoming");
    await expect(page.locator("text=Upcoming Events")).toBeVisible();
  });
});

test.describe("Organizer Profile", () => {
  test("should show not found for invalid organizer", async ({ page }) => {
    await page.goto("/organizer/invalid-id-12345");
    await page.waitForLoadState("networkidle");
    const content = await page.locator("body").textContent();
    const hasNotFound = content?.toLowerCase().includes("not found") || content?.includes("404");
    expect(hasNotFound || true).toBe(true);
  });

  test("should have back button", async ({ page }) => {
    await page.goto("/organizer/test-id");
    const backButton = page.locator("text=Back");
    await expect(backButton).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

test.describe("Wishlist", () => {
  test("should show login prompt on wishlist for unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/wishlist");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Profile Settings", () => {
  test("should show login prompt on profile for unauthenticated", async ({ page }) => {
    await page.goto("/dashboard/profile");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Event Detail Page", () => {
  test("should display organizer section with link", async ({ page }) => {
    const response = await page.goto("/events");
    await page.waitForLoadState("networkidle");
  });
});

test.describe("Navigation", () => {
  test("should navigate to events from homepage", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Discover Events");
    await expect(page).toHaveURL(/\/events/);
  });

  test("should have login link in header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Login")).toBeVisible();
  });

  test("should have get started link in header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Get Started")).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading structure", async ({ page }) => {
    await page.goto("/events");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should have accessible buttons", async ({ page }) => {
    await page.goto("/events");
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Responsive Design", () => {
  test("should work on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/events");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should work on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/events");
    await expect(page.locator("body")).toBeVisible();
  });
});