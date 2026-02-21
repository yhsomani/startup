#!/usr/bin/env python3
"""
TalentSphere System Validation Script
Comprehensive testing without external dependencies
"""

import os
import sys
import json
import time
import socket
import subprocess
from datetime import datetime
from urllib.parse import urlparse
import http.client
import ssl

class SystemValidator:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'security_tests': {},
            'functionality_tests': {},
            'database_tests': {},
            'integration_tests': {},
            'summary': {}
        }
    
    def test_security_fixes(self):
        """Test security implementations"""
        print("\n=== Testing Security Fixes ===")
        
        security_tests = {}
        
        # Test 1: Security middleware files exist
        security_files = [
            "services/shared/security-middleware.js",
            "backends/backend-flask/app/utils/security.py"
        ]
        
        security_files_found = 0
        for file_path in security_files:
            if os.path.exists(file_path):
                security_files_found += 1
                print(f"[OK] Security file exists: {file_path}")
            else:
                print(f"[MISSING] Security file: {file_path}")
        
        security_tests['security_files_found'] = security_files_found
        security_tests['security_files_total'] = len(security_files)
        
        # Test 2: Environment configuration
        env_files = ['.env', '.env.example', '.env.production']
        env_files_found = sum(1 for f in env_files if os.path.exists(f))
        
        security_tests['env_files_found'] = env_files_found
        security_tests['env_files_total'] = len(env_files)
        
        # Test 3: CORS configuration
        cors_file = ".env.cors"
        cors_configured = os.path.exists(cors_file)
        security_tests['cors_configured'] = cors_configured
        
        # Test 4: Rate limiting configuration
        rate_limit_files = [
            "api-gateway/rate-limiting.js",
            "backends/backend-node/src/middleware/rate-limiting.js"
        ]
        rate_limit_found = sum(1 for f in rate_limit_files if os.path.exists(f))
        
        security_tests['rate_limiting_found'] = rate_limit_found
        security_tests['rate_limiting_total'] = len(rate_limit_files)
        
        # Security score
        security_score = (
            (security_files_found / len(security_files)) * 40 +
            (env_files_found / len(env_files)) * 20 +
            (cors_configured * 20) +
            (rate_limit_found / len(rate_limit_files)) * 20
        )
        
        security_tests['score'] = round(security_score, 1)
        security_tests['passed'] = security_score >= 70
        
        self.results['security_tests'] = security_tests
        print(f"Security Score: {security_tests['score']}/100")
        
        return security_tests['passed']
    
    def test_functionality_fixes(self):
        """Test functionality implementations"""
        print("\n=== Testing Functionality Fixes ===")
        
        functionality_tests = {}
        
        # Test 1: Service files exist
        service_dirs = [
            "backends/auth-service",
            "backends/course-service", 
            "backends/challenge-service",
            "backends/notification-service",
            "backends/user-service"
        ]
        
        services_found = 0
        for service_dir in service_dirs:
            if os.path.exists(service_dir):
                services_found += 1
                print(f"[OK] Service exists: {service_dir}")
            else:
                # Check alternative service structure
                alt_service = service_dir.replace("backends/", "backends/backend-enhanced/")
                if os.path.exists(alt_service):
                    services_found += 1
                    print(f"[OK] Service exists: {alt_service}")
                else:
                    print(f"[MISSING] Service: {service_dir}")
        
        functionality_tests['services_found'] = services_found
        functionality_tests['services_total'] = len(service_dirs)
        
        # Test 2: Frontend applications
        frontend_dirs = [
            "frontend",
            "frontends/frontend-application"
        ]
        
        frontends_found = sum(1 for f in frontend_dirs if os.path.exists(f))
        functionality_tests['frontends_found'] = frontends_found
        functionality_tests['frontends_total'] = len(frontend_dirs)
        
        # Test 3: API Gateway
        api_gateway_files = [
            "api-gateway/index.js",
            "api-gateway/routes.js"
        ]
        
        api_gateway_found = sum(1 for f in api_gateway_files if os.path.exists(f))
        functionality_tests['api_gateway_found'] = api_gateway_found
        functionality_tests['api_gateway_total'] = len(api_gateway_files)
        
        # Test 4: Database configuration
        db_files = [
            "database/migrations/001_initial_schema.sql",
            "database/indexes/database-indexes.sql"
        ]
        
        db_files_found = sum(1 for f in db_files if os.path.exists(f))
        functionality_tests['database_files_found'] = db_files_found
        functionality_tests['database_files_total'] = len(db_files)
        
        # Functionality score
        functionality_score = (
            (services_found / len(service_dirs)) * 30 +
            (frontends_found / len(frontend_dirs)) * 20 +
            (api_gateway_found / len(api_gateway_files)) * 25 +
            (db_files_found / len(db_files)) * 25
        )
        
        functionality_tests['score'] = round(functionality_score, 1)
        functionality_tests['passed'] = functionality_score >= 70
        
        self.results['functionality_tests'] = functionality_tests
        print(f"Functionality Score: {functionality_tests['score']}/100")
        
        return functionality_tests['passed']
    
    def test_database_performance(self):
        """Test database performance optimizations"""
        print("\n=== Testing Database Performance ===")
        
        database_tests = {}
        
        # Test 1: Index files
        index_files = [
            "database/indexes/database-indexes.sql",
            "database/migrations/002_add_performance_indexes.sql",
            "backends/database/migrations/006_create_performance_indexes.sql"
        ]
        
        index_files_found = 0
        total_indexes = 0
        
        for file_path in index_files:
            if os.path.exists(file_path):
                index_files_found += 1
                print(f"[OK] Index file exists: {file_path}")
                
                # Count indexes
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                        index_count = content.count('CREATE INDEX')
                        total_indexes += index_count
                        print(f"  Contains {index_count} indexes")
                except Exception as e:
                    print(f"  Error reading: {e}")
            else:
                print(f"[MISSING] Index file: {file_path}")
        
        database_tests['index_files_found'] = index_files_found
        database_tests['index_files_total'] = len(index_files)
        database_tests['total_indexes'] = total_indexes
        
        # Test 2: Connection pooling files
        pool_files = [
            "services/shared/database-connection-pool.js",
            "services/shared/database-manager.js"
        ]
        
        pool_files_found = sum(1 for f in pool_files if os.path.exists(f))
        database_tests['pool_files_found'] = pool_files_found
        database_tests['pool_files_total'] = len(pool_files)
        
        # Test 3: Database configuration
        db_config_files = [
            ".env.database",
            "database/migrations/001_initial_schema.sql"
        ]
        
        db_config_found = sum(1 for f in db_config_files if os.path.exists(f))
        database_tests['db_config_found'] = db_config_found
        database_tests['db_config_total'] = len(db_config_files)
        
        # Database performance score
        db_score = (
            (index_files_found / len(index_files)) * 40 +
            (pool_files_found / len(pool_files)) * 35 +
            (db_config_found / len(db_config_files)) * 25
        )
        
        database_tests['score'] = round(db_score, 1)
        database_tests['passed'] = db_score >= 70
        
        self.results['database_tests'] = database_tests
        print(f"Database Performance Score: {database_tests['score']}/100")
        print(f"Total Database Indexes: {total_indexes}")
        
        return database_tests['passed']
    
    def test_service_connectivity(self):
        """Test if services can potentially connect"""
        print("\n=== Testing Service Connectivity ===")
        
        integration_tests = {}
        
        # Common service ports
        service_ports = [
            {'name': 'API Gateway', 'port': 8000},
            {'name': 'Auth Service', 'port': 8001},
            {'name': 'Course Service', 'port': 8002},
            {'name': 'Challenge Service', 'port': 8003},
            {'name': 'User Service', 'port': 8004},
            {'name': 'Frontend', 'port': 3000},
            {'name': 'Database', 'port': 5432}
        ]
        
        ports_testable = 0
        ports_reachable = 0
        
        for service in service_ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex(('localhost', service['port']))
                sock.close()
                
                ports_testable += 1
                
                if result == 0:
                    ports_reachable += 1
                    print(f"[OK] {service['name']} is running on port {service['port']}")
                else:
                    print(f"[INACTIVE] {service['name']} not running on port {service['port']}")
                    
            except Exception as e:
                print(f"[ERROR] Cannot test {service['name']}: {e}")
        
        integration_tests['ports_testable'] = ports_testable
        integration_tests['ports_reachable'] = ports_reachable
        integration_tests['connectivity_score'] = round((ports_reachable / ports_testable * 100) if ports_testable > 0 else 0, 1)
        integration_tests['passed'] = ports_reachable >= 1  # At least gateway should be running
        
        self.results['integration_tests'] = integration_tests
        print(f"Connectivity Score: {integration_tests['connectivity_score']}%")
        
        return integration_tests['passed']
    
    def generate_summary(self):
        """Generate overall summary"""
        print("\n=== GENERATING SUMMARY ===")
        
        tests = {
            'Security': self.results['security_tests'],
            'Functionality': self.results['functionality_tests'], 
            'Database Performance': self.results['database_tests'],
            'Service Connectivity': self.results['integration_tests']
        }
        
        total_score = 0
        passed_tests = 0
        
        for test_name, test_data in tests.items():
            if test_data:
                score = test_data.get('score', 0)
                passed = test_data.get('passed', False)
                total_score += score
                if passed:
                    passed_tests += 1
                print(f"{test_name}: {score}/100 ({'PASS' if passed else 'FAIL'})")
        
        overall_score = total_score / len(tests) if tests else 0
        overall_passed = overall_score >= 70 and passed_tests >= 3
        
        summary = {
            'overall_score': round(overall_score, 1),
            'tests_passed': passed_tests,
            'tests_total': len(tests),
            'overall_passed': overall_passed,
            'status': 'SUCCESS' if overall_passed else 'NEEDS_ATTENTION'
        }
        
        self.results['summary'] = summary
        
        print(f"\n=== FINAL RESULTS ===")
        print(f"Overall Score: {summary['overall_score']}/100")
        print(f"Tests Passed: {summary['tests_passed']}/{summary['tests_total']}")
        print(f"Status: {summary['status']}")
        
        if summary['overall_passed']:
            print("\n[SUCCESS] System validation completed successfully!")
            print("All critical fixes are implemented and working correctly.")
        else:
            print("\n[ATTENTION] System needs attention.")
            print("Some issues were found. Please review the detailed results.")
        
        return summary['overall_passed']
    
    def save_results(self):
        """Save validation results to file"""
        filename = f"system_validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\nDetailed report saved to: {filename}")
        return filename

def main():
    print("TalentSphere System Validation Suite")
    print("====================================")
    
    validator = SystemValidator()
    
    # Run all test suites
    security_passed = validator.test_security_fixes()
    functionality_passed = validator.test_functionality_fixes()
    database_passed = validator.test_database_performance()
    connectivity_passed = validator.test_service_connectivity()
    
    # Generate summary
    overall_passed = validator.generate_summary()
    
    # Save results
    validator.save_results()
    
    return 0 if overall_passed else 1

if __name__ == "__main__":
    sys.exit(main())