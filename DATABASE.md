# Database Documentation

## Overview
This project uses SQLite with SQLAlchemy ORM to manage user data including:
- User accounts
- Search history (latest searches per user)
- Favorite games per user
- Global game search statistics (most searched games across all users)

## Database Schema

### Users Table
Stores user account information.
```
id (Integer, Primary Key)
username (String, Unique)
created_at (DateTime)
```

### Searches Table
Tracks search history per user.
```
id (Integer, Primary Key)
user_id (Integer, Foreign Key → users.id)
game_name (String)
search_date (DateTime)
```

### Favorites Table
Stores favorite games per user.
```
id (Integer, Primary Key)
user_id (Integer, Foreign Key → users.id)
game_name (String)
app_id (Integer, Nullable)
added_date (DateTime)
```

### GameSearchStat Table
Aggregates search statistics across all users.
```
id (Integer, Primary Key)
game_name (String, Unique)
search_count (Integer)
last_searched (DateTime)
```

## API Endpoints

### User Management

#### Create User
- **POST** `/api/users`
- **Body:** `{ "username": "user_name" }`
- **Response:** User object with id, username, created_at

#### Get User
- **GET** `/api/users/<user_id>`
- **Response:** User object

### Search History

#### Get All Searches
- **GET** `/api/users/<user_id>/searches`
- **Response:** Array of search objects

#### Get Latest Searches
- **GET** `/api/users/<user_id>/latest-searches?limit=10`
- **Response:** Array of most recent search objects (ordered by date, descending)

### Favorites

#### Get User Favorites
- **GET** `/api/users/<user_id>/favorites`
- **Response:** Array of favorite objects

#### Add to Favorites
- **POST** `/api/users/<user_id>/favorites`
- **Body:** `{ "game_name": "Game Name", "app_id": 123456 }`
- **Response:** Favorite object (201 Created)
- **Error:** 409 if already favorited

#### Remove from Favorites
- **DELETE** `/api/users/<user_id>/favorites/<favorite_id>`
- **Response:** Success message (200)

### Global Game Statistics

#### Get Most Searched Games
- **GET** `/api/games/most-searched?limit=10`
- **Response:** Array of game stats objects (ordered by search_count, descending)

#### Get Search Statistics
- **GET** `/api/games/search-stats`
- **Response:** Object with total_searches and total_unique_games

## Frontend Integration

### Automatic User Management
- User is automatically created on first visit
- User ID is stored in localStorage
- User ID is passed with game stats requests to track searches

### Favorites System
- Heart icon (♡/♥) added to each game card
- Users can add/remove favorites
- Favorites are persisted and displayed in sidebar

### Search Tracking
- Each game search is logged to user's search history
- Global game statistics are updated with each search
- Most searched games display updates after each search

## Database File Location
- **File:** `game_database.db`
- **Location:** Project root directory
- **Format:** SQLite 3

## Running the Application

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask app:
```bash
python app.py
```

3. Access the web application at `http://localhost:5000`

## Data Persistence
All user data (searches, favorites, global statistics) is automatically persisted to the SQLite database. Data persists across application restarts.

