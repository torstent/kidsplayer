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
      
      // Fetch albums to show as part of the test result
      albums = await getAlbums();
      console.log('Albums from database:', albums);
      
      // Show connection success with album count and details
      if (albums.length === 0) {
        connectionStatus = '✅ Connection successful!\n\nSELECT * FROM albums:\nNo albums found in database.';
      } else {
        const albumList = albums.map(album => 
          `• ${album.title} (ID: ${album.id})`
        ).join('\n');
        connectionStatus = `✅ Connection successful!\n\nSELECT * FROM albums:\nFound ${albums.length} album(s):\n${albumList}`;
      }
      
      toast.push('Supabase connection successful');
      
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
    let successCount = 0;
    let errorCount = 0;
    
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
          console.log(`Fetching album ${albumId}...`);
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
            console.log(`✅ Fetched: ${album.title} (${album.id})`);
          } else {
            console.error(`❌ Failed to fetch album ${albumId}:`, response.status, response.statusText);
            errorCount++;
          }
        } catch (error) {
          console.error(`❌ Error fetching album ${albumId}:`, error);
          errorCount++;
        }
      }
      
      if (albumsToInsert.length === 0) {
        toast.push('Failed to fetch album data from Spotify');
        return;
      }
      
      console.log(`💾 Inserting ${albumsToInsert.length} albums into Supabase...`);
      
      for (const album of albumsToInsert) {
        try {
          console.log(`Inserting album: ${album.title} (${album.id})`);
          const result = await insertAlbum(album);
          console.log(`✅ Inserted: ${album.title}`, result);
          successCount++;
        } catch (error) {
          console.error(`❌ Could not insert ${album.title}:`, error);
          if (error.message.includes('duplicate key')) {
            console.log(`Album ${album.title} already exists in database`);
            successCount++; // Count as success since album is already there
          } else {
            errorCount++;
          }
        }
      }
      
      // Refresh albums list
      console.log('🔄 Refreshing albums list...');
      albums = await getAlbums();
      console.log(`Found ${albums.length} albums in database after seeding:`, albums);
      
      // Update connection status to reflect current state
      if (albums.length === 0) {
        connectionStatus = '✅ Connection successful!\n\nSELECT * FROM albums:\nNo albums found in database.';
      } else {
        const albumList = albums.map(album => 
          `• ${album.title} (ID: ${album.id})`
        ).join('\n');
        connectionStatus = `✅ Connection successful!\n\nSELECT * FROM albums:\nFound ${albums.length} album(s):\n${albumList}`;
      }
      
      if (successCount > 0) {
        toast.push(`Database seeded! ${successCount} albums processed, ${albums.length} total in database`);
      } else {
        toast.push(`Seeding completed with errors. ${errorCount} failures.`);
      }
      
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
      
      console.log(`✅ Fetched: ${album.title} (${album.id})`);
      console.log('💾 Inserting album into Supabase...');
      
      const result = await insertAlbum(album);
      console.log(`✅ Inserted: ${album.title}`, result);
      
      toast.push(`Album "${album.title}" added successfully!`);
      
      // Refresh albums list and connection status
      albums = await getAlbums();
      console.log(`Found ${albums.length} albums in database after adding:`, albums);
      
      // Update connection status to reflect current state
      if (albums.length === 0) {
        connectionStatus = '✅ Connection successful!\n\nSELECT * FROM albums:\nNo albums found in database.';
      } else {
        const albumList = albums.map(album => 
          `• ${album.title} (ID: ${album.id})`
        ).join('\n');
        connectionStatus = `✅ Connection successful!\n\nSELECT * FROM albums:\nFound ${albums.length} album(s):\n${albumList}`;
      }
      
      newAlbumId = ''; // Clear the input
      
    } catch (error) {
      if (error.message.includes('duplicate key')) {
        toast.push('Album already exists in database');
        // Still refresh to show current state
        albums = await getAlbums();
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
    white-space: pre-line;
    font-family: monospace;
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid #ddd;
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