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
 * Save user tokens to Supabase
 */
export async function saveUserTokens(spotifyUserId, accessToken, refreshToken, expiresIn) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    console.log('Saving user tokens to Supabase for user:', spotifyUserId);
    
    const tokenData = {
      spotify_user_id: spotifyUserId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_generated_at: new Date().toISOString()
    };
    
    // Use upsert to handle both insert and update cases
    const { data, error } = await supabase
      .from('users')
      .upsert(tokenData, { 
        onConflict: 'spotify_user_id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error('Supabase token save error:', error);
      throw error;
    }
    
    console.log('Successfully saved user tokens:', data);
    return data[0];
  } catch (error) {
    console.error('Error saving user tokens:', error);
    throw error;
  }
}

/**
 * Get user tokens from Supabase
 */
export async function getUserTokens(spotifyUserId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    console.log('Fetching user tokens from Supabase for user:', spotifyUserId);
    
    const { data, error } = await supabase
      .from('users')
      .select('access_token, refresh_token, expires_in, token_generated_at')
      .eq('spotify_user_id', spotifyUserId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('No tokens found for user:', spotifyUserId);
        return null;
      }
      console.error('Supabase token fetch error:', error);
      throw error;
    }
    
    console.log('Successfully fetched user tokens');
    return data;
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    throw error;
  }
}

/**
 * Delete user tokens from Supabase
 */
export async function deleteUserTokens(spotifyUserId) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    console.log('Deleting user tokens from Supabase for user:', spotifyUserId);
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('spotify_user_id', spotifyUserId);
    
    if (error) {
      console.error('Supabase token delete error:', error);
      throw error;
    }
    
    console.log('Successfully deleted user tokens');
    return true;
  } catch (error) {
    console.error('Error deleting user tokens:', error);
    throw error;
  }
}

/**
 * Get all users from Supabase (for admin purposes)
 */
export async function getAllUsers() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, spotify_user_id, created_at, updated_at, token_generated_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase users fetch error:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Check if tokens are expired
 */
export function areTokensExpired(tokenGeneratedAt, expiresIn) {
  const now = new Date().getTime();
  const tokenTime = new Date(tokenGeneratedAt).getTime();
  const expirationTime = tokenTime + (expiresIn * 1000);
  
  return now >= expirationTime;
}