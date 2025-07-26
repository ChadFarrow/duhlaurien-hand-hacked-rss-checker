# Podcast Index API Setup Guide

## To fix the 401 authentication errors:

### 1. Get API Credentials
1. Go to https://podcastindex.org/developer
2. Sign up for a free account
3. Generate API credentials (API Key and API Secret)

### 2. Create Environment File
Create a file called `.env.local` in the project root directory with these contents:

```
REACT_APP_PODCAST_INDEX_API_KEY=your_actual_api_key_here
REACT_APP_PODCAST_INDEX_API_SECRET=your_actual_api_secret_here
```

### 3. Restart Development Server
After creating the `.env.local` file, restart your development server:

```bash
npm start
```

### 4. Verify Setup
- The 401 errors should stop appearing in the console
- Podcast names should load from the API instead of fallback names
- You should see "Successfully fetched value recipients" messages

## Notes:
- The `.env.local` file is already in `.gitignore` so it won't be committed to version control
- If you don't set up the API, the app will continue to work with fallback names for known podcasts
- The resource blocking for `netnedsandwich.jpg` is likely from external RSS feeds and doesn't affect functionality 