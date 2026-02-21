from app import create_app
from app.extensions import db
from app.models import Challenge
import uuid

app = create_app()
with app.app_context():
    # Find a challenge or create one
    challenge = Challenge.query.first()
    if not challenge:
        challenge = Challenge(
            title="Python Basics: Addition",
            description="Write a program that adds two numbers. Input: '5\\n3', Expected: '8'",
            evaluation_metric="exact_match",
            passing_score=100
        )
        db.session.add(challenge)
    
    challenge.test_cases = [
        {"name": "Basic Addition", "input": "5\n3", "output": "8"},
        {"name": "Zero Check", "input": "0\n0", "output": "0"},
        {"name": "Negative Numbers", "input": "-5\n5", "output": "0"}
    ]
    challenge.language = "python"
    db.session.commit()
    print(f"Updated challenge {challenge.id} with test cases.")
