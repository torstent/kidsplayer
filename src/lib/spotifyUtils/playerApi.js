import { toast } from "@zerodevx/svelte-toast"
import { SpotifyAuth } from '$lib/spotifyUtils'

export async function setRepeat(option, device_id) {
    const accessToken = await SpotifyAuth.getAccessToken();
    await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${option}&device_id=${device_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${accessToken}` }
      }).then(() => {
        return true
      })
}

//https://open.spotify.com/intl-de/album/0QVzh4hji8pcUFT7FWBlGf?si=AlK0NDRpQRiLZyeTTLBUkw

export async function setShuffle(option, device_id) {
  const accessToken = await SpotifyAuth.getAccessToken();
  await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${option}&device_id=${device_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Bearer ${accessToken}` }
  }).then(() => {
    return true
  })
}

// Toggle play/pause state
export async function togglePlayPause(player, isPlaying) {
  try {
    if (!player) {
      toast.push("Player not ready. Please wait a moment and try again.");
      return;
    }

    if (isPlaying) {
      await player.pause();
      toast.push("Paused");
    } else {
      await player.resume();
      toast.push("Resumed playback");
    }
  } catch (error) {
    console.error("Error toggling play/pause:", error);
    toast.push("Error controlling playback");
  }
}

// Skip backward 30 seconds
export async function skipBackward(player) {
  try {
    if (!player) {
      toast.push("Player not ready or no track playing");
      return;
    }

    const accessToken = await SpotifyAuth.getAccessToken();
    
    // Get current playback state to find position
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Calculate new position (30 seconds back, minimum 0)
      const newPosition = Math.max(0, data.progress_ms - 30000);
      
      // Seek to new position
      const seekResponse = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${newPosition}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (seekResponse.ok) {
        toast.push("Skipped backward 30 seconds");
      } else {
        console.error("Seek failed:", seekResponse.status, await seekResponse.text());
        toast.push("Failed to seek backward");
      }
    } else {
      toast.push("Could not get current playback state");
    }
  } catch (error) {
    console.error("Error skipping backward:", error);
    toast.push("Error controlling playback");
  }
}

// Skip forward 30 seconds
export async function skipForward(player) {
  try {
    if (!player) {
      toast.push("Player not ready or no track playing");
      return;
    }

    const accessToken = await SpotifyAuth.getAccessToken();
    
    // Get current playback state to find position
    const response = await fetch("https://api.spotify.com/v1/me/player", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Calculate new position (30 seconds forward)
      const newPosition = data.progress_ms + 30000;
      
      // Seek to new position
      const seekResponse = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${newPosition}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (seekResponse.ok) {
        toast.push("Skipped forward 30 seconds");
      } else {
        console.error("Seek failed:", seekResponse.status, await seekResponse.text());
        toast.push("Failed to seek forward");
      }
    } else {
      toast.push("Could not get current playback state");
    }
  } catch (error) {
    console.error("Error skipping forward:", error);
    toast.push("Error controlling playback");
  }
}

// Load album tracks
export async function loadAlbumTracks(albumId) {
  try {
    const accessToken = await SpotifyAuth.getAccessToken();
    
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.items;
    } else {
      console.error("Failed to load album tracks:", response.status, await response.text());
      toast.push("Failed to load album tracks");
      return [];
    }
  } catch (error) {
    console.error("Error loading album tracks:", error);
    toast.push("Error loading album tracks");
    return [];
  }
}

export async function startPawPatrol() {
    const accessToken = await SpotifyAuth.getAccessToken();
    await fetch(`https://api.spotify.com/v1/me/player/play`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json" // Specify the content type as JSON
        },
        body: JSON.stringify({
            "context_uri": "spotify:album:0QVzh4hji8pcUFT7FWBlGf",
            "offset": {
                "position": 3
            },
        })
    }).then(() => {
        return true;
    });
}

export async function getQueue() {
  try {
    const accessToken = await SpotifyAuth.getAccessToken();
    if (!accessToken) {
      console.error("No access token available for getQueue");
      return null;
    }

    const response = await fetch(`https://api.spotify.com/v1/me/player/queue`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` } 
    });

    if (!response.ok) {
      console.error("Couldn't get queue from api!", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.queue; // thank you chatgpt after like 30 minutes it works
  } catch (error) {
    console.error("Error getting queue:", error);
    return null;
  }
}

export async function handoff(device_id) {
  try {
    const accessToken = await SpotifyAuth.getAccessToken();
    if (!accessToken) {
      toast.push("No access token available for device handoff");
      return false;
    }

    const response = await fetch("https://api.spotify.com/v1/me/player", {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${accessToken}` 
      },
      body: JSON.stringify({ 
        device_ids: [device_id], 
        play: false 
      })
    });

    if (response.status === 200 || response.status === 202 || response.status === 204) {
      toast.push("Successfully transferred playback to cleanplayer");
      return true;
    } else {
      console.error("Device handoff failed:", response.status, await response.text());
      toast.push("Device handoff might not have succeeded. You might have to do it from another client by using Spotify connect and choosing this device");
      return false;
    }
  } catch (error) {
    console.error("Error during device handoff:", error);
    toast.push("Error during device handoff");
    return false;
  }
}