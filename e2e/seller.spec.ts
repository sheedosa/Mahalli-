import { test, expect } from "@playwright/test";

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    { name: "mahalli_locale", value: "en", url: baseURL! },
  ]);
});

test("seller can sign up, onboard, and add a product", async ({ page }) => {
  const stamp = Date.now();
  const email = `qa+${stamp}@test.local`;
  const slug = `qa-shop-${stamp}`;

  // ---- sign up (email confirmation is off in the test stack) ----
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  // ---- onboarding: create the shop ----
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await page.getByLabel("Shop name").fill("QA Shop");
  const slugInput = page.getByPlaceholder("layla-boutique");
  await slugInput.fill(slug);
  // wait for the availability check to settle
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Create my shop/ }).click();

  // ---- dashboard ----
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page.getByText("QA Shop")).toBeVisible();

  // ---- add a product ----
  await page.goto("/products/new");
  await page.getByLabel("Name").fill("Test Cake");
  await page.getByLabel(/Price/).fill("50");
  await page.getByLabel("Stock").fill("10");
  await page.getByRole("button", { name: /Create product/ }).click();

  // back on the products list, the new product appears
  await expect(page).toHaveURL(/\/products$/, { timeout: 15_000 });
  await expect(page.getByText("Test Cake")).toBeVisible();
});
