import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

test.describe("Gater.ng E2E Tests", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load events page", async ({ page }) => {
    await page.goto(`${BASE_URL}/events`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load login page", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load register page", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await expect(page.locator("body")).toBeVisible();
  });
});