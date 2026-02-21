from flask import Blueprint, jsonify
from app.feature_flags import FeatureFlags

flags_bp = Blueprint('flags', __name__)

@flags_bp.route('/', methods=['GET'])
def get_all_flags():
    """List all active feature flags"""
    # Create a dictionary of all flags and their status
    flags = {}
    # Access the protected _flags dictionary directly for listing (admin/debug purpose)
    # In production, we might want a cleaner accessor in FeatureFlags class
    for flag in FeatureFlags._flags:
        flags[flag] = FeatureFlags.is_enabled(flag)
    return jsonify(flags), 200

@flags_bp.route('/<key>', methods=['GET'])
def get_flag_status(key):
    """Check status of a specific flag"""
    # Normalize key to uppercase if needed, but strict matching is safer
    if key not in FeatureFlags._flags:
        return jsonify({'error': 'Flag not found'}), 404

    status = FeatureFlags.is_enabled(key)
    return jsonify({'flag': key, 'enabled': status}), 200

@flags_bp.route('/is-enabled/<flag_name>', methods=['GET'])
def is_enabled_endpoint(flag_name):
    """Check if a feature flag is enabled (for Assistant service)"""
    if flag_name not in FeatureFlags._flags:
        return jsonify({'error': 'Flag not found'}), 404

    status = FeatureFlags.is_enabled(flag_name)
    return jsonify({
        'flag': flag_name,
        'enabled': status
    }), 200
