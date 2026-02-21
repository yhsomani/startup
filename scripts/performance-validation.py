#!/usr/bin/env python3
"""
Performance Validation Script for TalentSphere API
"""

import sys
from pathlib import Path

def performance_validation():
    """Run performance validation on API specification"""
    issues = []
    warnings = []
    
    print("⚡ Running performance validation...")
    
    # Check OpenAPI spec size
    openapi_file = Path("openapi.yaml")
    if openapi_file.exists():
        with open(openapi_file, 'r') as f:
            lines = len(f.readlines())
        
        if lines > 10000:
            warnings.append(f"OpenAPI specification is large ({lines} lines) - consider splitting")
        
        print(f"📊 API Specification Statistics:")
        print(f"   - Lines: {lines}")
        
        # Count endpoints and schemas
        with open(openapi_file, 'r') as f:
            content = f.read()
        
        endpoint_count = content.count('get:') + content.count('post:') + content.count('put:') + content.count('delete:')
        schema_count = content.count('type: object')
        
        print(f"   - Endpoints: {endpoint_count}")
        print(f"   - Schemas: {schema_count}")
        
        # Performance recommendations
        if endpoint_count > 100:
            warnings.append("Large number of endpoints - consider API versioning strategy")
        
        if schema_count > 50:
            warnings.append("Large number of schemas - consider modular design")
    
    # Check for response time recommendations in contracts
    contracts_file = Path("Project_Document/API_CONTRACTS.md")
    if contracts_file.exists():
        with open(contracts_file, 'r') as f:
            content = f.read()
        
        # Check for timeout documentation
        if 'timeout' not in content.lower():
            warnings.append("Consider adding timeout documentation for long-running operations")
        
        # Check for rate limiting documentation
        if 'rate limit' not in content.lower():
            warnings.append("Consider adding rate limiting documentation")
    
    # Report results
    print("\n📊 Performance Validation Results:")
    print("=" * 45)
    
    if issues:
        print(f"🔴 {len(issues)} Performance Issues:")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
    
    if warnings:
        print(f"\n🟡 {len(warnings)} Performance Warnings:")
        for i, warning in enumerate(warnings, 1):
            print(f"   {i}. {warning}")
    
    if not issues and not warnings:
        print("✅ No performance issues found!")
        return True
    else:
        return len(issues) == 0

if __name__ == "__main__":
    success = performance_validation()
    sys.exit(0 if success else 1)