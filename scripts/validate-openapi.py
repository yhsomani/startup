#!/usr/bin/env python3
"""
OpenAPI Specification Validator for TalentSphere
"""

import yaml
import json
import sys
from pathlib import Path

def validate_openapi():
    """Validate OpenAPI specification"""
    try:
        with open('openapi.yaml', 'r') as f:
            spec = yaml.safe_load(f)
        
        # Basic structure validation
        required_fields = ['openapi', 'info', 'paths']
        for field in required_fields:
            if field not in spec:
                print(f"❌ Missing required field: {field}")
                return False
        
        # Info validation
        info = spec['info']
        required_info = ['title', 'version', 'description']
        for field in required_info:
            if field not in info:
                print(f"❌ Missing required info field: {field}")
                return False
        
        # Security validation
        if 'components' not in spec or 'securitySchemes' not in spec.get('components', {}):
            print("❌ Missing security schemes")
            return False
        
        print("✅ OpenAPI specification is valid!")
        return True
        
    except Exception as e:
        print(f"❌ OpenAPI validation failed: {e}")
        return False

if __name__ == "__main__":
    success = validate_openapi()
    sys.exit(0 if success else 1)