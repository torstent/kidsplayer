import { toast } from "@zerodevx/svelte-toast";
import { browser } from "$app/environment";
import { saveUserTokens, getUserTokens, deleteUserTokens, areTokensExpired } from "$lib/supabaseAuth.js";

// Current user cache to avoid multiple API calls
let currentSpotifyUserId = null;

/**
 * Get current Spotify user ID
 */
async function getCurrentSpotifyUserId(accessToken) {
    if (currentSpotifyUserId) {
        return currentSpotifyUserId;
    }
    
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (response.ok) {
            const userData = await response.json();
            currentSpotifyUserId = userData.id;
            return currentSpotifyUserId;
        }
    } catch (error) {
        console.error('Error fetching current user:', error);
    }
    
    return null;
}

export async function getAccessToken(clientId) {
    if (!browser) return false;
    
    // First, try to get tokens from localStorage as fallback/bridge
    let spotifyUserId = null;
    let accessToken = null;
    let refreshToken = null;
    let expiryTime = null;
    let tokenGenerationTime = null;
    
    // Check localStorage first for backward compatibility
    const localAccessToken = localStorage.getItem('accessToken');
    const localRefreshToken = localStorage.getItem('refreshToken');
    
    if (localAccessToken && localRefreshToken) {
        // We have localStorage tokens, let's migrate them to Supabase
        console.log("Found localStorage tokens, attempting to migrate to Supabase...");
        
        try {
            // Get user ID from Spotify
            spotifyUserId = await getCurrentSpotifyUserId(localAccessToken);
            
            if (spotifyUserId) {
                // Save to Supabase
                await saveUserTokens(
                    spotifyUserId,
                    localAccessToken,
                    localRefreshToken,
                    parseInt(localStorage.getItem('expiryTime') || '3600')
                );
                
                console.log("Successfully migrated tokens to Supabase");
                toast.push("Migrated authentication to database");
                
                // Clear localStorage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('expiryTime');
                localStorage.removeItem('tokenGenerationTime');
            }
        } catch (error) {
            console.error("Error migrating tokens to Supabase:", error);
            // Fall back to localStorage if migration fails
            accessToken = localAccessToken;
            refreshToken = localRefreshToken;
            expiryTime = localStorage.getItem('expiryTime');
            tokenGenerationTime = localStorage.getItem('tokenGenerationTime');
        }
    }
    
    // If we didn't get tokens from migration, try to get from Supabase
    if (!accessToken || !refreshToken) {
        // We need a user ID to fetch from Supabase
        // Try to get it from a temporary access token or ask user to log in again
        if (!spotifyUserId) {
            console.log("No user ID available, user needs to log in");
            return false;
        }
        
        try {
            const tokenData = await getUserTokens(spotifyUserId);
            if (!tokenData) {
                console.log("No tokens found in Supabase for user:", spotifyUserId);
                return false;
            }
            
            accessToken = tokenData.access_token;
            refreshToken = tokenData.refresh_token;
            expiryTime = tokenData.expires_in;
            tokenGenerationTime = tokenData.token_generated_at;
            
        } catch (error) {
            console.error("Error fetching tokens from Supabase:", error);
            return false;
        }
    }
    
    if (!accessToken || !refreshToken) {
        console.log("No tokens available");
        return false;
    }
    
    // Check if token is expired
    const isExpired = tokenGenerationTime ? 
        areTokensExpired(tokenGenerationTime, expiryTime) :
        (Date.now() - parseInt(tokenGenerationTime || '0')) > parseInt(expiryTime || '3600') * 1000;
    
    if (isExpired) {
        console.log("Token expired, refreshing...");
        
        try {
            const newTokens = await refreshAccessToken(refreshToken, spotifyUserId);
            if (newTokens) {
                return newTokens.access_token;
            } else {
                return false;
            }
        } catch (error) {
            console.error("Error refreshing token:", error);
            toast.push('Error refreshing token');
            return false;
        }
    }
    
    return accessToken;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken, spotifyUserId) {
    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("refresh_token", refreshToken);
    body.append("client_id", "8f9b61a91f38474d80dbf57d9d857408"); //TODO: hardcoded client id

    try {
        const response = await fetch(`https://accounts.spotify.com/api/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body
        });
        
        if (!response.ok) {
            toast.push('Error refreshing token');
            return null;
        }
        
        const data = await response.json();
        
        // Save new tokens to Supabase
        const newRefreshToken = data.refresh_token || refreshToken; // Spotify might not always return a new refresh token
        
        await saveUserTokens(
            spotifyUserId,
            data.access_token,
            newRefreshToken,
            data.expires_in
        );
        
        toast.push("Regenerated access token");
        return {
            access_token: data.access_token,
            refresh_token: newRefreshToken,
            expires_in: data.expires_in
        };
        
    } catch (error) {
        console.error("Error refreshing token:", error);
        throw error;
    }
}

export async function redirectToAuthCodeFlow(clientId) {
    if (!browser) return;
    
    const verifier = generateCodeVerifier(128)
    const challenge = await generateCodeChallenge(verifier)

    localStorage.setItem("verifier", verifier)

    const redirectUri = "https://super-dolphin-12f64d.netlify.app/" // Use registered redirect URI
    const params = new URLSearchParams()
    params.append("client_id", clientId)
    params.append("response_type", "code")
    params.append("redirect_uri", redirectUri)
    params.append("scope", "user-read-playback-state user-modify-playback-state user-read-currently-playing streaming playlist-read-private playlist-read-collaborative user-library-modify user-library-read user-follow-read user-read-private user-read-email")
    params.append("code_challenge_method", "S256")
    params.append("code_challenge", challenge)
    
    console.log("Redirect URI:", redirectUri)
    console.log(`https://accounts.spotify.com/authorize?${params.toString()}`)
    if (typeof window !== 'undefined') {
        document.location = `https://accounts.spotify.com/authorize?${params.toString()}`
    }
}

export async function newAccessToken(clientId, code) {
    if (!browser) return;
    
    const verifier = localStorage.getItem("verifier")

    const redirectUri = "https://super-dolphin-12f64d.netlify.app/" // Must match the one used in redirectToAuthCodeFlow
    const params = new URLSearchParams()
    params.append("client_id", clientId)
    params.append("grant_type", "authorization_code")
    params.append("code", code)
    params.append("redirect_uri", redirectUri)
    params.append("code_verifier", verifier)

    console.log("Token exchange redirect URI:", redirectUri)

    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        });
        
        if (!response.ok) {
            toast.push('HTTP status ' + response.status);
            return false;
        }
        
        const data = await response.json();
        
        // Get user ID from Spotify
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${data.access_token}` }
        });
        
        if (!userResponse.ok) {
            toast.push('Error fetching user info');
            return false;
        }
        
        const userData = await userResponse.json();
        const spotifyUserId = userData.id;
        
        // Save tokens to Supabase
        await saveUserTokens(
            spotifyUserId,
            data.access_token,
            data.refresh_token,
            data.expires_in
        );
        
        // Cache user ID
        currentSpotifyUserId = spotifyUserId;
        
        // Clear verifier
        localStorage.removeItem("verifier");
        
        toast.push('Logged in!')
        return true;
        
    } catch (error) {
        console.error('Error during token exchange:', error);
        toast.push('Error: ' + error.message);
        return false;
    }
}

export function logOut() {
    if (!browser) return;
    
    // Clear cached user ID
    currentSpotifyUserId = null;
    
    // Clear localStorage tokens (for migration compatibility)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('expiryTime')
    localStorage.removeItem('tokenGenerationTime')
    localStorage.removeItem('verifier')
    
    // Note: We don't delete from Supabase here as the user might want to log back in
    // If they want to completely remove their data, they should use the user management page
    
    toast.push('Logged out!')
    setTimeout(() => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    }, 1000);
}

function generateCodeVerifier(length) {
    let text = ""
    let possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

async function generateCodeChallenge(codeVerifier) {
    if (!browser || typeof window === 'undefined') return '';
    
    const data = new TextEncoder().encode(codeVerifier)
    const digest = await window.crypto.subtle.digest("SHA-256", data)
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

