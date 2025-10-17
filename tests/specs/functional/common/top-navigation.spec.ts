import { expect, test } from '@playwright/test';
import { AppBar } from '../../../pom/common/AppBar.ts';
import SeedClient from '../../../api/SeedClient.ts';
import { SignIn } from '../../../pom/auth/SignIn.ts';
import { TEST_USER } from '../../../fixtures/auth.ts';

test.beforeEach(async ({ page }) => {
  await SeedClient.resetDatabase();
  const authPage = new SignIn(page);
  await authPage.visit();
  await authPage.signIn(TEST_USER.email, TEST_USER.password);
  await page.waitForLoadState('networkidle');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

test('should be able to access admin page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.adminLink.click();
  await expect(page).toHaveTitle('Admin');
  await expect(page.getByText('System users')).toBeVisible();
});

test('should be able to navigate to the home page', async ({ page }) => {
  const appBar = new AppBar(page);
  await appBar.adminLink.click();
  await expect(page.getByText('System users')).toBeVisible();
  await appBar.homeLink.click();
  await expect(page).toHaveTitle('Home');
});

test.afterAll(async () => {
  await SeedClient.resetDatabase();
});
