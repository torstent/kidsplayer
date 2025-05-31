<script>
// Albums loaded from Supabase
let albums = [];

// Holt das Albumcover von der Spotify API oder nutzt gespeicherte URL
async function getAlbumCover(albumId, album = null) {
  // If we have a stored image URL, use it
  if (album && album.imageUrl) {
    return album.imageUrl;
  }
  
  // Otherwise fetch from Spotify API
  const token = await import("$lib/spotifyUtils/auth.js").then(m => m.getAccessToken());
  const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Nimm das größte Bild
  return data.images[0]?.url;
}

let covers = [];

// Lade Cover beim Mount
import { onMount } from "svelte";
onMount(async () => {
  // Load albums from Supabase
  try {
    const { loadAlbums } = await import("$lib/albumUtils.js");
    albums = await loadAlbums();
    console.log('Loaded albums for test:', albums);
  } catch (error) {
    console.error('Failed to load albums:', error);
  }
  
  covers = await Promise.all(albums.map(a => getAlbumCover(a.id, a)));
});

// Starte Albumwiedergabe
async function playAlbum(albumId) {
  const token = await import("$lib/spotifyUtils/auth.js").then(m => m.getAccessToken());
  await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ context_uri: `spotify:album:${albumId}` })
  });
}
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
}
.album:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 32px #000a;
}
.album img {
  width: 320px;
  height: 320px;
  object-fit: cover;
  display: block;
}
</style>

<div class="album-row">
  {#each albums as album, i}
    <div class="album" on:click={() => playAlbum(album.id)}>
      {#if covers[i]}
        <img src={covers[i]} alt="Album Cover" />
      {:else}
        <div style="width:320px;height:320px;display:flex;align-items:center;justify-content:center;background:#444;color:#fff;">Lade...</div>
      {/if}
    </div>
  {/each}
</div>
