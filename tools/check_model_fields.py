from app.models import Challenge
print([attr for attr in dir(Challenge) if not attr.startswith('_')])