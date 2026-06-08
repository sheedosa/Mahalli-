import { test, expect } from "@playwright/test";

// Force the English UI for stable selectors (app locale is cookie-driven).
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    { name: "mahalli_locale", value: "en", url: baseURL! },
  ]);
});

test("buyer can browse the storefront and place an order", async ({ page }) => {
  await page.goto("/demo-shop");

  // Shop + a seeded product show (shop name appears in the bar + hero, so .first()).
  await expect(page.getByText("Demo Bakery").first()).toBeVisible();
  await expect(page.getByText("Chocolate Cake")).toBeVisible();

  // Open the product → choose a variant → add to cart.
  await page.getByText("Chocolate Cake").click();
  await page.getByRole("button", { name: "Large" }).click();
  await page.getByRole("button", { name: /Add to cart/ }).click();

  // Floating cart → checkout.
  await page.getByRole("button", { name: /View order/ }).click();

  // Buyer details + place order.
  await page.getByPlaceholder("Your name").fill("Test Buyer");
  await page.getByPlaceholder("09xxxxxxxx").fill("0911234567");
  await page.getByRole("combobox").selectOption({ value: "Tripoli" });
  await page.getByRole("button", { name: "Place order" }).click();

  // Success screen with a reference.
  await expect(page.getByText("Order received!")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/^#/)).toBeVisible();
});
