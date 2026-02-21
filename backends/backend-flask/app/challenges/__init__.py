from flask import Blueprint

challenges_bp = Blueprint('challenges', __name__)

from . import routes
