import os
from datetime import datetime, timedelta

class FeatureFlags:
    _flags = {
        # Challenge Service Flags
        'ENABLE_MANUAL_GRADING': True,
        'ENABLE_CHALLENGE_MANAGEMENT': True, # For Update/Delete
        'ENABLE_USER_HISTORY': True, # For User Submissions

        # Phase 10 Service Flags
        'ENABLE_AI_ASSISTANT': True,  # AI-powered tutoring
        'ENABLE_CODE_EXECUTION': True,  # Real-time code sandboxing
        'ENABLE_RECRUITMENT': True,  # B2B recruiter dashboard
        'ENABLE_GAMIFICATION': True,  # Streaks, badges, points
    }

    # Flag lifecycle metadata
    _metadata = {
        'ENABLE_MANUAL_GRADING': {
            'created': '2025-12-20',
            'max_lifespan_days': 90,
            'lifecycle': 'ACTIVE',
            'owner': 'backend-flask'
        },
        'ENABLE_CHALLENGE_MANAGEMENT': {
            'created': '2025-12-20',
            'max_lifespan_days': 90,
            'lifecycle': 'ACTIVE',
            'owner': 'backend-flask'
        },
        'ENABLE_USER_HISTORY': {
            'created': '2025-12-20',
            'max_lifespan_days': 90,
            'lifecycle': 'ACTIVE',
            'owner': 'backend-flask'
        },
        'ENABLE_AI_ASSISTANT': {
            'created': '2025-12-27',
            'max_lifespan_days': 90,
            'lifecycle': 'ACTIVE',
            'owner': 'backend-assistant'
        },
        'ENABLE_CODE_EXECUTION': {
            'created': '2025-12-27',
            'max_lifespan_days': 90,
            'lifecycle': 'ACTIVE',
            'owner': 'backend-flask'
        },
        'ENABLE_RECRUITMENT': {
            'created': '2025-12-27',
            'max_lifespan_days': 90,
            'lifecycle': 'ACTIVE',
            'owner': 'backend-recruitment'
        },
        'ENABLE_GAMIFICATION': {
            'created': '2025-12-27',
            'max_lifespan_days': 90,
            'lifecycle': 'ACTIVE',
            'owner': 'backend-gamification'
        },
    }

    @classmethod
    def is_enabled(cls, flag_name):
        # Allow override via Environment Variable (e.g., FF_ENABLE_MANUAL_GRADING=true)
        env_key = f"FF_{flag_name}"
        if env_key in os.environ:
            return os.environ[env_key].lower() == 'true'

        return cls._flags.get(flag_name, False)

    @classmethod
    def enable(cls, flag_name):
        if flag_name in cls._flags:
            cls._flags[flag_name] = True

    @classmethod
    def disable(cls, flag_name):
        if flag_name in cls._flags:
            cls._flags[flag_name] = False

    @classmethod
    def get_flag_metadata(cls):
        """Get metadata for all flags"""
        return cls._metadata

    @classmethod
    def get_stale_flags(cls):
        """Return flags exceeding max lifespan"""
        now = datetime.now()
        stale = []

        for flag_name, meta in cls._metadata.items():
            created = datetime.fromisoformat(meta['created'])
            age = (now - created).days

            if age > meta['max_lifespan_days'] and meta['lifecycle'] != 'REMOVAL':
                stale.append({
                    'name': flag_name,
                    'age_days': age,
                    'max_lifespan_days': meta['max_lifespan_days'],
                    'lifecycle': meta['lifecycle']
                })

        return stale

    @classmethod
    def get_flags_by_lifecycle(cls, lifecycle):
        """Get all flags in specific lifecycle stage"""
        return [
            flag_name for flag_name, meta in cls._metadata.items()
            if meta['lifecycle'] == lifecycle
        ]
