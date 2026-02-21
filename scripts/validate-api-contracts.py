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
    1: Drift detected (use --fix to update)
    2: Error during validation
"""

import os
import re
import sys
import json
import argparse
import sys
import io

# Force UTF-8 for stdout and stderr to handle emojis on Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Set

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
API_CONTRACTS_PATH = PROJECT_ROOT / "API_CONTRACTS.md"
BACKENDS_PATH = PROJECT_ROOT / "backends"


@dataclass
class Endpoint:
    """Represents an API endpoint."""
    method: str
    path: str
    source_file: str
    line_number: Optional[int] = None
    auth_required: bool = False
    feature_flag: Optional[str] = None


@dataclass
class ValidationResult:
    """Results of validation."""
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    info: List[str] = field(default_factory=list)
    endpoints_documented: int = 0
    endpoints_in_code: int = 0


class APIContractValidator:
    """Validates API contracts against codebase."""

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.result = ValidationResult()
        self.documented_endpoints: Set[str] = set()
        self.code_endpoints: Set[str] = set()

    def log(self, message: str, level: str = "INFO"):
        """Log a message."""
        if self.verbose or level != "INFO":
            print(f"[{level}] {message}")

    def extract_flask_routes(self, file_path: Path) -> List[Endpoint]:
        """Extract Flask routes from a Python file."""
        endpoints = []
        if not file_path.exists():
            return endpoints

        content = file_path.read_text(encoding='utf-8')
        
        # Pattern for Flask routes: @bp.route('/path', methods=['GET'])
        route_pattern = r"@\w+(?:_bp)?\.route\(['\"]([^'\"]*)['\"](?:,\s*methods=\[([^\]]+)\])?\)"
        
        for match in re.finditer(route_pattern, content):
            path = match.group(1)
            methods = match.group(2) if match.group(2) else "'GET'"
            
            # Parse methods
            method_list = re.findall(r"'(\w+)'", methods)
            if not method_list:
                method_list = ['GET']
            
            for method in method_list:
                endpoints.append(Endpoint(
                    method=method.upper(),
                    path=path,
                    source_file=str(file_path.relative_to(PROJECT_ROOT)),
                    line_number=content[:match.start()].count('\n') + 1
                ))
        
        return endpoints

    def extract_springboot_routes(self, file_path: Path) -> List[Endpoint]:
        """Extract Spring Boot routes from a Java file."""
        endpoints = []
        if not file_path.exists():
            return endpoints

        content = file_path.read_text(encoding='utf-8')
        
        # Get base RequestMapping
        base_mapping = ""
        base_match = re.search(r'@RequestMapping\(["\']([^"\']+)["\']\)', content)
        if base_match:
            base_mapping = base_match.group(1)
        
        # Pattern for method mappings
        mapping_patterns = [
            (r'@GetMapping\(["\']?([^"\')\s]*)["\']\)', 'GET'),
            (r'@PostMapping\(["\']?([^"\')\s]*)["\']\)', 'POST'),
            (r'@PutMapping\(["\']?([^"\')\s]*)["\']\)', 'PUT'),
            (r'@DeleteMapping\(["\']?([^"\')\s]*)["\']\)', 'DELETE'),
            (r'@GetMapping\s*$', 'GET'),
            (r'@PostMapping\s*$', 'POST'),
        ]
        
        for pattern, method in mapping_patterns:
            for match in re.finditer(pattern, content, re.MULTILINE):
                path = match.group(1) if match.lastindex else ""
                full_path = f"{base_mapping}{path}".replace("//", "/")
                
                endpoints.append(Endpoint(
                    method=method,
                    path=full_path,
                    source_file=str(file_path.relative_to(PROJECT_ROOT)),
                    line_number=content[:match.start()].count('\n') + 1
                ))
        
        return endpoints

    def extract_dotnet_routes(self, file_path: Path) -> List[Endpoint]:
        """Extract .NET routes from a C# file."""
        endpoints = []
        if not file_path.exists():
            return endpoints

        content = file_path.read_text(encoding='utf-8')
        
        # Get base Route
        base_route = ""
        base_match = re.search(r'\[Route\(["\']([^"\']+)["\']\)\]', content)
        if base_match:
            base_route = base_match.group(1)
        
        # Pattern for HTTP methods
        method_patterns = [
            (r'\[HttpGet\(["\']?([^"\')\s]*)["\']\)', 'GET'),
            (r'\[HttpPost\(["\']?([^"\')\s]*)["\']\)', 'POST'),
            (r'\[HttpPut\(["\']?([^"\')\s]*)["\']\)', 'PUT'),
            (r'\[HttpDelete\(["\']?([^"\')\s]*)["\']\)', 'DELETE'),
            (r'\[HttpGet\]', 'GET'),
            (r'\[HttpPost\]', 'POST'),
        ]
        
        for pattern, method in method_patterns:
            for match in re.finditer(pattern, content):
                path = match.group(1) if match.lastindex and match.group(1) else ""
                full_path = f"/api/v1/{base_route}/{path}".replace("//", "/").rstrip("/")
                
                endpoints.append(Endpoint(
                    method=method,
                    path=full_path,
                    source_file=str(file_path.relative_to(PROJECT_ROOT)),
                    line_number=content[:match.start()].count('\n') + 1
                ))
        
        return endpoints

    def extract_documented_endpoints(self) -> Set[str]:
        """Extract endpoints documented in API_CONTRACTS.md."""
        endpoints = set()
        
        if not API_CONTRACTS_PATH.exists():
            self.result.errors.append(f"API_CONTRACTS.md not found at {API_CONTRACTS_PATH}")
            return endpoints

        content = API_CONTRACTS_PATH.read_text(encoding='utf-8')
        
        # Pattern: | **Endpoint** | `METHOD /path` |
        pattern = r'\| \*\*Endpoint\*\* \| `(\w+) ([^`]+)` \|'
        
        for match in re.finditer(pattern, content):
            method = match.group(1)
            path = match.group(2)
            endpoints.add(f"{method} {path}")
            
        return endpoints

    def extract_code_endpoints(self) -> Set[str]:
        """Extract all endpoints from codebase."""
        endpoints = set()
        
        # Flask backends
        flask_services = [
            BACKENDS_PATH / "backend-flask" / "app",
            BACKENDS_PATH / "backend-assistant",
            BACKENDS_PATH / "backend-recruitment",
            BACKENDS_PATH / "backend-gamification",
        ]
        
        for service_path in flask_services:
            if service_path.exists():
                for py_file in service_path.rglob("*.py"):
                    for ep in self.extract_flask_routes(py_file):
                        path = ep.path
                        if "backend-flask" in str(service_path):
                            # Add prefixes based on blueprint/folder
                            if "auth" in str(py_file): path = f"/api/v1/auth{path}"
                            elif "courses" in str(py_file): path = f"/api/v1/courses{path}"
                            elif "progress" in str(py_file): path = f"/api/v1/enrollments{path}"
                            elif "challenges" in str(py_file): path = f"/api/v1/challenges{path}"
                        
                        # Normalize double slashes
                        path = path.replace("//", "/")
                        endpoints.add(f"{ep.method} {path}")
        
        # Spring Boot
        springboot_path = BACKENDS_PATH / "backend-springboot" / "src" / "main" / "java"
        if springboot_path.exists():
            for java_file in springboot_path.rglob("*Controller.java"):
                for ep in self.extract_springboot_routes(java_file):
                    endpoints.add(f"{ep.method} {ep.path}")
        
        # .NET
        dotnet_path = BACKENDS_PATH / "backend-dotnet" / "Controllers"
        if dotnet_path.exists():
            for cs_file in dotnet_path.rglob("*.cs"):
                for ep in self.extract_dotnet_routes(cs_file):
                    endpoints.add(f"{ep.method} {ep.path}")
        
        return endpoints

    def validate(self) -> ValidationResult:
        """Run validation."""
        self.log("Starting API contract validation...")
        
        # Extract endpoints
        self.documented_endpoints = self.extract_documented_endpoints()
        self.code_endpoints = self.extract_code_endpoints()
        
        self.result.endpoints_documented = len(self.documented_endpoints)
        self.result.endpoints_in_code = len(self.code_endpoints)
        
        self.log(f"Found {self.result.endpoints_documented} documented endpoints")
        self.log(f"Found {self.result.endpoints_in_code} endpoints in code")
        
        # Check for undocumented endpoints (in code but not documented)
        undocumented = self.code_endpoints - self.documented_endpoints
        for ep in sorted(undocumented):
            self.result.warnings.append(f"Undocumented endpoint: {ep}")
        
        # Check for orphaned documentation (documented but not in code)
        orphaned = self.documented_endpoints - self.code_endpoints
        for ep in sorted(orphaned):
            # Some endpoints have path params that don't match exactly
            if not any(self._path_matches(ep, code_ep) for code_ep in self.code_endpoints):
                self.result.warnings.append(f"Documented but not found in code: {ep}")
        
        # Validate file existence
        self._validate_source_files()
        
        return self.result

    def _path_matches(self, doc_path: str, code_path: str) -> bool:
        """Check if paths match, accounting for path parameters."""
        # Normalize path parameters
        doc_normalized = re.sub(r'\{[^}]+\}', '{param}', doc_path)
        code_normalized = re.sub(r'<[^>]+>', '{param}', code_path)
        code_normalized = re.sub(r'\{[^}]+\}', '{param}', code_normalized)
        return doc_normalized == code_normalized

    def _validate_source_files(self):
        """Validate that referenced source files exist."""
        content = API_CONTRACTS_PATH.read_text(encoding='utf-8')
        
        # Pattern: | **Source** | `file.py:lines` |
        pattern = r'\| \*\*Source\*\* \| `([^:]+):?'
        
        for match in re.finditer(pattern, content):
            source_file = match.group(1)
            # Skip if it's a relative path reference
            if "/" not in source_file:
                continue
            
            full_path = PROJECT_ROOT / source_file
            if not full_path.exists():
                self.result.warnings.append(f"Source file not found: {source_file}")


