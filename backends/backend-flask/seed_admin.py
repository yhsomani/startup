"""
Seed script to create admin user.
Run with: docker exec ts-backend-flask python seed_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models import User

def seed_admin():
    app = create_app()
    with app.app_context():
        # Check if admin already exists
        admin = User.query.filter_by(role='ADMIN').first()
        if admin:
            print(f"Admin user already exists: {admin.email}")
            return
        
        # Create admin user
        admin = User(
            email="admin@talentsphere.com",
            role="ADMIN"
        )
        admin.set_password("admin123")  # Change in production!
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"✅ Admin user created: admin@talentsphere.com")
        print(f"   Password: admin123 (change this in production!)")
        print(f"   Role: ADMIN")

        # Also create a recruiter for testing
        recruiter = User.query.filter_by(role='RECRUITER').first()
        if not recruiter:
            recruiter = User(
                email="recruiter@talentsphere.com",
                role="RECRUITER"
            )
            recruiter.set_password("recruiter123")
            db.session.add(recruiter)
            db.session.commit()
            print(f"✅ Recruiter user created: recruiter@talentsphere.com")

if __name__ == '__main__':
    seed_admin()
