<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { toast } from '@zerodevx/svelte-toast';
  import { testConnection, getAlbums, insertAlbum } from '$lib/supabaseService.js';

  let connectionStatus = 'Testing...';
  let albums = [];
  let isLoading = false;

  async function runConnectionTest() {
    if (!browser) return;
    
    isLoading = true;
    try {
      await testConnection();
      connectionStatus = '✅ Connection successful!';
      toast.push('Supabase connection successful');
      
      // Try to fetch albums
      albums = await getAlbums();
      console.log('Albums from database:', albums);
      
    } catch (error) {
      connectionStatus = `❌ Connection failed: ${error.message}`;
      toast.push(`Connection failed: ${error.message}`);
      console.error('Connection test failed:', error);
    } finally {
      isLoading = false;
    }
  }

  async function seedDatabase() {
    if (!browser) return;
    
    isLoading = true;
    try {
      // For now, let's manually seed with known data to avoid Spotify API dependency
      const albumsToInsert = [
        {
          id: "1Sd7bF2ZKQW6H0yJRRLxnk",
          title: "Album 1", // We'll update this with real titles later
          imageUrl: "https://i.scdn.co/image/placeholder"
        },
        {
          id: "3gpbouGEBPdEmAuvZObheF",
          title: "Album 2",
          imageUrl: "https://i.scdn.co/image/placeholder"
        }
      ];
      
      for (const album of albumsToInsert) {
        await insertAlbum(album);
        console.log(`Inserted album: ${album.title}`);
      }
      
      toast.push('Database seeded successfully!');
      // Refresh albums list
      albums = await getAlbums();
      
    } catch (error) {
      toast.push(`Seeding failed: ${error.message}`);
      console.error('Seeding failed:', error);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    if (browser) {
      runConnectionTest();
    }
  });
</script>

<h1>Supabase Connection Test</h1>

<div class="test-container">
  <h2>Connection Status</h2>
  <p class="status" class:loading={isLoading}>{connectionStatus}</p>
  
  <div class="actions">
    <button on:click={runConnectionTest} disabled={isLoading}>
      Test Connection
    </button>
    
    <button on:click={seedDatabase} disabled={isLoading}>
      Seed Database
    </button>
  </div>
  
  <h2>Albums in Database</h2>
  {#if albums.length > 0}
    <div class="albums">
      {#each albums as album}
        <div class="album-card">
          <h3>{album.title}</h3>
          <p>ID: {album.id}</p>
          {#if album.image_url}
            <img src={album.image_url} alt={album.title} />
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p>No albums found in database.</p>
  {/if}
</div>

<style>
  .test-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
  }
  
  .status {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 1rem 0;
  }
  
  .status.loading {
    opacity: 0.7;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background: #1DB954;
    color: white;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  button:hover:not(:disabled) {
    background: #1ed760;
  }
  
  .albums {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .album-card {
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    padding: 1rem;
    background: #f9f9f9;
  }
  
  .album-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    margin-top: 0.5rem;
    border-radius: 0.25rem;
  }
  
  .album-card h3 {
    margin: 0 0 0.5rem 0;
  }
  
  .album-card p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: #666;
  }
</style>