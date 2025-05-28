#!/usr/bin/env node

/**
 * Helper script to extract Spotify tokens for testing
 * Run this after logging into the app to get tokens for .env.test
 */

console.log(`
🎵 CleanPlayer Test Token Extractor
===================================

To get tokens for testing:

1. Start the app:
   npm run dev

2. Open http://localhost:5173 and complete the login flow

3. Open browser DevTools (F12)

4. Go to: Application > Storage > Local Storage > http://localhost:5173

5. Copy the following values and update your .env.test file:
   - accessToken
   - refreshToken
   - expiryTime (optional)

6. Or run this in the browser console to copy all values:

   // Copy this function and run it in browser console:
   function getTokensForTesting() {
     console.log('Copy these to .env.test:');
     console.log('TEST_SPOTIFY_ACCESS_TOKEN=' + localStorage.getItem('accessToken'));
     console.log('TEST_SPOTIFY_REFRESH_TOKEN=' + localStorage.getItem('refreshToken')); 
     console.log('TEST_TOKEN_EXPIRY=' + localStorage.getItem('expiryTime'));
   }
   getTokensForTesting();

7. Run tests:
   npm test

Note: Spotify Premium required for Web Playback SDK functionality.
Tokens expire after ~1 hour, so you may need to refresh them periodically.
`);
