import os
from flask import Flask
from flask_cors import CORS

class CORSConfig:
    """
    CORS configuration management for TalentSphere services
    """
    
    def __init__(self):
        self.allowed_origins = self._get_allowed_origins()
        self.allowed_methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        self.allowed_headers = ['Content-Type', 'Authorization', 'X-Requested-With']
        self.exposed_headers = ['X-Total-Count', 'X-Page-Count']
    
    def _get_allowed_origins(self):
        """
        Get allowed origins based on environment
        """
        cors_origin = os.getenv('CORS_ORIGIN')
        
        if cors_origin:
            return [origin.strip() for origin in cors_origin.split(',')]
        
        # Default origins based on environment
        if os.getenv('NODE_ENV') == 'production':
            return ['https://talentsphere.yourdomain.com']
        else:
            return [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3100',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:3001'
            ]
    
    def getAllowedOrigins(self):
        """
        Return list of allowed origins
        """
        return self.allowed_origins
    
    def configure_cors(self, app):
        """
        Configure CORS for Flask app
        """
        CORS(app,
             origins=self.allowed_origins,
             methods=self.allowed_methods,
             allowed_headers=self.allowed_headers,
             exposed_headers=self.exposed_headers,
             supports_credentials=os.getenv('CORS_CREDENTIALS', 'false').lower() == 'true',
             max_age=86400)  # 24 hours