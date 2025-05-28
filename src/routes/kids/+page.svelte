<script>
import { onMount } from "svelte";
import { browser } from "$app/environment";
import { toast } from "@zerodevx/svelte-toast";
import { SvelteToast } from "@zerodevx/svelte-toast";

// Zwei Spotify-Alben mit Cover und Startfunktion
const albums = [
  {
    id: "1Sd7bF2ZKQW6H0yJRRLxnk",
    url: "https://open.spotify.com/intl-de/album/1Sd7bF2ZKQW6H0yJRRLxnk?si=TXFxuQpsTwSYGdj71uTHng"
  },
  {
    id: "3gpbouGEBPdEmAuvZObheF",
    url: "https://open.spotify.com/intl-de/album/3gpbouGEBPdEmAuvZObheF?si=SJuj8pLrRUWIEtxPcOJQ4Q"
  }
];

let covers = [null, null];
let player = null;
let deviceId = null;
let isPlayerReady = false;
let isPlaying = false;
let currentTrack = null;
let currentAlbumId = null;
let shuffleState = false;

// Holt das Albumcover von der Spotify API
async function getAlbumCover(albumId) {
  const { getAccessToken } = await import("$lib/spotifyUtils/auth.js");
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Nimm das größte Bild
  return data.images[0]?.url;
}

// Initialize Spotify Web Player
async function initializePlayer() {
  if (!browser) return;
  
  const { getAccessToken } = await import("$lib/spotifyUtils/auth.js");
  const token = await getAccessToken();
  
  if (!token) {
    toast.push("Please login to Spotify first");
    return;
  }

  // Load Spotify Web Playback SDK if not already loaded
  if (!window.Spotify) {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.head.appendChild(script);
    
    await new Promise((resolve) => {
      window.onSpotifyWebPlaybackSDKReady = resolve;
    });
  }

  player = new Spotify.Player({
    name: 'CleanPlayer Kids',
    getOAuthToken: async cb => {
      const token = await getAccessToken();
      cb(token);
    },
    volume: 0.5
  });

  // Ready
  player.addListener('ready', ({ device_id }) => {
    console.log('Kids player ready with device ID:', device_id);
    deviceId = device_id;
    isPlayerReady = true;
    toast.push("Player ready! You can now play albums.");
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Kids player not ready with device ID:', device_id);
    isPlayerReady = false;
  });

  // Player state changed
  player.addListener('player_state_changed', (state) => {
    if (!state) {
      isPlaying = false;
      currentTrack = null;
      currentAlbumId = null;
      shuffleState = false;
      return;
    }
    
    isPlaying = !state.paused;
    currentTrack = state.track_window.current_track;
    shuffleState = state.shuffle;
    
    // Determine which album is currently playing
    if (currentTrack && currentTrack.album) {
      currentAlbumId = currentTrack.album.uri.split(':')[2]; // Extract album ID from URI
    }
    
    console.log('Player state changed:', { 
      isPlaying, 
      currentTrack: currentTrack?.name, 
      currentAlbumId, 
      shuffleState 
    });
  });

  // Connect to the player
  const success = await player.connect();
  if (!success) {
    console.error('Failed to connect to Spotify player');
    toast.push("Failed to connect to Spotify player");
  }
}

// Check current playback state including shuffle
async function checkPlaybackState() {
  try {
    const { getAccessToken } = await import("$lib/spotifyUtils/auth.js");
    const token = await getAccessToken();
    
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Current playback state:', {
        shuffle_state: data.shuffle_state,
        repeat_state: data.repeat_state,
        is_playing: data.is_playing,
        device: data.device?.name
      });
      return data;
    }
  } catch (error) {
    console.error("Error checking playback state:", error);
  }
  return null;
}

// Toggle shuffle state
async function toggleShuffle() {
  try {
    const { getAccessToken } = await import("$lib/spotifyUtils/auth.js");
    const token = await getAccessToken();
    
    const newShuffleState = !shuffleState;
    
    const response = await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${newShuffleState}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      shuffleState = newShuffleState;
      toast.push(`Shuffle ${newShuffleState ? 'enabled' : 'disabled'}`);
      console.log('Shuffle toggled to:', newShuffleState);
    } else {
      console.error("Failed to toggle shuffle:", response.status, await response.text());
      toast.push("Failed to toggle shuffle");
    }
  } catch (error) {
    console.error("Error toggling shuffle:", error);
    toast.push("Error controlling shuffle");
  }
}

