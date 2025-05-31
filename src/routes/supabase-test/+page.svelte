<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { toast } from '@zerodevx/svelte-toast';
  import { testConnection, getAlbums, insertAlbum } from '$lib/supabaseService.js';

  let connectionStatus = 'Testing...';
  let albums = [];
  let isLoading = false;
  let newAlbumId = '';
  let isAddingAlbum = false;

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
      console.log('🔄 Starting Supabase album seeding...');
      
      // Check if we have a token  
      const { getAccessToken } = await import("$lib/spotifyUtils/auth.js");
      const token = await getAccessToken();
      
      if (!token) {
        toast.push('Please login to Spotify first');
        return;
      }
      
      const albumIds = [
        "1Sd7bF2ZKQW6H0yJRRLxnk",
        "3gpbouGEBPdEmAuvZObheF"
      ];
      
      console.log('📀 Fetching album details from Spotify...');
      const albumsToInsert = [];
      
      for (const albumId of albumIds) {
        try {
          const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const albumData = await response.json();
            const album = {
              id: albumId,
              title: albumData.name,
              imageUrl: albumData.images[0]?.url
            };
            albumsToInsert.push(album);
            console.log(`✅ Fetched: ${album.title}`);
          } else {
            console.error(`❌ Failed to fetch album ${albumId}:`, response.status);
          }
        } catch (error) {
          console.error(`❌ Error fetching album ${albumId}:`, error);
        }
      }
      
      if (albumsToInsert.length === 0) {
        toast.push('Failed to fetch album data from Spotify');
        return;
      }
      
      console.log('💾 Inserting albums into Supabase...');
      
      for (const album of albumsToInsert) {
        try {
          await insertAlbum(album);
          console.log(`✅ Inserted: ${album.title}`);
        } catch (error) {
          console.warn(`⚠️  Could not insert ${album.title}:`, error.message);
        }
      }
      
      toast.push('Database seeded successfully!');
      albums = await getAlbums();
      
    } catch (error) {
      toast.push(`Seeding failed: ${error.message}`);
      console.error('Seeding failed:', error);
    } finally {
      isLoading = false;
    }
  }

  async function addNewAlbum() {
    if (!browser || !newAlbumId.trim()) return;
    
    isAddingAlbum = true;
    try {
      console.log('🔄 Adding new album...');
      
      // Check if we have a token  
      const { getAccessToken } = await import("$lib/spotifyUtils/auth.js");
      const token = await getAccessToken();
      
      if (!token) {
        toast.push('Please login to Spotify first');
        return;
      }
      
      const albumId = newAlbumId.trim();
      console.log(`📀 Fetching album details for ${albumId}...`);
      
      const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.push('Album not found. Please check the album ID.');
        } else {
          toast.push(`Failed to fetch album: ${response.status}`);
        }
        return;
      }
      
      const albumData = await response.json();
      const album = {
        id: albumId,
        title: albumData.name,
        imageUrl: albumData.images[0]?.url
      };
      
      console.log(`✅ Fetched: ${album.title}`);
      console.log('💾 Inserting album into Supabase...');
      
      await insertAlbum(album);
      console.log(`✅ Inserted: ${album.title}`);
      
      toast.push(`Album "${album.title}" added successfully!`);
      albums = await getAlbums();
      newAlbumId = ''; // Clear the input
      
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        toast.push('Album already exists in database');
      } else {
        toast.push(`Failed to add album: ${error.message}`);
      }
      console.error('Error adding album:', error);
    } finally {
      isAddingAlbum = false;
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
      Seed Database (Default Albums)
    </button>
  </div>
  
  <h2>Add New Album</h2>
  <div class="add-album-form">
    <p class="help-text">
      Enter a Spotify album ID to add it to the database. 
      <br>You can find the album ID in the Spotify URL (e.g., spotify:album:<strong>1Sd7bF2ZKQW6H0yJRRLxnk</strong>).
    </p>
    <div class="form-row">
      <input 
        type="text" 
        bind:value={newAlbumId} 
        placeholder="Enter Spotify album ID (e.g., 1Sd7bF2ZKQW6H0yJRRLxnk)"
        disabled={isAddingAlbum}
      />
      <button on:click={addNewAlbum} disabled={isAddingAlbum || !newAlbumId.trim()}>
        {isAddingAlbum ? 'Adding...' : 'Add Album'}
      </button>
    </div>
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
  
  .add-album-form {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin: 2rem 0;
  }
  
  .help-text {
    margin-bottom: 1rem;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .form-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    font-size: 1rem;
  }
  
  input:focus {
    outline: none;
    border-color: #1DB954;
  }
  
  input:disabled {
    opacity: 0.7;
    background: #f9f9f9;
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