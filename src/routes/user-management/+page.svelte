<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { toast } from '@zerodevx/svelte-toast';
  import { getAllUsers, saveUserTokens, deleteUserTokens, areTokensExpired } from '$lib/supabaseAuth.js';

  let users = [];
  let isLoading = false;
  let newUserId = '';
  let newAccessToken = '';
  let newRefreshToken = '';
  let newExpiresIn = 3600;
  let isAddingUser = false;

  async function loadUsers() {
    if (!browser) return;
    
    isLoading = true;
    try {
      users = await getAllUsers();
      console.log('Loaded users:', users);
      toast.push(`Loaded ${users.length} users`);
    } catch (error) {
      toast.push(`Failed to load users: ${error.message}`);
      console.error('Error loading users:', error);
    } finally {
      isLoading = false;
    }
  }

  async function addNewUser() {
    if (!browser || !newUserId.trim() || !newAccessToken.trim() || !newRefreshToken.trim()) return;
    
    isAddingUser = true;
    try {
      console.log('Adding new user...');
      
      await saveUserTokens(
        newUserId.trim(),
        newAccessToken.trim(),
        newRefreshToken.trim(),
        parseInt(newExpiresIn)
      );
      
      toast.push(`User "${newUserId}" added successfully!`);
      
      // Clear form
      newUserId = '';
      newAccessToken = '';
      newRefreshToken = '';
      newExpiresIn = 3600;
      
      // Reload users
      await loadUsers();
      
    } catch (error) {
      toast.push(`Failed to add user: ${error.message}`);
      console.error('Error adding user:', error);
    } finally {
      isAddingUser = false;
    }
  }

  async function deleteUser(spotifyUserId) {
    if (!confirm(`Are you sure you want to delete user "${spotifyUserId}"?`)) {
      return;
    }
    
    try {
      await deleteUserTokens(spotifyUserId);
      toast.push(`User "${spotifyUserId}" deleted successfully!`);
      await loadUsers();
    } catch (error) {
      toast.push(`Failed to delete user: ${error.message}`);
      console.error('Error deleting user:', error);
    }
  }

  async function getCurrentUserFromSpotify() {
    try {
      // Try to get current user from Spotify to populate form
      const { getAccessToken } = await import("$lib/spotifyUtils/auth.js");
      const token = await getAccessToken();
      
      if (!token) {
        toast.push('Please login to Spotify first');
        return;
      }
      
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        newUserId = userData.id;
        newAccessToken = token;
        
        // Try to get refresh token from localStorage (temporary bridge)
        if (browser && localStorage.getItem('refreshToken')) {
          newRefreshToken = localStorage.getItem('refreshToken');
          const expiryTime = localStorage.getItem('expiryTime');
          if (expiryTime) {
            newExpiresIn = parseInt(expiryTime);
          }
        }
        
        toast.push(`Populated form with current user: ${userData.display_name || userData.id}`);
      } else {
        toast.push('Failed to fetch current user from Spotify');
      }
      
    } catch (error) {
      toast.push(`Error fetching current user: ${error.message}`);
      console.error('Error fetching current user:', error);
    }
  }

  onMount(() => {
    if (browser) {
      loadUsers();
    }
  });
</script>

<h1>User Management</h1>

<div class="user-management-container">
  
  <div class="actions">
    <button on:click={loadUsers} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Refresh Users'}
    </button>
  </div>

  <h2>Add New User</h2>
  <div class="add-user-form">
    <p class="help-text">
      Add a new user with their Spotify authentication tokens. 
      Use the "Get Current User" button to populate from currently logged-in Spotify user.
    </p>
    
    <button on:click={getCurrentUserFromSpotify} class="secondary">
      Get Current User from Spotify
    </button>
    
    <div class="form-fields">
      <div class="form-row">
        <label for="userId">Spotify User ID:</label>
        <input 
          id="userId"
          type="text" 
          bind:value={newUserId} 
          placeholder="Enter Spotify user ID"
          disabled={isAddingUser}
        />
      </div>
      
      <div class="form-row">
        <label for="accessToken">Access Token:</label>
        <textarea 
          id="accessToken"
          bind:value={newAccessToken} 
          placeholder="Enter access token"
          disabled={isAddingUser}
          rows="3"
        ></textarea>
      </div>
      
      <div class="form-row">
        <label for="refreshToken">Refresh Token:</label>
        <textarea 
          id="refreshToken"
          bind:value={newRefreshToken} 
          placeholder="Enter refresh token"
          disabled={isAddingUser}
          rows="3"
        ></textarea>
      </div>
      
      <div class="form-row">
        <label for="expiresIn">Expires In (seconds):</label>
        <input 
          id="expiresIn"
          type="number" 
          bind:value={newExpiresIn} 
          placeholder="3600"
          disabled={isAddingUser}
          min="1"
        />
      </div>
      
      <button 
        on:click={addNewUser} 
        disabled={isAddingUser || !newUserId.trim() || !newAccessToken.trim() || !newRefreshToken.trim()}
        class="add-button"
      >
        {isAddingUser ? 'Adding...' : 'Add User'}
      </button>
    </div>
  </div>
  
  <h2>Users in Database</h2>
  {#if users.length > 0}
    <div class="users">
      {#each users as user}
        <div class="user-card">
          <h3>{user.spotify_user_id}</h3>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
          <p><strong>Updated:</strong> {new Date(user.updated_at).toLocaleString()}</p>
          <p><strong>Token Generated:</strong> {new Date(user.token_generated_at).toLocaleString()}</p>
          
          <button 
            on:click={() => deleteUser(user.spotify_user_id)}
            class="delete-button"
          >
            Delete User
          </button>
        </div>
      {/each}
    </div>
  {:else}
    <p>No users found in database.</p>
  {/if}
</div>

<style>
  .user-management-container {
    max-width: 1000px;
    margin: 2rem auto;
    padding: 2rem;
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
  
  button.secondary {
    background: #666;
    margin-bottom: 1rem;
  }
  
  button.add-button {
    background: #1DB954;
    margin-top: 1rem;
  }
  
  button.delete-button {
    background: #e22134;
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }
  
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  button:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  
  .add-user-form {
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
  
  .form-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .form-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  label {
    font-weight: bold;
    color: #333;
  }
  
  input, textarea {
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    font-size: 1rem;
    font-family: inherit;
  }
  
  input:focus, textarea:focus {
    outline: none;
    border-color: #1DB954;
  }
  
  input:disabled, textarea:disabled {
    opacity: 0.7;
    background: #f9f9f9;
  }
  
  .users {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .user-card {
    border: 1px solid #ccc;
    border-radius: 0.5rem;
    padding: 1.5rem;
    background: #f9f9f9;
  }
  
  .user-card h3 {
    margin: 0 0 1rem 0;
    color: #1DB954;
  }
  
  .user-card p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .user-card p strong {
    color: #333;
  }
</style>