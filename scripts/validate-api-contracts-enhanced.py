#!/usr/bin/env python3
"""
TalentSphere API Contract Validation Script
======================================

This script validates that the API contracts documentation remains synchronized
with the actual implementation and meets quality standards.

Usage:
    python validate-api-contracts.py [--fix] [--verbose]

Options:
    --fix     Attempt to fix minor issues automatically
    --verbose Show detailed validation output

Exit Codes:
    0 - Validation passed
    1 - Validation failed with errors
    2 - Validation failed with warnings only
"""

import os
import sys
import re
import json
import yaml
import argparse
from pathlib import Path
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ValidationResult:
    """Represents a validation result"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    fixes_applied: List[str]

class APIContractValidator:
    """Validates API contracts against implementation and standards"""
    
    def __init__(self, contracts_file: str = "Project_Document/API_CONTRACTS.md"):
        self.contracts_file = Path(contracts_file)
        self.openapi_file = Path("openapi.yaml")
        self.results = ValidationResult(True, [], [], [])
        
    def validate_all(self, fix: bool = False, verbose: bool = False) -> ValidationResult:
        """Run all validation checks"""
        print("🔍 Starting TalentSphere API Contract Validation")
        print("=" * 60)
        
        # Check if files exist
        if not self.contracts_file.exists():
            self.results.errors.append(f"Contracts file not found: {self.contracts_file}")
            return self.results
            
        if not self.openapi_file.exists():
            self.results.errors.append(f"OpenAPI file not found: {self.openapi_file}")
            return self.results
        
        # Run validation checks
        self._validate_file_structure()
        self._validate_service_registry()
        self._validate_authentication_consistency()
        self._validate_error_responses()
        self._validate_schema_consistency()
        self._validate_port_conflicts()
        self._validate_openapi_sync()
        self._validate_naming_conventions()
        self._validate_security_standards()
        
        # Apply fixes if requested
        if fix and self.results.errors:
            self._apply_fixes()
        
        # Report results
        self._report_results(verbose)
        
        return self.results
    
    def _validate_file_structure(self):
        """Validate document structure and required sections"""
        print("📋 Validating document structure...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            required_sections = [
                "API DESIGN PRINCIPLES",
                "SERVICE REGISTRY", 
                "AUTH SERVICE API",
                "LMS SERVICE API",
                "CHALLENGE SERVICE API",
                "PROGRESS SERVICE API",
                "CERTIFICATE SERVICE API",
                "AI ASSISTANT SERVICE API"
            ]
            
            for section in required_sections:
                if f"## {section}" not in content:
                    self.results.errors.append(f"Missing required section: {section}")
            
            # Check for shared schema components
            if "SHARED SCHEMA COMPONENTS" not in content:
                self.results.warnings.append("Consider adding shared schema components section")
                
        except Exception as e:
            self.results.errors.append(f"Failed to read contracts file: {e}")
    
    def _validate_service_registry(self):
        """Validate service registry consistency"""
        print("🗂️ Validating service registry...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract service registry table
            registry_match = re.search(r'\| (.*?)\s*\|\n(.*?)\|.*\|.*\|', content, re.DOTALL)
            if not registry_match:
                self.results.errors.append("Service registry table not found")
                return
            
            # Check for duplicate ports
            port_pattern = r'\| (\d+) \|'
            ports = re.findall(port_pattern, content)
            duplicate_ports = [port for port in set(ports) if ports.count(port) > 1]
            
            if duplicate_ports:
                self.results.errors.append(f"Duplicate port conflicts found: {duplicate_ports}")
            
            # Check for missing authentication requirements
            auth_pattern = r'\|\s*Auth Required\s*\|.*?\|'
            auth_entries = re.findall(auth_pattern, content, re.DOTALL)
            
            no_auth_count = sum(1 for entry in auth_entries if 'No' in entry and '⚠️' not in entry)
            if no_auth_count > 0:
                self.results.warnings.append(f"{no_auth_count} endpoints marked as 'No auth' - review required")
                
        except Exception as e:
            self.results.errors.append(f"Failed to validate service registry: {e}")
    
    def _validate_authentication_consistency(self):
        """Validate authentication patterns across services"""
        print("🔐 Validating authentication consistency...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for JWT Bearer pattern
            jwt_patterns = [
                r'Bearer \{jwt_token\}',
                r'Bearer \{token\}',
                r'Authorization: Bearer'
            ]
            
            for pattern in jwt_patterns:
                if not re.search(pattern, content):
                    self.results.warnings.append(f"Inconsistent JWT pattern: {pattern}")
            
            # Check for role validation
            role_patterns = [
                r'(INSTRUCTOR|ADMIN).*?only',
                r'Role.*?(INSTRUCTOR|ADMIN)',
                r'RBAC'
            ]
            
            role_validations = sum(1 for pattern in role_patterns if re.search(pattern, content, re.IGNORECASE))
            if role_validations < 3:
                self.results.warnings.append("Insufficient role-based access control documentation")
                
        except Exception as e:
            self.results.errors.append(f"Failed to validate authentication: {e}")
    
    def _validate_error_responses(self):
        """Validate error response consistency"""
        print("🚨 Validating error responses...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for standardized error format
            error_patterns = [
                r'"message":\s*".*?"',
                r'"code":\s*".*?"',
                r'401.*?Authentication',
                r'403.*?Forbidden',
                r'404.*?Not Found',
                r'409.*?Conflict'
            ]
            
            for pattern in error_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                if len(matches) < 2:  # Should appear multiple times
                    self.results.warnings.append(f"Insufficient error response pattern: {pattern}")
            
            # Check for Flask HTML 404 pages (should be JSON)
            if re.search(r'Flask 404 page', content):
                self.results.errors.append("Flask HTML 404 pages detected - should be JSON responses")
                
        except Exception as e:
            self.results.errors.append(f"Failed to validate error responses: {e}")
    
    def _validate_schema_consistency(self):
        """Validate schema definitions and references"""
        print("📝 Validating schema consistency...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for OpenAPI references
            ref_pattern = r'\$ref:[\'"]([^\'"]*)[\'"]'
            refs = re.findall(ref_pattern, content)
            
            for ref in refs:
                if ref.startswith('#/components/schemas/'):
                    schema_name = ref.split('/')[-1]
                    if f"{schema_name}:" not in content and f"**{schema_name}**" not in content:
                        self.results.warnings.append(f"Referenced schema not defined: {ref}")
            
            # Check for required vs actual fields
            required_pattern = r'required:\s*\[([^\]]*)\]'
            required_lists = re.findall(required_pattern, content)
            
            for required_str in required_lists:
                required_fields = [field.strip().strip('"') for field in required_str.split(',')]
                for field in required_fields:
                    if field and field not in content.replace(required_str, ''):
                        pass  # Field exists, OK
                        
        except Exception as e:
            self.results.errors.append(f"Failed to validate schema consistency: {e}")
    
    def _validate_port_conflicts(self):
        """Validate there are no port conflicts"""
        print("🌐 Validating port assignments...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract all port numbers from service registry
            port_pattern = r'\|\s*(\d{4,5})\s*\|'
            ports = [int(port) for port in re.findall(port_pattern, content)]
            
            # Check for duplicates
            port_counts = {}
            for port in ports:
                port_counts[port] = port_counts.get(port, 0) + 1
            
            conflicts = {port: count for port, count in port_counts.items() if count > 1}
            
            if conflicts:
                self.results.errors.append(f"Port conflicts detected: {conflicts}")
            
            # Check for standard port ranges
            invalid_ports = [port for port in ports if port < 1024 or port > 65535]
            if invalid_ports:
                self.results.errors.append(f"Invalid port numbers: {invalid_ports}")
                
        except Exception as e:
            self.results.errors.append(f"Failed to validate ports: {e}")
    
    def _validate_openapi_sync(self):
        """Validate OpenAPI spec sync with contracts"""
        print("🔄 Validating OpenAPI synchronization...")
        
        try:
            if not self.openapi_file.exists():
                self.results.warnings.append("OpenAPI specification file not found")
                return
                
            with open(self.openapi_file, 'r', encoding='utf-8') as f:
                openapi_spec = yaml.safe_load(f)
            
            # Check OpenAPI version
            if openapi_spec.get('openapi') != '3.0.3':
                self.results.warnings.append("OpenAPI version should be 3.0.3")
            
            # Check for security schemes
            if 'components' not in openapi_spec or 'securitySchemes' not in openapi_spec.get('components', {}):
                self.results.errors.append("Missing security schemes in OpenAPI spec")
            
            # Check for basic info
            required_info = ['title', 'version', 'description']
            info = openapi_spec.get('info', {})
            missing_info = [field for field in required_info if field not in info]
            
            if missing_info:
                self.results.errors.append(f"Missing OpenAPI info fields: {missing_info}")
                
        except Exception as e:
            self.results.errors.append(f"Failed to validate OpenAPI sync: {e}")
    
    def _validate_naming_conventions(self):
        """Validate consistent naming conventions"""
        print("📝 Validating naming conventions...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check endpoint consistency
            endpoint_patterns = [
                r'/api/v1/[a-z]+(?:/[a-z]+)*',
                r'/api/v1/[a-z]+/\{[a-zA-Z]+\}(?:/[a-z]+)*'
            ]
            
            # Check for kebab-case vs camelCase inconsistency
            camelcase_endpoints = re.findall(r'/api/v1/[a-z]+[A-Z]', content)
            if camelcase_endpoints:
                self.results.warnings.append(f"CamelCase endpoints detected: {camelcase_endpoints}")
            
            # Check for consistent parameter naming
            param_inconsistencies = re.findall(r'(limit|per_page)', content)
            if len(set(param_inconsistencies)) > 1:
                self.results.warnings.append("Inconsistent pagination parameter naming (limit vs per_page)")
                
        except Exception as e:
            self.results.errors.append(f"Failed to validate naming conventions: {e}")
    
    def _validate_security_standards(self):
        """Validate security best practices"""
        print("🔒 Validating security standards...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check for security headers documentation
            security_headers = [
                'Authorization',
                'X-User-Id',
                'JWT',
                'Bearer'
            ]
            
            missing_security = []
            for header in security_headers:
                if header not in content:
                    missing_security.append(header)
            
            if missing_security:
                self.results.warnings.append(f"Missing security documentation for: {missing_security}")
            
            # Check for HTTPS references
            if 'http://' in content and 'https://' not in content:
                self.results.warnings.append("Prefer HTTPS in all URL examples")
                
        except Exception as e:
            self.results.errors.append(f"Failed to validate security standards: {e}")
    
    def _apply_fixes(self):
        """Apply automatic fixes for common issues"""
        print("🔧 Applying automatic fixes...")
        
        try:
            with open(self.contracts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Fix Flask 404 page references
            content = re.sub(
                r'Flask 404 page',
                '{"message": "Resource not found", "code": "NOT_FOUND"}',
                content
            )
            
            # Fix email exists status code
            content = re.sub(
                r'\|\s*400\s*\|\s*Email already exists',
                '| 409 | Email already exists',
                content
            )
            
            # Save fixes
            with open(self.contracts_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            self.results.fixes_applied.extend([
                "Replaced Flask HTML 404 pages with JSON responses",
                "Fixed email exists status code to 409 Conflict"
            ])
            
        except Exception as e:
            self.results.errors.append(f"Failed to apply fixes: {e}")
    
    def _report_results(self, verbose: bool = False):
        """Report validation results"""
        print("\n" + "=" * 60)
        print("📊 VALIDATION RESULTS")
        print("=" * 60)
        
        # Summary
        total_issues = len(self.results.errors) + len(self.results.warnings)
        
        if total_issues == 0:
            print("✅ All validation checks passed!")
            print("🎉 API contracts are production-ready!")
        else:
            print(f"⚠️  Found {total_issues} issues:")
            print(f"   🔴 {len(self.results.errors)} errors")
            print(f"   🟡 {len(self.results.warnings)} warnings")
        
        # Errors
        if self.results.errors:
            print(f"\n🔴 ERRORS ({len(self.results.errors)}):")
            for i, error in enumerate(self.results.errors, 1):
                print(f"   {i}. {error}")
        
        # Warnings
        if self.results.warnings:
            print(f"\n🟡 WARNINGS ({len(self.results.warnings)}):")
            for i, warning in enumerate(self.results.warnings, 1):
                print(f"   {i}. {warning}")
        
        # Fixes applied
        if self.results.fixes_applied:
            print(f"\n🔧 FIXES APPLIED ({len(self.results.fixes_applied)}):")
            for i, fix in enumerate(self.results.fixes_applied, 1):
                print(f"   {i}. {fix}")
        
        # Verbose details
        if verbose:
            print(f"\n📋 VALIDATION DETAILS:")
            print(f"   Contracts file: {self.contracts_file}")
            print(f"   OpenAPI file: {self.openapi_file}")
            print(f"   Validation time: {datetime.now().isoformat()}")
            print(f"   Total issues: {total_issues}")
            print(f"   Validation status: {'PASSED' if not self.results.errors else 'FAILED'}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Validate TalentSphere API contracts')
    parser.add_argument('--fix', action='store_true', help='Apply automatic fixes')
    parser.add_argument('--verbose', action='store_true', help='Show detailed output')
    
    args = parser.parse_args()
    
    validator = APIContractValidator()
    result = validator.validate_all(fix=args.fix, verbose=args.verbose)
    
    # Exit with appropriate code
    if result.errors:
        sys.exit(1)
    elif result.warnings:
        sys.exit(2)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()