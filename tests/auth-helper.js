// Test helper for setting up Spotify authentication in localStorage
// This bypasses the login flow for testing purposes

/**
 * Utility function to help users get tokens from localStorage
 * Run this in the browser console after logging in to get test tokens
 */
export function getTokensForTesting() {
  console.log('Copy these values to your .env.test file:');
  console.log(`TEST_SPOTIFY_ACCESS_TOKEN=${localStorage.getItem('accessToken')}`);
  console.log(`TEST_SPOTIFY_REFRESH_TOKEN=${localStorage.getItem('refreshToken')}`);
  console.log(`TEST_TOKEN_EXPIRY=${localStorage.getItem('expiryTime')}`);
  console.log('Generated at:', new Date().toISOString());
}

/**
 * Sets up real Spotify authentication data in localStorage from environment variables
 * Uses credentials from .env.test if available
 */
export async function setupTestAuth(page) {
  const accessToken = process.env.TEST_SPOTIFY_ACCESS_TOKEN;
  const refreshToken = process.env.TEST_SPOTIFY_REFRESH_TOKEN;
  const clientId = process.env.TEST_SPOTIFY_CLIENT_ID || '8f9b61a91f38474d80dbf57d9d857408';
  const tokenExpiry = process.env.TEST_TOKEN_EXPIRY || '3600';

  if (!accessToken || !refreshToken || 
      accessToken === 'your_access_token_here' || 
      refreshToken === 'your_refresh_token_here') {
    console.warn('⚠️  No valid test credentials found in .env.test file');
    console.warn('📝 To enable full functionality testing:');
    console.warn('   1. Start the app: npm run dev');
    console.warn('   2. Login at http://localhost:5173');
    console.warn('   3. Open DevTools > Application > Local Storage');
    console.warn('   4. Copy accessToken and refreshToken values');
    console.warn('   5. Update .env.test with your real tokens');
    console.warn('   6. Re-run tests with: npm test');
    console.warn('');
    console.warn('🎭 Falling back to mock authentication (limited UI testing only)');
    return false;
  }

  // Calculate expiry time (current time + token expiry seconds)
  const expiryTime = Date.now() + (parseInt(tokenExpiry) * 1000);

  // Set up localStorage with authentication data
  await page.addInitScript((auth) => {
    localStorage.setItem('accessToken', auth.accessToken);
    localStorage.setItem('refreshToken', auth.refreshToken);
    localStorage.setItem('expiryTime', auth.tokenExpiry);
    localStorage.setItem('tokenGenerationTime', auth.tokenGenerationTime);
    
    console.log('🔐 Real Spotify authentication data loaded for testing');
    console.log('Access token:', auth.accessToken.substring(0, 20) + '...');
  }, {
    accessToken,
    refreshToken,
    tokenExpiry,
    tokenGenerationTime: Date.now().toString(),
  });

  console.log('✅ Using real Spotify credentials from .env.test');
  return true;
}

/**
 * Sets up a comprehensive mock Spotify environment for testing without real authentication
 * This creates dummy localStorage entries and mocks the Spotify Web Playback SDK
 */
export async function setupMockAuth(page) {
  await page.addInitScript(() => {
    // Mock authentication data (won't work for real API calls)
    localStorage.setItem('accessToken', 'mock_access_token_for_testing');
    localStorage.setItem('refreshToken', 'mock_refresh_token_for_testing');
    localStorage.setItem('expiryTime', '3600');
    localStorage.setItem('tokenGenerationTime', Date.now().toString());
    
    // Mock Spotify Web Playback SDK with realistic behavior
    window.Spotify = {
      Player: class MockPlayer {
        constructor(options) {
          this.name = options.name;
          this.listeners = {};
          this.deviceId = 'mock_device_' + Math.random().toString(36).substr(2, 9);
          this.isConnected = false;
          this.currentState = {
            paused: true,
            shuffle: false,
            repeat_mode: 0,
            track_window: {
              current_track: {
                name: 'Mock Song',
                artists: [{ name: 'Mock Artist' }],
                album: { name: 'Mock Album', images: [] }
              }
            }
          };
          
          // Simulate ready state after a delay
          setTimeout(() => {
            if (this.listeners.ready) {
              this.listeners.ready.forEach(fn => fn({ device_id: this.deviceId }));
            }
          }, 100);
        }
        
        addListener(event, callback) {
          if (!this.listeners[event]) this.listeners[event] = [];
          this.listeners[event].push(callback);
          
          // Immediately trigger some events for testing
          if (event === 'ready') {
            setTimeout(() => callback({ device_id: this.deviceId }), 50);
          }
        }
        
        async connect() {
          this.isConnected = true;
          // Trigger not_ready first, then ready
          setTimeout(() => {
            if (this.listeners.not_ready) {
              this.listeners.not_ready.forEach(fn => fn({ device_id: this.deviceId }));
            }
          }, 10);
          
          setTimeout(() => {
            if (this.listeners.ready) {
              this.listeners.ready.forEach(fn => fn({ device_id: this.deviceId }));
            }
          }, 50);
          
          return true;
        }
        
        async pause() {
          this.currentState.paused = true;
          this._triggerStateUpdate();
          return true;
        }
        
        async resume() {
          this.currentState.paused = false;
          this._triggerStateUpdate();
          return true;
        }
        
        async getCurrentState() {
          return this.currentState;
        }
        
        _triggerStateUpdate() {
          if (this.listeners.player_state_changed) {
            this.listeners.player_state_changed.forEach(fn => fn(this.currentState));
          }
        }
      }
    };
    
    // Mock fetch for Spotify API calls (basic responses)
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
      if (url.includes('api.spotify.com')) {
        console.log('🎭 Mocking Spotify API call:', url);
        
        // Mock different API endpoints
        if (url.includes('/me/player/devices')) {
          return new Response(JSON.stringify({
            devices: [{ id: 'mock_device', name: 'Mock Device', is_active: true }]
          }), { status: 200 });
        }
        
        if (url.includes('/me/player/queue')) {
          return new Response(JSON.stringify({
            currently_playing: { name: 'Mock Song' },
            queue: []
          }), { status: 200 });
        }
        
        // Default mock response
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      
      // Use original fetch for non-Spotify URLs
      return originalFetch.apply(this, arguments);
    };
    
    // Mock the SDK ready callback
    if (typeof window.onSpotifyWebPlaybackSDKReady === 'function') {
      setTimeout(() => window.onSpotifyWebPlaybackSDKReady(), 10);
    }
    
    console.log('🎭 Mock authentication and comprehensive Spotify SDK loaded');
    console.log('   - localStorage with auth tokens');
    console.log('   - Spotify.Player class with realistic behavior');
    console.log('   - API fetch mocking for basic endpoints');
  });
}
