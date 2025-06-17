# Supabase Setup for Wolverine Workout

## Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select your existing project
3. Go to Settings → API
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## What's Implemented

✅ **Authentication System**
- User registration and login
- Session management
- Protected routes
- Logout functionality

✅ **Components Created**
- `AuthForm` - Login/signup form
- `AuthContext` - React context for auth state
- Supabase client configuration

## Next Steps

Once you add your Supabase credentials:

1. Users can sign up and log in
2. The app will show the auth form when not logged in
3. Authenticated users see the workout app
4. User sessions persist across browser refreshes

## Database Integration (Future)

The foundation is set for:
- Storing user workout history
- Saving favorite exercises
- Tracking progress over time
- User preferences and settings 