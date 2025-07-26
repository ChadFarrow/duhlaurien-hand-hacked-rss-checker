# Project Context for Claude

## Environment Setup
- Podcast Index API credentials are configured in `.env` file
- REACT_APP_PODCAST_INDEX_API_KEY and REACT_APP_PODCAST_INDEX_API_SECRET are set
- No need to remind about missing API keys - they exist

## Development Server
- React app runs on localhost:3000 (or 3001 if 3000 is occupied)
- Use `npm start` to start the development server

## Known Issues
- Podcast Index API may return 401 errors even with valid credentials (service issues)
- Application has robust fallback systems for when APIs fail
- CORS proxy improvements implemented for better remote feed fetching

## Project Structure
- RSS feed checker for podcast episodes
- Value recipient extraction system
- Remote feed service with proxy rotation
- Fallback systems for graceful degradation