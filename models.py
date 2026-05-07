from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    searches = db.relationship('Search', backref='user', lazy=True, cascade='all, delete-orphan')
    favorites = db.relationship('Favorite', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat()
        }


class Search(db.Model):
    __tablename__ = 'searches'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_name = db.Column(db.String(255), nullable=False)
    search_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'game_name': self.game_name,
            'search_date': self.search_date.isoformat()
        }


class Favorite(db.Model):
    __tablename__ = 'favorites'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_name = db.Column(db.String(255), nullable=False)
    app_id = db.Column(db.Integer, nullable=True)
    added_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'game_name': self.game_name,
            'app_id': self.app_id,
            'added_date': self.added_date.isoformat()
        }


class GameSearchStat(db.Model):
    __tablename__ = 'game_search_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    game_name = db.Column(db.String(255), nullable=False, unique=True)
    search_count = db.Column(db.Integer, default=0)
    last_searched = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'game_name': self.game_name,
            'search_count': self.search_count,
            'last_searched': self.last_searched.isoformat()
        }
