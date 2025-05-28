// @ts-check
import { test, expect } from '@playwright/test';

// Minimal test to check if Playwright setup works
test('minimal health check', async ({ page }) => {
  console.log('🔍 Starting minimal health check...');
  
  try {
    // Navigate to the kids page
    await page.goto('/kids', { timeout: 10000 });
    console.log('✅ Page navigation successful');
    
    // Check if page loaded
    await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    console.log('✅ Body element visible');
    
    // Check for album elements (the main content of the kids page)
    const albums = page.locator('.album');
    await expect(albums).toHaveCount(2, { timeout: 10000 });
    console.log('✅ Album elements visible');
    
    // Check that albums are properly structured
    const firstAlbum = albums.first();
    await expect(firstAlbum).toBeVisible({ timeout: 5000 });
    console.log('✅ First album element visible');
    
    console.log('🎉 Minimal health check completed successfully');
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    throw error;
  }
});
