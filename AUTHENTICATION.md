# Supabase Authentication System

This document describes the new Supabase-based authentication system that replaces localStorage token storage.

## Overview

The application now stores Spotify authentication tokens in a Supabase database instead of localStorage, providing better security and multi-device support.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spotify_user_id VARCHAR(255) UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_in INTEGER NOT NULL,
    token_generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Authentication Flow

1. **Login**: User authenticates with Spotify → tokens saved to Supabase + user ID cached in localStorage
2. **Token Access**: System retrieves tokens from Supabase using cached user ID
3. **Token Refresh**: Automatic refresh with updated tokens saved back to Supabase
4. **Logout**: Clears localStorage cache but preserves Supabase tokens for future logins

## Migration

- Existing localStorage tokens are automatically migrated to Supabase on first use
- User receives notification when migration occurs
- Fallback to localStorage if Supabase is unavailable

## User Management

Visit `/user-management` to:
- View all users in the database
- Add new users with their tokens
- Import tokens from currently logged-in Spotify user
- Delete user data from database

## Files Changed

- `supabase-schema.sql` - Updated database schema
- `src/lib/supabaseAuth.js` - New auth service for Supabase operations
- `src/lib/spotifyUtils/auth.js` - Updated to use Supabase instead of localStorage
- `src/routes/user-management/` - New route for user management

## Benefits

- **Security**: Tokens no longer stored in browser localStorage
- **Multi-device**: Same user can access from different devices
- **Persistence**: Tokens survive browser cache clearing
- **Management**: Admin interface for user token management
- **Migration**: Seamless transition from localStorage system