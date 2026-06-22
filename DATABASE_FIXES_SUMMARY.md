# Sama ASC - Database Verification & Fixes

## Problem Summary
The application had **two incompatible authentication systems**:
- `app/register/page.tsx` was creating admins via **Supabase Auth** (stored in `team_members` table)
- Rest of the app was using the custom **`users` table** with client-side password hashing
- This caused inconsistencies and missing data

## Solution Overview
Unified everything to use the custom `users` table with client-side password hashing:
1. Modified authentication flow to remove dependency on Supabase Auth
2. Added missing columns to database schema
3. Created new RPC functions that work with the `users` table
4. Updated all API endpoints for consistency

## Files Modified

### 1. Database Migrations (New)
- **20260620000000_fix_database_schema.sql** - Add missing columns to `users` table:
  - `email` TEXT
  - `profile_photo_url` TEXT
  
- **20260620000100_create_get_team_info_rpc.sql** - New RPC that queries `users` table:
  - Replaces old `get_user_team_info()` that used `team_members`
  - Function: `get_team_info_by_user(p_user_id UUID)`
  
- **20260620000300_create_team_with_admin_rpc.sql** - New RPC to create teams:
  - Creates team directly in `users` table (not Supabase Auth)
  - Function: `create_team_with_admin(...)`
  
- **20260620000400_add_schema_verification_rpc.sql** - Schema verification RPC:
  - Auto-checks and fixes missing columns
  - Function: `verify_database_schema()`

### 2. Application Code Changes

#### app/register/page.tsx
- **Before**: Used `supabase.auth.signUp()` then RPC `create_team_and_add_user()`
- **After**: Uses new RPC `create_team_with_admin()` with client-side password hashing
- **Change**: Removed Supabase Auth dependency, uses `users` table

#### app/login/page.tsx  
- **Before**: Used `supabase.auth.signInWithPassword()` then RPC `get_user_team_info()`
- **After**: Queries `users` table directly with domain/email lookup
- **Change**: Removed Supabase Auth dependency, uses custom password verification

#### app/api/admin/users/route.ts
- **Before**: Didn't save `email` field
- **After**: Saves `email` when creating users
- **Change**: Added `email: user.email` to insert payload

### 3. API Endpoints (New)
- **app/api/admin/verify-schema/route.ts** - Verify and initialize database schema
  - GET: Check current schema status
  - POST: Run verification and auto-fix

### 4. Scripts (New)
- **scripts/run-migrations.ts** - Execute all pending migrations
- **scripts/setup-storage.ts** - Initialize Supabase Storage bucket

## Deployment Steps

### Step 1: Pull Latest Changes
```bash
git pull origin master
```

### Step 2: Deploy to Vercel
```bash
vercel deploy --prod
```
Or allow automatic deployment if GitHub integration is set up.

### Step 3: Verify Database Schema
Once deployed, visit: `https://yourdomain/api/admin/verify-schema` (POST)

Or in development:
```bash
curl -X POST http://localhost:3000/api/admin/verify-schema
```

Expected response:
```json
{
  "success": true,
  "schema": {
    "schema_valid": true,
    "users_email": true,
    "users_profile_photo": true,
    "supporters_profile_photo": true
  }
}
```

### Step 4: Initialize Storage Bucket
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/setup-storage.ts
```

Or manually in Supabase Dashboard:
1. Go to Storage → Buckets
2. Create a new bucket named `team-assets`
3. Set to Public
4. Configure policies (see migration 20260620000200_configure_storage_policies.sql)

## Testing Checklist

### 1. Team Creation (app/register)
- [ ] Create new team with admin email
- [ ] Admin should be created in `users` table (not Supabase Auth)
- [ ] Team info stored in localStorage
- [ ] Redirected to home page

### 2. Admin Login (app/login)
- [ ] Login with admin@domain.com
- [ ] Uses custom password verification (not Supabase Auth)
- [ ] Team info retrieved from database
- [ ] Redirected to dashboard

### 3. Member Login (app/user-login)
- [ ] Login with member@domain.com  
- [ ] Uses custom password verification
- [ ] Team context loaded correctly
- [ ] Can access dashboard

### 4. Member Registration (app/user-register)
- [ ] Add new member via admin panel
- [ ] User created in `users` table with email
- [ ] Success notification displays
- [ ] Admin stays on page

### 5. Profile Management (app/profil)
- [ ] Upload profile photo
- [ ] Photo saved to Supabase Storage
- [ ] `profile_photo_url` updated in database
- [ ] Photo displays in user profile and supporters

### 6. Admin User Management
- [ ] View list of team members
- [ ] No React #310 error
- [ ] Can add new members without issues

## Rollback Plan
If issues occur:
1. The old code is still in git history
2. Rollback to previous commit: `git revert <commit-hash>`
3. Redeploy to Vercel

## Database Schema Reference

### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL (client-side SHA-256 hash),
  name TEXT NOT NULL,
  email TEXT,  -- NEW
  profile_photo_url TEXT,  -- NEW
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### teams table (updated)
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,  -- NEW
  admin_email TEXT,  -- NEW
  logo_url TEXT,
  team_photo_url TEXT,  -- NEW
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  accent_color TEXT DEFAULT '#f59e0b',
  nav_color TEXT DEFAULT '#1f2937',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### supporters table (updated)
```sql
CREATE TABLE supporters (
  ...
  profile_photo_url TEXT,  -- NEW
  ...
);
```

## New RPC Functions

### get_team_info_by_user(p_user_id UUID)
Returns: `{ success, team_id, team_name, team_domain, user_role }`
- Queries `users` table (not `team_members`)
- Returns team info for a given user

### create_team_with_admin(...)
Parameters: `p_team_name, p_team_domain, p_admin_email, p_admin_username, p_admin_password_hash`
Returns: `{ success, team_id, user_id }`
- Creates team and admin user in `users` table
- No dependency on Supabase Auth

### verify_database_schema()
Returns: `{ schema_valid, users_email, users_profile_photo, supporters_profile_photo }`
- Checks for missing columns
- Auto-creates missing columns

## Troubleshooting

### Issue: "User not associated with any team"
- **Cause**: User not found in `users` table
- **Fix**: Check `/api/admin/verify-schema` endpoint
- **Solution**: Re-run schema verification to add missing columns

### Issue: Profile photo not saving
- **Cause**: `profile_photo_url` column doesn't exist
- **Fix**: Run `/api/admin/verify-schema` endpoint
- **Solution**: Wait for POST request to complete, then retry upload

### Issue: Can't create team
- **Cause**: RPC function not migrated
- **Fix**: Check Supabase Migration history
- **Solution**: Manually apply migrations from supabase/migrations/

### Issue: Login fails
- **Cause**: Using old Supabase Auth system
- **Fix**: Clear localStorage and try again
- **Solution**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

## Files Status

### ✓ Completed
- [x] Database migrations created
- [x] app/register/page.tsx updated
- [x] app/login/page.tsx updated
- [x] app/api/admin/users/route.ts updated
- [x] API endpoint for schema verification created
- [x] Storage setup script created
- [x] Migration scripts created

### ⏳ To Do
- [ ] Deploy to Vercel
- [ ] Verify database schema
- [ ] Test all authentication flows
- [ ] Test profile photo upload
- [ ] Test admin user creation
- [ ] Confirm no React errors

## Questions?
Check the console logs for detailed error messages. Each component logs:
- Login/registration attempts
- Password verification results
- Team lookups
- Photo upload status
- API responses
