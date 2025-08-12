# Fix Discord OAuth for Local Development

## Problem
Local development is trying to redirect to `https://gear-score.com/api/auth/callback/discord` instead of `http://localhost:3000/api/auth/callback/discord`.

## Root Cause
The Discord Developer Portal is missing the localhost redirect URI configuration.

## Solution

### Step 1: Configure Discord Developer Portal

1. Go to: https://discord.com/developers/applications
2. Select your application (Client ID: 1389217214409998468)
3. Navigate to: **OAuth2 > General**
4. In the **Redirects** section, add these URIs:
   ```
   http://localhost:3000/api/auth/callback/discord
   https://gear-score.com/api/auth/callback/discord
   ```
5. Click **Save Changes**

### Step 2: Verify Local Configuration

Your local `.env` file is correctly configured:
```env
NEXTAUTH_URL=http://localhost:3000
DISCORD_CLIENT_ID=1389217214409998468
DISCORD_CLIENT_SECRET=VJDQZ-7eyumIJETV2hXdLPhHGg_eyr5-
```

### Step 3: Test the Fix

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/auth

3. Click "Login with Discord"

4. You should be redirected to Discord's OAuth page

5. After authorization, you should be redirected back to: `http://localhost:3000/api/auth/callback/discord`

## Verification

Run this command to verify your configuration:
```bash
node test-discord-redirect.js
```

Expected output:
```
🔗 Expected Discord OAuth Redirect URI:
http://localhost:3000/api/auth/callback/discord
```

## Common Issues

1. **Still redirecting to production URL**: Clear your browser cache and cookies
2. **"Invalid redirect_uri" error**: Double-check the Discord Developer Portal configuration
3. **CORS errors**: Make sure you're accessing via `http://localhost:3000` not `127.0.0.1:3000`

## Production vs Development

- **Local Development**: `http://localhost:3000/api/auth/callback/discord`
- **Production**: `https://gear-score.com/api/auth/callback/discord`

Both URLs must be configured in Discord Developer Portal for seamless development and deployment.