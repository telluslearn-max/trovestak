import { test, expect } from "@playwright/test";

test.describe("Critical User Flows", () => {
  test("browse homepage", async ({ page }) => {
    await page.goto("/");
    
    // Verify page loads
    await expect(page).toHaveTitle(/Trovestak/);
    
    // Verify navigation is visible
    await expect(page.getByRole("navigation")).toBeVisible();
    
    // Verify hero section
    await expect(page.getByText(/Premium Electronics/i)).toBeVisible();
  });

  test("product discovery flow", async ({ page }) => {
    await page.goto("/");
    
    // Navigate to store
    await page.getByRole("link", { name: /Store/i }).click();
    await expect(page).toHaveURL(/\/store/);
    
    // Verify product grid
    await expect(page.locator("[data-testid='product-grid']")).toBeVisible();
  });

  test("product detail page", async ({ page }) => {
    // Navigate to a product
    await page.goto("/products/iphone-15-pro");
    
    // Verify product info
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Add to Bag/i)).toBeVisible();
    
    // Verify product image
    await expect(page.locator("img[alt*='iPhone']").first()).toBeVisible();
  });

  test("add to cart flow", async ({ page }) => {
    await page.goto("/products/iphone-15-pro");
    
    // Add to cart
    await page.getByRole("button", { name: /Add to Bag/i }).click();
    
    // Wait for success state
    await expect(page.getByText(/Added to Bag/i)).toBeVisible();
    
    // Verify cart count updated
    await expect(page.getByTestId("cart-count")).toContainText("1");
  });

  test("cart page", async ({ page }) => {
    // Add item first
    await page.goto("/products/iphone-15-pro");
    await page.getByRole("button", { name: /Add to Bag/i }).click();
    
    // Go to cart
    await page.goto("/cart");
    
    // Verify cart items
    await expect(page.getByText(/Shopping Bag/i)).toBeVisible();
    await expect(page.getByTestId("cart-item")).toHaveCount(1);
    
    // Verify checkout button
    await expect(page.getByRole("link", { name: /Checkout/i })).toBeVisible();
  });

  test("checkout flow", async ({ page }) => {
    // Add item and go to checkout
    await page.goto("/products/iphone-15-pro");
    await page.getByRole("button", { name: /Add to Bag/i }).click();
    await page.goto("/cart");
    await page.getByRole("link", { name: /Checkout/i }).click();
    
    // Fill shipping form
    await page.getByLabel(/First Name/i).fill("John");
    await page.getByLabel(/Last Name/i).fill("Doe");
    await page.getByLabel(/Email/i).fill("john@example.com");
    await page.getByLabel(/Phone/i).fill("0712345678");
    await page.getByLabel(/Street Address/i).fill("123 Test Street");
    await page.getByLabel(/City/i).fill("Nairobi");
    await page.getByLabel(/County/i).selectOption("Nairobi");
    await page.getByLabel(/Postal Code/i).fill("00100");
    
    // Continue to payment
    await page.getByRole("button", { name: /Continue to Payment/i }).click();
    
    // Verify payment page
    await expect(page.getByText(/M-Pesa/i)).toBeVisible();
  });
});

test.describe("SEO & Performance", () => {
  test("page has proper meta tags", async ({ page }) => {
    await page.goto("/");
    
    // Verify meta description
    const metaDescription = await page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute("content", /.+/);
  });

  test("page loads critical resources", async ({ page }) => {
    await page.goto("/");
    
    // Check no console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate and wait
    await page.waitForLoadState("networkidle");
    
    // Should have no critical errors
    expect(consoleErrors.filter(e => !e.includes("favicon"))).toHaveLength(0);
  });

  test("responsive design", async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible();
    
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.getByRole("navigation")).toBeVisible();
    
    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();
    await expect(page.getByRole("navigation")).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("sign in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /Sign In/i })).toBeVisible();
  });

  test("sign up page loads", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: /Create Account/i })).toBeVisible();
  });

  test("protected routes redirect", async ({ page }) => {
    await page.goto("/account");
    // Should redirect to sign in
    await expect(page).toHaveURL(/sign-in/);
  });
});
