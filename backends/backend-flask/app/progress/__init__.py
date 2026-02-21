from flask import Blueprint

progress_bp = Blueprint('progress', __name__)

from . import routes
