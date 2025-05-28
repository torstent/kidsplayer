# CleanPlayer - Spotify Web Player

This is a SvelteKit-based Spotify Web Player application focused on providing a cleaner experience than the official Spotify app. The application uses the Spotify Web Playback SDK and requires Spotify Premium. Please follow these guidelines when contributing:

## Code Standards

### Required Before Each Commit
- Run `npm run dev` locally to test changes before committing
- Ensure all browser-specific code is wrapped in `browser` checks from `$app/environment`
- Test OAuth flow and player functionality across different routes

### Development Flow
- **Install**: `npm install` (requires Node.js 22+ as specified in `.nvmrc`)
- **Development**: `npm run dev` (starts dev server on port 5173)
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Repository Structure

### Core Application
- `src/app.html`: Main HTML template
- `src/routes/`: SvelteKit route definitions
  - `+page.svelte`: Main player interface
  - `kids/`: Specialized kids album interface with shuffle controls
  - `test/`: Testing/development route
- `src/lib/`: Core application logic and components

### Components
- `src/lib/components/`: Svelte components
  - `MainWindow.svelte`: Primary player interface with full controls
  - `SpotifyLogin.svelte`: OAuth login flow (contains hardcoded client ID)
  - `EntranceWindow.svelte`, `MenuWindow.svelte`, `OptionsWindow.svelte`: UI containers
  - `Queue.svelte`, `Settings.svelte`: Player features
  - `SongListItem.svelte`: Track display component

### Spotify Integration
- `src/lib/spotifyUtils/`: Spotify API and SDK integration
  - `auth.js`: OAuth 2.0 PKCE flow, token management, refresh logic
  - `player.js`: Web Playback SDK initialization and device management
  - `playerApi.js`: Spotify Web API calls (play, pause, shuffle, repeat, queue)
- `src/lib/spotifyUtils.js`: Unified exports for Spotify functionality
- `src/lib/stores.js`: Svelte stores for application state
- `src/lib/commonUtils.js`: Shared utility functions

### Static Assets
- `static/`: Static files including favicon and privacy policy
- `src/lib/assets/`: Spotify logos and branding

## Key Guidelines

### 1. Spotify Integration
- **Client ID**: Currently hardcoded as `8f9b61a91f38474d80dbf57d9d857408` in multiple files
- **OAuth Flow**: Uses PKCE (Proof Key for Code Exchange) with redirect URI `http://localhost:5173/`
- **Required Scopes**: Full playback control, library access, user profile, and streaming
- **Premium Required**: Application requires Spotify Premium due to Web Playback SDK limitations

### 2. Server-Side Rendering (SSR)
- **CRITICAL**: All routes have `export const ssr = false;` in their `+page.js` files
- Always wrap browser-specific code with `if (browser)` checks from `$app/environment`
- Use `onMount` for initialization code that requires browser APIs
- Window object access must be browser-guarded

### 3. Authentication State Management
- Tokens stored in `localStorage`: `accessToken`, `refreshToken`, `expiryTime`, `tokenGenerationTime`
- Automatic token refresh when expired
- Auth states: `"good"` (authenticated), `"bad"` (needs login), `"waiting"` (initializing)
- Always check token validity before making API calls

### 4. Player Architecture
- **Web Playback SDK**: Loads from `https://sdk.scdn.co/spotify-player.js`
- **Device Management**: Each route can create its own player instance with unique names
- **State Synchronization**: Player state tracked through SDK event listeners
- **Queue Management**: Real-time queue updates with API polling

### 5. Route-Specific Features
- **Main Route (`/`)**: Full-featured player with all controls
- **Kids Route (`/kids`)**: Simplified album-based interface with automatic shuffle disabling
- **Test Route (`/test`)**: Development/testing interface

### 6. Error Handling
- Use `@zerodevx/svelte-toast` for user notifications
- Console logging for debugging (especially authentication and player events)
- Graceful fallbacks for API failures
- Proper HTTP status code handling (200, 202, 204 for success)

### 7. User Experience
- **Toast Notifications**: Inform users of auth status, player events, and errors
- **Visual Feedback**: Loading states, play/pause indicators, shuffle/repeat status
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Proper ARIA roles and keyboard navigation

### 8. Code Organization Patterns
- **Async/Await**: All Spotify API calls use async/await pattern
- **Error Boundaries**: Try-catch blocks around API calls
- **State Management**: Reactive Svelte stores for global state
- **Component Communication**: Props and events for parent-child communication

## Common Patterns

### API Call Pattern
```javascript
async function callSpotifyAPI() {
  try {
    const token = await getAccessToken();
    const response = await fetch('https://api.spotify.com/v1/...', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      console.error('API call failed:', response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    toast.push('Error message');
  }
}
```

### Browser Guard Pattern
```javascript
import { browser } from '$app/environment';
import { onMount } from 'svelte';

onMount(() => {
  if (browser) {
    // Browser-specific code here
  }
});
```

### Player Initialization Pattern
```javascript
if (browser && !window.Spotify) {
  // Load SDK
  const script = document.createElement('script');
  script.src = 'https://sdk.scdn.co/spotify-player.js';
  document.head.appendChild(script);
  
  await new Promise(resolve => {
    window.onSpotifyWebPlaybackSDKReady = resolve;
  });
}
```

## Security Notes
- Client ID is currently hardcoded and should be externalized to environment variables
- All authentication uses secure PKCE flow without client secrets
- Tokens are stored in localStorage (consider more secure alternatives for production)
- Always validate tokens before use

## Testing Considerations
- Test OAuth flow with different scenarios (first login, token refresh, errors)
- Verify player functionality across all routes
- Test device handoff and multi-device scenarios
- Ensure proper cleanup of event listeners and timers
