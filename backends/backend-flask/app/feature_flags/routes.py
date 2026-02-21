from flask import Blueprint, jsonify
from app.feature_flags import FeatureFlags

flags_bp = Blueprint('flags', __name__, url_prefix='/api/v1/flags')

@flags_bp.route('/is-enabled/<flag_name>', methods=['GET'])
def is_enabled(flag_name):
    """Check if a feature flag is enabled"""
    try:
        enabled = FeatureFlags.is_enabled(flag_name)
        return jsonify({
            'flag': flag_name,
            'enabled': enabled
        }), 200
    except (KeyError, AttributeError) as e:
        return jsonify({
            'error': 'Feature flag not found',
            'flag': flag_name
        }), 404
    except ValueError as e:
        return jsonify({
            'error': 'Invalid flag name',
            'message': str(e)
        }), 400

