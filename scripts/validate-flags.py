#!/usr/bin/env python3
"""
Feature Flag Validation Script
Run this in CI to ensure no flags exceed max lifespan
"""
import sys
import os

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.feature_flags import FeatureFlags

def main():
    print("🔍 Validating feature flags...")
    
    # Check for stale flags
    stale_flags = FeatureFlags.get_stale_flags()
    
    if stale_flags:
        print("\n❌ STALE FLAGS DETECTED:")
        for flag in stale_flags:
            print(f"  - {flag['name']}: {flag['age_days']} days old (max: {flag['max_lifespan_days']})")
        print("\n⚠️  Please update or remove these flags")
        sys.exit(1)
    
    # Check for flags in REMOVAL stage
    removal_flags = FeatureFlags.get_flags_by_lifecycle('REMOVAL')
    if removal_flags:
        print("\n⚠️  FLAGS PENDING REMOVAL:")
        for flag in removal_flags:
            print(f"  - {flag}")
        print("\n📝 These flags should be cleaned up")
    
    # Summary
    metadata = FeatureFlags.get_flag_metadata()
    print(f"\n✅ Flag validation passed")
    print(f"📊 Total flags: {len(metadata)}")
    print(f"   - CREATED: {len(FeatureFlags.get_flags_by_lifecycle('CREATED'))}")
    print(f"   - ACTIVE: {len(FeatureFlags.get_flags_by_lifecycle('ACTIVE'))}")
    print(f"   - REMOVAL: {len(removal_flags)}")
    
    sys.exit(0)

if __name__ == '__main__':
    main()
