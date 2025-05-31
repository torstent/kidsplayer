// Script to seed Supabase database with album data
// This needs to be run in the browser environment to access localStorage tokens

// Function to be executed in browser console after authentication
async function seedSupabaseAlbums() {
  try {
    console.log('🔄 Starting Supabase album seeding...');
    
    // Check if we have a token
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('❌ No Spotify access token found. Please login first.');
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
      console.error('❌ No albums to insert');
      return;
    }
    
    console.log('💾 Inserting albums into Supabase...');
    
    // Import and use the Supabase service
    const { insertAlbum, getAlbums } = await import('./src/lib/supabaseService.js');
    
    for (const album of albumsToInsert) {
      try {
        await insertAlbum(album);
        console.log(`✅ Inserted: ${album.title}`);
      } catch (error) {
        console.warn(`⚠️  Could not insert ${album.title}:`, error.message);
      }
    }
    
    console.log('📋 Current albums in database:');
    const existingAlbums = await getAlbums();
    console.table(existingAlbums);
    
    console.log('🎉 Seeding complete!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Export the function to be used
console.log('🌱 Album seeding script loaded!');
console.log('Run seedSupabaseAlbums() after logging in to Spotify');

// Auto-execute in browser environment if this script is loaded directly
if (typeof window !== 'undefined' && window.localStorage) {
  // Make function available globally
  window.seedSupabaseAlbums = seedSupabaseAlbums;
}