from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import time
import os
import json
from pytrends.request import TrendReq

app = Flask(__name__)
CORS(app)

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

@app.route('/game_stats', methods=['GET'])
def get_game_stats():
    game_names = request.args.get('names')
    if not game_names:
        return jsonify({"error": "Missing game names (use 'names=...')"}), 400

    name_list = [name.strip().lower() for name in game_names.split(',')]
    results = []
    names_for_trends = []

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

if __name__ == '__main__':
    app.run(debug=True)
