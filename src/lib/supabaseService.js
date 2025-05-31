import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Initialize Supabase client
let supabase = null;

if (browser) {
  const supabaseUrl = 'https://lqoznmkucwlsnyzhynia.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxb3pubWt1Y3dsc255emh5bmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MDcwOTQsImV4cCI6MjA2NDI4MzA5NH0.3DJRLF4tdnYpm4PdJXX9V-pe9jbRfCxbOMO5mDng0h8';
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Test database connection
 */
export async function testConnection() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { data, error } = await supabase.from('albums').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    throw error;
  }
}

/**
 * Get all albums from the database
 */
export async function getAlbums() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('id, title, image_url')
      .order('id');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching albums:', error);
    throw error;
  }
}

/**
 * Insert a new album
 */
export async function insertAlbum(album) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { data, error } = await supabase
      .from('albums')
      .insert({
        id: album.id,
        title: album.title,
        image_url: album.imageUrl
      })
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error inserting album:', error);
    throw error;
  }
}

/**
 * Update an existing album
 */
export async function updateAlbum(id, updates) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { data, error } = await supabase
      .from('albums')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error('Error updating album:', error);
    throw error;
  }
}

/**
 * Delete an album
 */
export async function deleteAlbum(id) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting album:', error);
    throw error;
  }
}