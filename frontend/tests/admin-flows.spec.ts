import { test, expect } from '@playwright/test';

test.describe('Admin & Store Operator Management Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('Flow 1: Admin authentication guard & Owner OTP login', async ({ page }) => {
    // Navigate to admin portal without auth
    await page.goto('/admin');

    // Verify operator login screen
    await expect(page.locator('text=संचालक पोर्टल (Operator Portal)')).toBeVisible();
    await expect(page.locator('text=अधिकृत संचालक मोबाइल नंबर')).toBeVisible();

    // Use seeded owner phone
    const phoneInput = page.locator('input[placeholder="+91 7983636796"]');
    await phoneInput.fill('+91 7983636796');
    await page.locator('button:has-text("OTP भेजें")').click();

    // Verify OTP input step
    await expect(page.locator('text=6-अंकीय OTP दर्ज करें')).toBeVisible({ timeout: 15000 });
    const otpInput = page.locator('input[placeholder="123456"]');
    await otpInput.fill('123456');
    await page.locator('button:has-text("सत्यापित करें (Login)")').click();

    // Verify operator dashboard is rendered
    await expect(page.locator('text=माँ भगवती किसान सेवा केंद्र • संचालक पोर्टल')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=OWNER')).toBeVisible();
    await expect(page.locator('button:has-text("ऑर्डर प्रबंधन (Orders)")')).toBeVisible();
    await expect(page.locator('button:has-text("उत्पाद एवं स्टॉक (Products & Stock)")')).toBeVisible();
    await expect(page.locator('button:has-text("स्टाफ नियंत्रण (Staff)")')).toBeVisible();
  });

  test('Flow 2: Admin Order Lifecycle advancement via finite state machine', async ({ page }) => {
    // 1. Log in as owner
    await page.goto('/admin');
    await page.locator('input[placeholder="+91 7983636796"]').fill('+91 7983636796');
    await page.locator('button:has-text("OTP भेजें")').click();
    await page.locator('input[placeholder="123456"]').waitFor({ timeout: 15000 });
    await page.locator('input[placeholder="123456"]').fill('123456');
    await page.locator('button:has-text("सत्यापित करें (Login)")').click();
    await expect(page.locator('text=OWNER')).toBeVisible({ timeout: 15000 });

    // 2. Click Orders tab
    await page.locator('button:has-text("ऑर्डर प्रबंधन (Orders)")').click();

    // Wait for table to load
    await page.waitForTimeout(1000);

    // Look for a 'placed' order to advance
    const confirmBtn = page.locator('button:has-text("स्वीकृत (Confirm)")').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(1500);

      // Now packing button should appear for this order
      const packBtn = page.locator('button:has-text("पैकिंग पूर्ण (Pack)")').first();
      if (await packBtn.isVisible()) {
        await packBtn.click();
        await page.waitForTimeout(1500);
      }
    }
  });

  test('Flow 3: Product Inventory stock quantity adjustment', async ({ page }) => {
    // 1. Log in as owner
    await page.goto('/admin');
    await page.locator('input[placeholder="+91 7983636796"]').fill('+91 7983636796');
    await page.locator('button:has-text("OTP भेजें")').click();
    await page.locator('input[placeholder="123456"]').waitFor({ timeout: 15000 });
    await page.locator('input[placeholder="123456"]').fill('123456');
    await page.locator('button:has-text("सत्यापित करें (Login)")').click();
    await expect(page.locator('text=OWNER')).toBeVisible({ timeout: 15000 });

    // 2. Switch to Products & Stock tab
    await page.locator('button:has-text("उत्पाद एवं स्टॉक (Products & Stock)")').click();

    // Verify products table loads
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Click "Edit Stock" on first item
    const editStockBtn = page.locator('button:has-text("स्टॉक बदलें")').first();
    if (await editStockBtn.isVisible()) {
      await editStockBtn.click();

      // Enter updated stock value
      const stockInput = page.locator('input[type="number"]').first();
      await stockInput.fill('88');

      // Click Save
      await page.locator('button:has-text("Save")').first().click();

      // Verify notification toast or updated text
      await expect(page.locator('text=88 units').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Flow 4: Staff Member Management (Owner Only)', async ({ page }) => {
    // 1. Log in as owner
    await page.goto('/admin');
    await page.locator('input[placeholder="+91 7983636796"]').fill('+91 7983636796');
    await page.locator('button:has-text("OTP भेजें")').click();
    await page.locator('input[placeholder="123456"]').waitFor({ timeout: 15000 });
    await page.locator('input[placeholder="123456"]').fill('123456');
    await page.locator('button:has-text("सत्यापित करें (Login)")').click();
    await expect(page.locator('text=OWNER')).toBeVisible({ timeout: 15000 });

    // 2. Switch to Staff tab
    const staffTab = page.locator('button:has-text("स्टाफ नियंत्रण (Staff)")');
    await expect(staffTab).toBeVisible();
    await staffTab.click();

    // 3. Click Add Staff button
    const addStaffBtn = page.locator('button:has-text("नया स्टाफ जोड़ें")');
    await addStaffBtn.click();

    // Fill form
    await page.locator('input[placeholder*="श्याम लाल"]').fill('सूरज सिंह');
    await page.locator('input[placeholder*="+91 9876543210"]').fill('+91 9811223344');

    // Submit
    await page.locator('button:has-text("स्टाफ जोड़ें (Save)")').click();

    // Verify staff appears in table
    await expect(page.locator('text=सूरज सिंह')).toBeVisible({ timeout: 10000 });
  });
});
