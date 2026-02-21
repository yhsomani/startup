import sys
import os

# Add the current directory to sys.path so we can import 'app'
# This script is intended to be run from 'backends/backend-flask'
sys.path.append(os.getcwd())

try:
    from app.feature_flags import FeatureFlags
    flags = FeatureFlags._flags
    metadata = FeatureFlags.get_flag_metadata()
    stale = FeatureFlags.get_stale_flags()
    
    print(f"  ✅ {len(flags)} flags loaded")
    print(f"  ✅ {len(metadata)} metadata entries")
    print(f"  ✅ {len(stale)} stale flags")
    sys.exit(0)
except Exception as e:
    print(f"  ❌ Failed to load flags: {e}")
    sys.exit(1)
