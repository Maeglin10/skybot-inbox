
import { test, expect } from '@playwright/test';

test('agent details page loads', async ({ page }) => {
  await page.goto('/en/agents/1');
  
  // Checking for some content. Since we have mocks/skeletons, waiting for load.
  // With current implementation it might show loading or mock data.
  // Assuming mock data is rendered if API fails or mocked manually.
  
  // Just check basic structure existence
  await expect(page.locator('h1')).toBeVisible(); 
  // Should have tabs
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Metrics' })).toBeVisible();
});
