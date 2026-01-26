
import { test, expect } from '@playwright/test';

test('agents list page loads and displays agents', async ({ page }) => {
  // Mock API response
  await page.route('*/**/api/agents', async route => {
    const json = [
      { id: '1', name: 'Test Agent', type: 'SALES', status: 'ACTIVE', executionCount: 10, errorCount: 0 }
    ];
    await route.fulfill({ json });
  });

  await page.goto('/en/agents');

  // Verify header
  await expect(page.locator('h1')).toContainText('Agents');
  
  // Verify agent card
  await expect(page.getByText('Test Agent')).toBeVisible();
  await expect(page.getByText('SALES')).toBeVisible();
});