def main():
    parser = argparse.ArgumentParser(description="Validate API contracts")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--fix", action="store_true", help="Attempt to fix issues (future feature)")
    args = parser.parse_args()

    validator = APIContractValidator(verbose=args.verbose)
    result = validator.validate()

    # Print results
    print("\n" + "=" * 60)
    print("API CONTRACT VALIDATION REPORT")
    print("=" * 60)
    
    print(f"\n📊 Summary:")
    print(f"   Documented endpoints: {result.endpoints_documented}")
    print(f"   Endpoints in code: {result.endpoints_in_code}")
    
    if result.errors:
        print(f"\n❌ Errors ({len(result.errors)}):")
        for error in result.errors:
            print(f"   - {error}")
    
    if result.warnings:
        print(f"\n⚠️ Warnings ({len(result.warnings)}):")
        for warning in result.warnings[:20]:  # Limit output
            print(f"   - {warning}")
        if len(result.warnings) > 20:
            print(f"   ... and {len(result.warnings) - 20} more")
    
    if result.info:
        print(f"\nℹ️ Info ({len(result.info)}):")
        for info in result.info:
            print(f"   - {info}")
    
    # Exit code
    if result.errors:
        print("\n❌ VALIDATION FAILED")
        sys.exit(1)
    elif result.warnings:
        print("\n⚠️ VALIDATION PASSED WITH WARNINGS")
        sys.exit(0)
    else:
        print("\n✅ VALIDATION PASSED")
        sys.exit(0)


if __name__ == "__main__":
    main()
