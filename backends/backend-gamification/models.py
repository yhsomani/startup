from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class UserStreak(db.Model):
    """Track daily learning streaks"""
    __tablename__ = 'user_streaks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False, unique=True)  # Changed to String for UUID support
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    streak_start_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, user_id):
        self.user_id = user_id
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'streak_start_date': self.streak_start_date.isoformat() if self.streak_start_date else None
        }

class UserBadge(db.Model):
    """Track earned badges"""
    __tablename__ = 'user_badges'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False)  # Changed to String for UUID support
    badge_id = db.Column(db.String(50), nullable=False)
    badge_name = db.Column(db.String(100))
    badge_icon = db.Column(db.String(10))
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'badge_id', name='unique_user_badge'),)
    
    def __init__(self, user_id, badge_id, badge_name=None, badge_icon=None):
        self.user_id = user_id
        self.badge_id = badge_id
        self.badge_name = badge_name
        self.badge_icon = badge_icon
    
    def to_dict(self):
        return {
            'id': self.badge_id,
            'name': self.badge_name,
            'icon': self.badge_icon,
            'earned_at': self.earned_at.isoformat() if self.earned_at else None
        }

class UserPoints(db.Model):
    """Track user points and levels"""
    __tablename__ = 'user_points'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False, unique=True)  # Changed to String for UUID support
    total_points = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    points_to_next_level = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, user_id):
        self.user_id = user_id
    
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'total_points': self.total_points,
            'level': self.level,
            'points_to_next_level': self.points_to_next_level
        }

# Badge definitions
AVAILABLE_BADGES = [
    {'id': 'first_course', 'name': 'First Course Complete', 'icon': '🎓'},
    {'id': 'week_warrior', 'name': '7-Day Streak', 'icon': '🔥'},
    {'id': 'month_master', 'name': '30-Day Streak', 'icon': '💪'},
    {'id': 'code_master', 'name': '100 Challenges Solved', 'icon': '💻'},
    {'id': 'perfect_score', 'name': 'Perfect Challenge Score', 'icon': '⭐'},
    {'id': 'top_learner', 'name': 'Top 10% Student', 'icon': '🏆'},
    {'id': 'helpful_peer', 'name': 'Helped 10 Students', 'icon': '🤝'},
    {'id': 'fast_learner', 'name': 'Completed Course in 1 Week', 'icon': '⚡'}
]
