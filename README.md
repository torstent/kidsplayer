# cleanplayer
https://cleanplayer.pages.dev/

A Spotify player that is focused on being cleaner than the official app.

Built as a browser SPA written in Svelte using SvelteKit

Note: Spotify Premium is required (this is enforced by the Spotify's Web Playback SDK)

## Features:
- Amazing fullscreen experience (eg. for your second screen)
- Integrated playback controls including shuffle, repeat and volume
- Spotify connect support (select your music from another device)
- Use your existing Spotify library
- Listen to music directly inside the player
- Show album and playback context
- Queue view for up to 20 tracks
- Song, album, and artist links to Spotify website

## Screenshots:

![Main screen](https://i.imgur.com/irfORJs.png)
![Queue view](https://i.imgur.com/Z9xHdnP.png)
Responsive layout:
![Responsive layout](https://i.imgur.com/84XuAGG.png)

## Development

### Getting Started
```bash
npm install
npm run dev
```

### Testing

The app includes Playwright tests that can run with either real Spotify authentication or mock authentication for basic UI testing.

#### Setting up Test Authentication

For full functionality testing, you'll need real Spotify tokens:

1. **Get test tokens:**
   ```bash
   npm run test:tokens  # Shows instructions
   ```

2. **Login and extract tokens:**
   - Start the app: `npm run dev`
   - Login at http://localhost:5173
   - Open DevTools > Application > Local Storage
   - Copy `accessToken` and `refreshToken` values

3. **Update test environment:**
   ```bash
   # Edit .env.test with your real tokens
   TEST_SPOTIFY_ACCESS_TOKEN=your_actual_access_token
   TEST_SPOTIFY_REFRESH_TOKEN=your_actual_refresh_token
   ```

4. **Run tests:**
   ```bash
   npm test  # Runs all Playwright tests
   ```

#### Test Modes

- **Real Auth Mode**: Uses your actual Spotify tokens, tests full functionality including playback controls
- **Mock Auth Mode**: Uses fake tokens, tests only UI rendering and basic interactions

**Note**: Tokens expire after ~1 hour. If tests start failing, refresh your tokens and update `.env.test`.