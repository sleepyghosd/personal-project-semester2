from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import time
import os
import json
from pytrends.request import TrendReq
from models import db, User, Search, Favorite, GameSearchStat
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# Database configuration
# MySQL: mysql+pymysql://root:password@localhost:3306/gamestats
# Set DATABASE_URL environment variable to use MySQL
import os
DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    DB_URL = 'mysql+pymysql://root:password@localhost:3306/gamestats'

app.config['SQLALCHEMY_DATABASE_URI'] = DB_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

STEAM_API_BASE = "https://store.steampowered.com/api/appdetails"
STEAMSPY_BASE = "https://steamspy.com/api.php"
STEAM_APPS_FILE = "steam_apps.json"

def load_steam_app_ids():
    if not os.path.exists(STEAM_APPS_FILE):
        raise FileNotFoundError("steam_apps.json not found. Please download it from https://api.steampowered.com/ISteamApps/GetAppList/v2/")
    
    with open(STEAM_APPS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        apps = data.get("applist", {}).get("apps", [])
        return {app["name"].lower(): app["appid"] for app in apps}

name_to_appid = load_steam_app_ids()

def get_steam_api_details(app_id):
    res = requests.get(f"{STEAM_API_BASE}?appids={app_id}")
    if res.status_code == 200:
        data = res.json()
        if data[str(app_id)]['success']:
            return data[str(app_id)]['data']
    return None

def get_steamspy_details(app_id):
    res = requests.get(f"{STEAMSPY_BASE}?request=appdetails&appid={app_id}")
    if res.status_code == 200:
        return res.json()
    return None


def get_google_trends_data(names):
    pytrends = TrendReq(hl='en-US', tz=360)
    trends = {}

    for name in names:
        try:
            pytrends.build_payload([name], timeframe='now 7-d')
            time.sleep(15)
            data = pytrends.interest_over_time()
            if not data.empty:
                trends[name] = data[name].tolist()
            else:
                trends[name] = []
        except Exception as e:
            print(f"Error retrieving trends for {name}: {e}")
            trends[name] = []

    return trends

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/game_stats', methods=['GET'])
def get_game_stats():
    game_names = request.args.get('names')
    user_id = request.args.get('user_id')
    if not game_names:
        return jsonify({"error": "Missing game names (use 'names=...')"}), 400

    name_list = [name.strip().lower() for name in game_names.split(',')]
    results = []
    names_for_trends = []

    # Track searches in database
    if user_id:
        try:
            user = User.query.get(int(user_id))
            if user:
                for name in name_list:
                    app_id = name_to_appid.get(name)
                    if app_id:
                        # Add to user searches
                        search = Search(user_id=user.id, game_name=name)
                        db.session.add(search)
                        
                        # Update global game stats
                        stat = GameSearchStat.query.filter_by(game_name=name).first()
                        if stat:
                            stat.search_count += 1
                            stat.last_searched = datetime.utcnow()
                        else:
                            stat = GameSearchStat(game_name=name, search_count=1)
                        db.session.add(stat)
                db.session.commit()
        except Exception as e:
            print(f"Error tracking search: {e}")

    for name in name_list:
        app_id = name_to_appid.get(name)
        if not app_id:
            print(f"Game not found: {name}")
            continue

        steamspy = get_steamspy_details(app_id)
        steam = get_steam_api_details(app_id)

        if not steamspy or not steam:
            continue

        names_for_trends.append(steamspy.get("name", "Unknown"))

        tag_items = sorted(steamspy.get("tags", {}).items(), key=lambda x: x[1], reverse=True)
        top_tags = [tag for tag, _ in tag_items[:3]]
        genres = [g['description'] for g in steam.get('genres', [])]

        results.append({
            "AppID": app_id,
            "Title": steamspy.get("name", "Unknown"),
            "Owners": steamspy.get("owners", "0..0"),
            "Players_2Weeks": steamspy.get("players_2weeks", 0),
            "ReviewScore": steamspy.get("positive", 0) - steamspy.get("negative", 0),
            "Genres": genres,
            "Tags": top_tags
        })

    trends = get_google_trends_data(names_for_trends)

    return jsonify({"games": results, "trends": trends})


# User Management Endpoints
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    username = data.get('username')
    
    if not username:
        return jsonify({"error": "Username is required"}), 400
    
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "User already exists"}), 409
    
    user = User(username=username)
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify(user.to_dict())


# Search History Endpoints
@app.route('/api/users/<int:user_id>/searches', methods=['GET'])
def get_user_searches(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    searches = Search.query.filter_by(user_id=user_id).order_by(Search.search_date.desc()).all()
    return jsonify([search.to_dict() for search in searches])


@app.route('/api/users/<int:user_id>/latest-searches', methods=['GET'])
def get_latest_searches(user_id):
    """Get the most recent 10 searches for a user"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    limit = request.args.get('limit', 10, type=int)
    searches = Search.query.filter_by(user_id=user_id).order_by(Search.search_date.desc()).limit(limit).all()
    return jsonify([search.to_dict() for search in searches])


# Favorites Endpoints
@app.route('/api/users/<int:user_id>/favorites', methods=['GET'])
def get_user_favorites(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    return jsonify([fav.to_dict() for fav in favorites])


@app.route('/api/users/<int:user_id>/favorites', methods=['POST'])
def add_favorite(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json()
    game_name = data.get('game_name')
    app_id = data.get('app_id')
    
    if not game_name:
        return jsonify({"error": "Game name is required"}), 400
    
    # Check if already favorited
    existing = Favorite.query.filter_by(user_id=user_id, game_name=game_name).first()
    if existing:
        return jsonify({"error": "Already in favorites"}), 409
    
    favorite = Favorite(user_id=user_id, game_name=game_name, app_id=app_id)
    db.session.add(favorite)
    db.session.commit()
    
    return jsonify(favorite.to_dict()), 201


@app.route('/api/users/<int:user_id>/favorites/<int:fav_id>', methods=['DELETE'])
def remove_favorite(user_id, fav_id):
    favorite = Favorite.query.filter_by(id=fav_id, user_id=user_id).first()
    if not favorite:
        return jsonify({"error": "Favorite not found"}), 404
    
    db.session.delete(favorite)
    db.session.commit()
    
    return jsonify({"message": "Favorite removed"}), 200


# Global Game Statistics Endpoints
@app.route('/api/games/most-searched', methods=['GET'])
def get_most_searched_games():
    """Get most searched games across all users"""
    limit = request.args.get('limit', 10, type=int)
    stats = GameSearchStat.query.order_by(GameSearchStat.search_count.desc()).limit(limit).all()
    return jsonify([stat.to_dict() for stat in stats])


@app.route('/api/games/search-stats', methods=['GET'])
def get_search_stats():
    """Get statistics about total searches"""
    total_searches = db.session.query(db.func.sum(GameSearchStat.search_count)).scalar() or 0
    total_unique_games = GameSearchStat.query.count()
    
    return jsonify({
        "total_searches": total_searches,
        "total_unique_games": total_unique_games
    })


if __name__ == '__main__':
    app.run(debug=True)
