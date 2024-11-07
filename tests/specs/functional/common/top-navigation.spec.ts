import { expect, test } from '@playwright/test';
import { AppBar } from '../../../pom/common/AppBar.ts';
import SeedClient from '../../../api/SeedClient.ts';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  await page.goto('/');
});

test('should be able to access admin page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.adminLink.click();
  await expect(page).toHaveTitle('Admin');
  await expect(page.getByText('System users')).toBeVisible();
});

test('should be able to navigate to the catalog page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.adminLink.click();
  await expect(page.getByText('System users')).toBeVisible();
  await appBar.catalogLink.click();
  await expect(page).toHaveTitle('Catalog');
  await expect(page.getByText('0 available repositories')).toBeVisible();
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
