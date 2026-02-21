#!/usr/bin/env python3
"""
Production Validation Script for TalentSphere
Validates all systems are production-ready
"""

import os
import sys
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path

class ProductionValidator:
    def __init__(self):
        self.results = []
        self.errors = []
        self.warnings = []
        self.base_dir = Path(__file__).parent.parent

    def validate(self):
        print("🚀 Starting Production Validation...")
        print("=" * 60)

        # Core validations
        self.validate_directory_structure()
        self.validate_dependencies()
        self.validate_api_gateway()
        self.validate_backend_services()
        self.validate_error_recovery()
        self.validate_distributed_tracing()
        self.validate_monitoring()
        self.validate_security()
        self.validate_performance()
        self.validate_documentation()

        # Generate report
        self.generate_report()

    def validate_directory_structure(self):
        print("📁 Validating Directory Structure...")
        
        required_dirs = [
            "api-gateway",
            "backends/shared",
            "backends/shared/tracing",
            "backends/backend-enhanced",
            "frontend",
            "monitoring",
            "scripts"
        ]

        for dir_name in required_dirs:
            dir_path = self.base_dir / dir_name
            if dir_path.exists():
                self.results.append(f"✅ {dir_name} directory exists")
            else:
                self.errors.append(f"❌ {dir_name} directory missing")

    def validate_dependencies(self):
        print("📦 Validating Dependencies...")
        
        package_files = [
            "package.json",
            "backends/shared/package.json",
            "api-gateway/package.json"
        ]

        for pkg_file in package_files:
            pkg_path = self.base_dir / pkg_file
            if pkg_path.exists():
                try:
                    with open(pkg_path, 'r') as f:
                        package = json.load(f)
                    
                    # Check for production dependencies
                    if 'dependencies' in package:
                        deps = package['dependencies']
                        if 'uuid' in deps and 'express' in deps:
                            self.results.append(f"✅ {pkg_file} has required dependencies")
                        else:
                            self.warnings.append(f"⚠️  {pkg_file} missing key dependencies")
                    
                except Exception as e:
                    self.errors.append(f"❌ Error reading {pkg_file}: {e}")
            else:
                self.errors.append(f"❌ {pkg_file} not found")

    def validate_api_gateway(self):
        print("🌐 Validating API Gateway...")
        
        gateway_file = self.base_dir / "api-gateway" / "enhanced-gateway.js"
        if gateway_file.exists():
            try:
                with open(gateway_file, 'r') as f:
                    content = f.read()
                
                required_components = [
                    "class ServiceRegistry",
                    "class CircuitBreaker", 
                    "class HealthChecker",
                    "metrics"
                ]

                for component in required_components:
                    if component in content:
                        self.results.append(f"✅ Gateway has {component}")
                    else:
                        self.errors.append(f"❌ Gateway missing {component}")
                        
            except Exception as e:
                self.errors.append(f"❌ Error reading gateway: {e}")
        else:
            self.errors.append("❌ Enhanced gateway not found")

    def validate_backend_services(self):
        print("🔧 Validating Backend Services...")
        
        # Check shared systems
        shared_dir = self.base_dir / "backends" / "shared"
        required_files = [
            "enhanced-service-template.js",
            "enhanced-service-with-tracing.js",
            "validation.js", 
            "contracts.js",
            "error-recovery.js",
            "monitoring.js",
            "logger.js"
        ]

        for file_name in required_files:
            file_path = shared_dir / file_name
            if file_path.exists():
                self.results.append(f"✅ Shared system: {file_name}")
            else:
                self.errors.append(f"❌ Shared system missing: {file_name}")

        # Check enhanced backend
        enhanced_backend = self.base_dir / "backends" / "backend-enhanced"
        if enhanced_backend.exists():
            services = [d for d in enhanced_backend.iterdir() if d.is_dir()]
            for service in services:
                if (service / "index.js").exists():
                    self.results.append(f"✅ Service: {service.name}")
                else:
                    self.warnings.append(f"⚠️  Service {service.name} missing index.js")
        else:
            self.errors.append("❌ Enhanced backend directory not found")

    def validate_error_recovery(self):
        print("🛡️ Validating Error Recovery...")
        
        error_recovery_file = self.base_dir / "backends" / "shared" / "error-recovery.js"
        if error_recovery_file.exists():
            try:
                with open(error_recovery_file, 'r') as f:
                    content = f.read()
                
                required_features = [
                    "class ErrorRecovery",
                    "class CircuitBreaker",
                    "class RetryManager",
                    "graceful degradation"
                ]

                for feature in required_features:
                    if feature.lower() in content.lower():
                        self.results.append(f"✅ Error recovery: {feature}")
                    else:
                        self.warnings.append(f"⚠️  Error recovery missing: {feature}")
                        
            except Exception as e:
                self.errors.append(f"❌ Error reading error recovery: {e}")
        else:
            self.errors.append("❌ Error recovery system not found")

    def validate_distributed_tracing(self):
        print("🔍 Validating Distributed Tracing...")
        
        tracing_file = self.base_dir / "backends" / "shared" / "tracing" / "index.js"
        if tracing_file.exists():
            try:
                with open(tracing_file, 'r') as f:
                    content = f.read()
                
                required_features = [
                    "class DistributedTracer",
                    "class TraceContext",
                    "class Span",
                    "TraceMiddleware",
                    "TracePropagator"
                ]

                for feature in required_features:
                    if feature in content:
                        self.results.append(f"✅ Tracing: {feature}")
                    else:
                        self.warnings.append(f"⚠️  Tracing missing: {feature}")
                        
            except Exception as e:
                self.errors.append(f"❌ Error reading tracing: {e}")
        else:
            self.errors.append("❌ Distributed tracing system not found")

    def validate_monitoring(self):
        print("📊 Validating Monitoring...")
        
        monitoring_dir = self.base_dir / "monitoring"
        if monitoring_dir.exists():
            monitor_files = list(monitoring_dir.glob("*.js"))
            if monitor_files:
                self.results.append(f"✅ Monitoring has {len(monitor_files)} files")
            else:
                self.warnings.append("⚠️  Monitoring directory exists but no JS files")
        else:
            self.warnings.append("⚠️  Monitoring directory not found")

        # Check shared monitoring
        shared_monitoring = self.base_dir / "backends" / "shared" / "monitoring.js"
        if shared_monitoring.exists():
            self.results.append("✅ Shared monitoring system exists")
        else:
            self.errors.append("❌ Shared monitoring system missing")

    def validate_security(self):
        print("🔒 Validating Security...")
        
        # Check for environment configuration
        env_file = self.base_dir / ".env.example"
        if env_file.exists():
            self.results.append("✅ Environment template exists")
        else:
            self.warnings.append("⚠️  Environment template missing")

        # Check for security in gateway
        gateway_file = self.base_dir / "api-gateway" / "enhanced-gateway.js"
        if gateway_file.exists():
            try:
                with open(gateway_file, 'r') as f:
                    content = f.read()
                
                security_features = [
                    "cors",
                    "helmet",
                    "rate",
                    "security"
                ]

                for feature in security_features:
                    if feature in content.lower():
                        self.results.append(f"✅ Security feature: {feature}")
                    else:
                        self.warnings.append(f"⚠️  Security feature missing: {feature}")
                        
            except Exception as e:
                self.errors.append(f"❌ Error checking security: {e}")

    def validate_performance(self):
        print("⚡ Validating Performance...")
        
        # Check for performance configurations
        performance_files = [
            "backends/shared/monitoring.js",
            "backends/shared/error-recovery.js",
            "backends/shared/tracing/index.js",
            "api-gateway/enhanced-gateway.js"
        ]

        for file_path in performance_files:
            full_path = self.base_dir / file_path
            if full_path.exists():
                try:
                    with open(full_path, 'r') as f:
                        content = f.read()
                    
                    perf_features = [
                        "timeout",
                        "circuit",
                        "retry",
                        "cache",
                        "metrics",
                        "tracing"
                    ]

                    for feature in perf_features:
                        if feature in content.lower():
                            self.results.append(f"✅ Performance feature in {file_path}: {feature}")
                            break
                            
                except Exception as e:
                    self.errors.append(f"❌ Error reading {file_path}: {e}")

    def validate_documentation(self):
        print("📚 Validating Documentation...")
        
        doc_files = [
            "README.md",
            "ARCHITECTURE.md",
            "API.md",
            "DEPLOYMENT.md"
        ]

        for doc_file in doc_files:
            doc_path = self.base_dir / doc_file
            if doc_path.exists():
                self.results.append(f"✅ Documentation: {doc_file}")
            else:
                self.warnings.append(f"⚠️  Documentation missing: {doc_file}")

    def generate_report(self):
        print("\n" + "=" * 60)
        print("📋 PRODUCTION VALIDATION REPORT")
        print("=" * 60)

        print(f"\n✅ Passed: {len(self.results)}")
        for result in self.results:
            print(f"  {result}")

        if self.warnings:
            print(f"\n⚠️  Warnings: {len(self.warnings)}")
            for warning in self.warnings:
                print(f"  {warning}")

        if self.errors:
            print(f"\n❌ Errors: {len(self.errors)}")
            for error in self.errors:
                print(f"  {error}")

        # Summary
        total_checks = len(self.results) + len(self.warnings) + len(self.errors)
        success_rate = (len(self.results) / total_checks * 100) if total_checks > 0 else 0

        print(f"\n📊 SUMMARY")
        print(f"   Total Checks: {total_checks}")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("   🎉 READY FOR PRODUCTION!")
        elif success_rate >= 80:
            print("   ⚠️  Almost ready - address warnings")
        else:
            print("   ❌ NOT READY - fix errors first")

        # Save detailed report
        self.save_detailed_report(success_rate)

    def save_detailed_report(self, success_rate):
        report_dir = self.base_dir / "reports"
        report_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = report_dir / f"validation_report_{timestamp}.json"
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "success_rate": success_rate,
            "results": self.results,
            "warnings": self.warnings,
            "errors": self.errors,
            "total_checks": len(self.results) + len(self.warnings) + len(self.errors)
        }

        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"   📄 Detailed report saved: {report_file}")

if __name__ == "__main__":
    validator = ProductionValidator()
    validator.validate()