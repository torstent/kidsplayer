// @ts-check
import { test, expect } from '@playwright/test';

// This test verifies the new control buttons in the kids route
test('kids player controls functionality', async ({ page }) => {
  // Navigate to the kids route
  await page.goto('/kids');
  
  // Wait for the player to be ready
  await page.waitForSelector('.status.ready', { timeout: 30000 });
  
  // Verify that the player controls are visible when a track is playing
  // Note: We can't actually test playback as it requires Spotify Premium authentication
  // This is a visual test to ensure the controls are rendered properly
  
  // Check for the presence of control buttons
  const shuffleButton = page.locator('button.control-button span:has-text("shuffle")');
  const backwardButton = page.locator('button.control-button span:has-text("replay_30")');
  const playButton = page.locator('button.play-button');
  const forwardButton = page.locator('button.control-button span:has-text("forward_30")');
  const trackListButton = page.locator('button.control-button span:has-text("queue_music")');
  
  // These elements should be present when the UI is properly rendered
  // Actual functionality testing would require a real Spotify Premium account
  await expect(shuffleButton).toBeVisible();
  await expect(backwardButton).toBeVisible();
  await expect(playButton).toBeVisible();
  await expect(forwardButton).toBeVisible();
  await expect(trackListButton).toBeVisible();
});