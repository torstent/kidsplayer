// Album utilities to integrate with Supabase
import { getAlbums } from './supabaseService.js';

/**
 * Fetch albums from Supabase, with fallback to hardcoded albums
 */
export async function loadAlbums() {
  try {
    const albums = await getAlbums();
    
    if (albums && albums.length > 0) {
      // Convert Supabase format to the format expected by the components
      return albums.map(album => ({
        id: album.id,
        title: album.title,
        imageUrl: album.image_url,
        url: `https://open.spotify.com/album/${album.id}`
      }));
    }
  } catch (error) {
    console.warn('Failed to load albums from Supabase, using fallback:', error);
  }
  
  // Fallback to hardcoded albums if Supabase fails
  return [
    {
      id: "1Sd7bF2ZKQW6H0yJRRLxnk",
      title: "Fallback Album 1",
      url: "https://open.spotify.com/intl-de/album/1Sd7bF2ZKQW6H0yJRRLxnk?si=TXFxuQpsTwSYGdj71uTHng",
      imageUrl: null
    },
    {
      id: "3gpbouGEBPdEmAuvZObheF", 
      title: "Fallback Album 2",
      url: "https://open.spotify.com/intl-de/album/3gpbouGEBPdEmAuvZObheF?si=SJuj8pLrRUWIEtxPcOJQ4Q",
      imageUrl: null
    }
  ];
}