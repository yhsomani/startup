import os


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database connection pooling for performance
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 20,
        'max_overflow': 30,
        'pool_timeout': 30,
        'pool_recycle': 3600,
        'pool_pre_ping': True
    }
    
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970')
    JWT_ACCESS_TOKEN_EXPIRES = 900
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
