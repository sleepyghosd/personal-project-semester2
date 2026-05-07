-- MySQL Database Queries for Game Trends Analyzer

-- ============================================
-- 1. VIEW ALL TABLES
-- ============================================

-- Show all tables in the database
SHOW TABLES;

-- ============================================
-- 2. USERS TABLE QUERIES
-- ============================================

-- View all users
SELECT * FROM users;

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- View user with specific ID
SELECT * FROM users WHERE id = 1;

-- ============================================
-- 3. SEARCHES TABLE QUERIES
-- ============================================

-- View all searches (most recent first)
SELECT * FROM searches ORDER BY search_date DESC;

-- View searches for a specific user
SELECT * FROM searches WHERE user_id = 1 ORDER BY search_date DESC;

-- Count searches per user
SELECT user_id, COUNT(*) as search_count 
FROM searches 
GROUP BY user_id 
ORDER BY search_count DESC;

-- Most searched games in last 7 days
SELECT game_name, COUNT(*) as search_count 
FROM searches 
WHERE search_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY game_name 
ORDER BY search_count DESC;

-- Total searches by all users
SELECT COUNT(*) as total_searches FROM searches;

-- ============================================
-- 4. FAVORITES TABLE QUERIES
-- ============================================

-- View all favorites
SELECT * FROM favorites;

-- View favorites for a specific user
SELECT * FROM favorites WHERE user_id = 1;

-- Count favorites per user
SELECT user_id, COUNT(*) as favorite_count 
FROM favorites 
GROUP BY user_id;

-- Most favorited games
SELECT game_name, COUNT(*) as favorite_count 
FROM favorites 
GROUP BY game_name 
ORDER BY favorite_count DESC;

-- ============================================
-- 5. GAME_SEARCH_STATS TABLE QUERIES
-- ============================================

-- View all game statistics
SELECT * FROM game_search_stats;

-- Top 10 most searched games
SELECT game_name, search_count, last_searched 
FROM game_search_stats 
ORDER BY search_count DESC 
LIMIT 10;

-- Games searched in last 24 hours
SELECT * FROM game_search_stats 
WHERE last_searched >= DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY search_count DESC;

-- Total unique games searched
SELECT COUNT(*) as unique_games_searched FROM game_search_stats;

-- ============================================
-- 6. COMBINED QUERIES
-- ============================================

-- User activity: username with search count and favorites
SELECT 
    u.id,
    u.username,
    COUNT(DISTINCT s.id) as total_searches,
    COUNT(DISTINCT f.id) as total_favorites,
    u.created_at
FROM users u
LEFT JOIN searches s ON u.id = s.user_id
LEFT JOIN favorites f ON u.id = f.user_id
GROUP BY u.id, u.username, u.created_at
ORDER BY total_searches DESC;

-- Search activity with game stats
SELECT 
    s.game_name,
    COUNT(*) as search_count,
    MAX(s.search_date) as last_search_date,
    (SELECT COUNT(*) FROM favorites WHERE game_name = s.game_name) as favorite_count
FROM searches s
GROUP BY s.game_name
ORDER BY search_count DESC
LIMIT 20;

-- User's latest searches with details
SELECT 
    u.username,
    s.game_name,
    s.search_date,
    gs.search_count as global_search_count
FROM searches s
JOIN users u ON s.user_id = u.id
LEFT JOIN game_search_stats gs ON s.game_name = gs.game_name
ORDER BY s.search_date DESC
LIMIT 50;

-- ============================================
-- 7. ANALYTICS QUERIES
-- ============================================

-- Summary statistics
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM searches) as total_searches,
    (SELECT COUNT(*) FROM favorites) as total_favorites,
    (SELECT COUNT(*) FROM game_search_stats) as unique_games;

-- Games with both searches and favorites
SELECT 
    g.game_name,
    g.search_count,
    COALESCE(f.favorite_count, 0) as favorite_count
FROM game_search_stats g
LEFT JOIN (
    SELECT game_name, COUNT(*) as favorite_count 
    FROM favorites 
    GROUP BY game_name
) f ON g.game_name = f.game_name
ORDER BY g.search_count DESC;

-- ============================================
-- 8. CLEANUP/MAINTENANCE QUERIES
-- ============================================

-- Delete searches older than 30 days
-- DELETE FROM searches WHERE search_date < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Delete a user and all their data
-- DELETE FROM searches WHERE user_id = 1;
-- DELETE FROM favorites WHERE user_id = 1;
-- DELETE FROM users WHERE id = 1;

-- Reset search counts for a game
-- UPDATE game_search_stats SET search_count = 0 WHERE game_name = 'Game Name';

-- Clear all data (WARNING: DESTRUCTIVE)
-- DELETE FROM searches;
-- DELETE FROM favorites;
-- DELETE FROM game_search_stats;
-- DELETE FROM users;
