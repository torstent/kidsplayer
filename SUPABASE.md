# Supabase Integration

This project now uses Supabase to store album data instead of hardcoded arrays.

## Database Schema

The `albums` table stores:
- `id` (VARCHAR): Spotify album ID (primary key)
- `title` (VARCHAR): Album title
- `image_url` (TEXT): URL to album cover image
- `created_at` (TIMESTAMP): When record was created
- `updated_at` (TIMESTAMP): When record was last updated

## Setup

1. **Create the table**: Run the SQL in `supabase-schema.sql` in your Supabase SQL editor.

2. **Environment Variables**: The Supabase credentials are configured in:
   - URL: `https://lqoznmkucwlsnyzhynia.supabase.co`
   - Anon Key: (provided in `.env` file)

3. **Seed the database**: Visit `/supabase-test` after logging into Spotify to populate the database with the two albums.

## How it works

### Loading Albums
- Both `/kids` and `/test` routes load albums from Supabase via `src/lib/albumUtils.js`
- If Supabase fails, it falls back to hardcoded albums for reliability
- Album covers use stored URLs when available, reducing Spotify API calls

### Database Operations
All database operations are handled by `src/lib/supabaseService.js`:
- `getAlbums()`: Fetch all albums
- `insertAlbum(album)`: Add new album
- `updateAlbum(id, updates)`: Modify existing album
- `deleteAlbum(id)`: Remove album
- `testConnection()`: Verify database connectivity

### Data Seeding
The `/supabase-test` page provides:
- Database connection testing
- Album seeding from Spotify API
- Current database content display

## Migration from Hardcoded Data

The integration maintains backward compatibility:
1. Albums are loaded from Supabase first
2. If that fails, fallback to hardcoded albums
3. This ensures the app continues working even if database is unavailable

## Security

- Uses Supabase anon key (safe for client-side use)
- Row Level Security (RLS) enabled with public access policy
- No sensitive data stored (only public Spotify album information)

## Testing

1. Visit `/supabase-test` to verify connection
2. Login to Spotify first (required for seeding)
3. Click "Seed Database" to populate with real album data
4. Check `/kids` and `/test` routes to verify they load the data

The albums will now be stored in Supabase with their titles and image URLs as requested.