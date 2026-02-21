#!/usr/bin/env python3
"""
Security Audit Script for TalentSphere API
"""

import re
import sys
from pathlib import Path

def security_audit():
    """Run security audit on API contracts and codebase"""
    issues = []
    warnings = []
    
    print("🔒 Running security audit...")
    
    # Check API contracts
    contracts_file = Path("Project_Document/API_CONTRACTS.md")
    if contracts_file.exists():
        with open(contracts_file, 'r') as f:
            content = f.read()
        
        # Check for unauthenticated endpoints
        unauth_pattern = r'Auth Required.*No'
        unauth_matches = re.findall(unauth_pattern, content)
        
        for match in unauth_matches:
            if '⚠️' not in match:
                issues.append(f"Unauthenticated endpoint found: {match}")
        
        # Check for missing authentication documentation
        if 'Authorization: Bearer' not in content:
            issues.append("Missing JWT authentication documentation")
        
        # Check for role-based access control
        if 'INSTRUCTOR|ADMIN' not in content:
            warnings.append("Insufficient role-based access control documentation")
    
    # Check backend code for security issues
    backends_dir = Path("backends")
    if backends_dir.exists():
        for file_path in backends_dir.rglob("*.py"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    code = f.read()
                
                # Check for hardcoded credentials
                cred_pattern = r'(password|secret|key|token)\s*=\s*["\'][^"\']+["\']'
                if re.search(cred_pattern, code, re.IGNORECASE):
                    issues.append(f"Potential hardcoded credentials in {file_path}")
                
                # Check for SQL injection risks
                if re.search(r'execute\s*\(\s*.*%', code, re.IGNORECASE):
                    issues.append(f"Potential SQL injection in {file_path}")
                
                # Check for eval usage
                if re.search(r'eval\s*\(', code, re.IGNORECASE):
                    warnings.append(f"eval() usage in {file_path}")
                
            except Exception as e:
                warnings.append(f"Could not scan {file_path}: {e}")
    
    # Report results
    print("\n📊 Security Audit Results:")
    print("=" * 40)
    
    if issues:
        print(f"🔴 {len(issues)} Security Issues Found:")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
    
    if warnings:
        print(f"\n🟡 {len(warnings)} Security Warnings:")
        for i, warning in enumerate(warnings, 1):
            print(f"   {i}. {warning}")
    
    if not issues and not warnings:
        print("✅ No security issues found!")
        return True
    else:
        return len(issues) == 0

if __name__ == "__main__":
    success = security_audit()
    sys.exit(0 if success else 1)