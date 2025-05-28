import { toast } from "@zerodevx/svelte-toast";
import { browser } from "$app/environment";

export async function getAccessToken(clientId) {
    if (!browser) return false;
    
    if(localStorage.getItem('accessToken') == undefined || localStorage.getItem('refreshToken') == undefined) {
        return false
    }
    let expiryTime = localStorage.getItem('expiryTime')
    let tokenGenerationTime = localStorage.getItem('tokenGenerationTime')
    let currentTime = Date.now()
    if ((currentTime - tokenGenerationTime) > expiryTime * 1000) {
        console.log("Token expired, refreshing...");
        let body = new URLSearchParams()
        body.append("grant_type", "refresh_token")
        body.append("refresh_token", localStorage.getItem('refreshToken'))
        body.append("client_id", "8f9b61a91f38474d80dbf57d9d857408") //TODO: hardcoded client id

        try {
            const response = await fetch(`https://accounts.spotify.com/api/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body
            });
            
            if (!response.ok) {
                toast.push('Error refreshing token');
                return false;
            }
            
            const data = await response.json();
            localStorage.setItem('expiryTime', data.expires_in)
            localStorage.setItem("tokenGenerationTime", Date.now())
            localStorage.setItem('accessToken', data.access_token);
            if (data.refresh_token) {
                localStorage.setItem('refreshToken', data.refresh_token);
            }
            toast.push("Regenerated access token")
            return localStorage.getItem('accessToken');
        } catch (error) {
            console.error("Error refreshing token:", error);
            toast.push('Error refreshing token');
            return false;
        }
    }
    return localStorage.getItem('accessToken')
    
}

export async function redirectToAuthCodeFlow(clientId) {
    if (!browser) return;
    
    const verifier = generateCodeVerifier(128)
    const challenge = await generateCodeChallenge(verifier)

    localStorage.setItem("verifier", verifier)

    const redirectUri = "http://localhost:5173/test/" // Use registered redirect URI
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

    const redirectUri = "http://localhost:5173/test/" // Must match the one used in redirectToAuthCodeFlow
    const params = new URLSearchParams()
    params.append("client_id", clientId)
    params.append("grant_type", "authorization_code")
    params.append("code", code)
    params.append("redirect_uri", redirectUri)
    params.append("code_verifier", verifier)

    console.log("Token exchange redirect URI:", redirectUri)

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    }).then(response => {
        if (!response.ok) {
            toast.push('HTTP status ' + response.status);
            // throw new Error('HTTP status ' + response.status);
        }
        return response.json();
    })
        .then(data => {
            localStorage.setItem('expiryTime', data.expires_in)
            localStorage.setItem("tokenGenerationTime", Date.now())
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            toast.push('Logged in!')
            return true
            // toast.push('Access token set')
        })
        .catch(error => {
            toast.push('Error:', error);
        });

}

export function logOut() {
    if (!browser) return;
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('expiryTime')
    localStorage.removeItem('tokenGenerationTime')
    localStorage.removeItem('verifier')
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