// Toggle play/pause or start album playback
async function toggleAlbum(albumId) {
  try {
    if (!deviceId || !isPlayerReady) {
      toast.push("Player not ready. Please wait a moment and try again.");
      return;
    }

    // If this album is currently playing, toggle pause/play
    if (currentAlbumId === albumId && isPlaying) {
      await player.pause();
      toast.push("Paused");
      return;
    }
    
    // If this album is paused, resume it
    if (currentAlbumId === albumId && !isPlaying) {
      await player.resume();
      toast.push("Resumed playback");
      return;
    }

    // Otherwise, start playing the new album
    const { getAccessToken } = await import("$lib/spotifyUtils/auth.js");
    const token = await getAccessToken();

    // First, transfer playback to this device
    const transferResponse = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false
      })
    });

    if (!transferResponse.ok) {
      console.error("Transfer failed:", transferResponse.status, await transferResponse.text());
      toast.push("Failed to transfer playback to this device");
      return;
    }

    // Wait a moment for the transfer to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ensure shuffle is disabled for kids albums (play in order)
    if (shuffleState) {
      const shuffleResponse = await fetch("https://api.spotify.com/v1/me/player/shuffle?state=false", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (shuffleResponse.ok) {
        console.log("Shuffle disabled for kids album");
        toast.push("Playing album in order (shuffle disabled)");
      }
    }

    // Now play the album
    const playResponse = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        context_uri: `spotify:album:${albumId}`,
        device_id: deviceId
      })
    });

    if (playResponse.ok) {
      toast.push("Starting album playback!");
    } else {
      console.error("Play failed:", playResponse.status, await playResponse.text());
      toast.push("Failed to start playback. Make sure you have Spotify Premium.");
    }
  } catch (error) {
    console.error("Error toggling album:", error);
    toast.push("Error controlling playback");
  }
}

// Lade Cover beim Mount und initialisiere Player
onMount(async () => {
  if (browser) {
    covers = await Promise.all(albums.map(a => getAlbumCover(a.id)));
    await initializePlayer();
  }
});
</script>

<style>
.album-row {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-top: 4rem;
}
.album {
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: 2ch;
  box-shadow: 0 4px 24px #0008;
  overflow: hidden;
  background: #222;
  position: relative;
}
.album:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 32px #000a;
}
.album.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.album.playing {
  box-shadow: 0 4px 24px #1db954aa, 0 0 0 3px #1db954;
}
.album.paused {
  box-shadow: 0 4px 24px #ff9500aa, 0 0 0 3px #ff9500;
}
.album.disabled:hover {
  transform: none;
}
.album img {
  width: 320px;
  height: 320px;
  object-fit: cover;
  display: block;
}
.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}
.album:hover .play-overlay {
  opacity: 1;
}
.album.playing .play-overlay,
.album.paused .play-overlay {
  opacity: 1;
}
.status {
  text-align: center;
  margin: 2rem 0;
  padding: 1rem;
  border-radius: 1rem;
  background: #333;
  color: #fff;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.status.ready {
  background: #0a5d0a;
}
.status.loading {
  background: #5d5d0a;
}
.shuffle-control {
  text-align: center;
  margin: 1rem 0;
}
.shuffle-button {
  background: #333;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}
.shuffle-button:hover {
  background: #555;
}
.shuffle-button.active {
  background: #1db954;
}
.shuffle-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

<div class="status" class:ready={isPlayerReady} class:loading={!isPlayerReady}>
  {#if isPlayerReady}
    ✅ Player ready! Click on an album to start playing.
  {:else}
    ⏳ Setting up player... Please wait a moment.
  {/if}
</div>

{#if isPlayerReady && currentTrack}
  <div class="shuffle-control">
    <button 
      class="shuffle-button" 
      class:active={shuffleState}
      on:click={toggleShuffle}
      disabled={!isPlayerReady}
    >
      🔀 Shuffle: {shuffleState ? 'ON' : 'OFF'}
    </button>
    <div style="font-size: 0.9rem; color: #aaa; margin-top: 0.5rem;">
      Current: {currentTrack?.name || 'No track'} 
      {#if shuffleState}
        (Random order)
      {:else}
        (Album order)
      {/if}
    </div>
  </div>
{/if}

<div class="album-row">
  {#each albums as album, i}
    <div 
      class="album" 
      class:disabled={!isPlayerReady}
      class:playing={currentAlbumId === album.id && isPlaying}
      class:paused={currentAlbumId === album.id && !isPlaying && currentTrack}
      on:click={() => isPlayerReady && toggleAlbum(album.id)}
      on:keydown={(e) => e.key === 'Enter' && isPlayerReady && toggleAlbum(album.id)}
      role="button"
      tabindex="0"
    >
      {#if covers[i]}
        <img src={covers[i]} alt="Album Cover" />
      {:else}
        <div style="width:320px;height:320px;display:flex;align-items:center;justify-content:center;background:#444;color:#fff;">Lade...</div>
      {/if}
      
      <!-- Play/Pause overlay -->
      <div class="play-overlay">
        {#if currentAlbumId === album.id && isPlaying}
          ⏸️
        {:else if currentAlbumId === album.id && !isPlaying && currentTrack}
          ▶️
        {:else}
          ▶️
        {/if}
      </div>
    </div>
  {/each}
</div>

<SvelteToast />
