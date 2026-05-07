# Quick Setup Guide

## Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the application:**
```bash
python app.py
```

3. **Access the application:**
Open your browser and go to `http://localhost:5000`

## Features Added

### User Management
- Each user is automatically created on first visit
- User ID is stored in browser localStorage
- Users are identified by unique IDs in the database

### Search Tracking
- Every game search is logged to the user's search history
- Global statistics track total searches per game across all users
- Latest searches can be retrieved per user

### Favorites System
- Users can add/remove games from their favorites list
- Heart icon (♡/♥) on each game card to toggle favorite status
- Favorites are persisted in the database
- Favorites list displayed in sidebar

### Most Searched Games
- Global rankings show which games are most searched by all users combined
- Updates automatically after each search
- Displayed in the right sidebar

## Database

The application uses SQLite database (`game_database.db`) with the following tables:
- **users** - User accounts
- **searches** - Search history per user
- **favorites** - Favorite games per user
- **game_search_stats** - Global game search statistics

See `DATABASE.md` for detailed API endpoint documentation.

## File Structure

```
├── app.py                 # Flask backend with all API routes
├── models.py              # SQLAlchemy database models
├── index.html             # Frontend HTML
├── static/
│   ├── script.js          # Frontend JavaScript with database integration
│   ├── styles.css         # Styling
├── steam_apps.json        # Steam game data
├── game_database.db       # SQLite database (auto-created)
├── requirements.txt       # Python dependencies
├── DATABASE.md            # Database documentation
└── SETUP.md              # This file
```

## API Endpoints Summary

### Users
- `POST /api/users` - Create user
- `GET /api/users/<id>` - Get user info

### Searches
- `GET /api/users/<id>/searches` - Get all searches
- `GET /api/users/<id>/latest-searches?limit=10` - Get latest searches

### Favorites
- `GET /api/users/<id>/favorites` - Get favorites
- `POST /api/users/<id>/favorites` - Add favorite
- `DELETE /api/users/<id>/favorites/<fav_id>` - Remove favorite

### Global Stats
- `GET /api/games/most-searched?limit=10` - Get most searched games
- `GET /api/games/search-stats` - Get search statistics

## Troubleshooting

### Database Not Found
- The database is created automatically on first run
- Check that you have write permissions in the project directory

### Searches Not Being Tracked
- Make sure the user ID is correctly stored in localStorage
- Check browser console for any JavaScript errors

### Port Already in Use
- If port 5000 is in use, modify the `app.run()` call in app.py to use a different port:
```python
app.run(debug=True, port=5001)
```

