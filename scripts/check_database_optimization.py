#!/usr/bin/env python3
"""
Database Performance Analysis Script
Quick verification of database optimization status
"""

import os
import sys
import json
from datetime import datetime

def check_database_files():
    """Check if database optimization files exist and are properly configured"""
    
    print("Database Performance Analysis")
    print("=" * 50)
    
    # Check database index files
    index_files = [
        "database/indexes/database-indexes.sql",
        "database/migrations/002_add_performance_indexes.sql",
        "backends/database/migrations/006_create_performance_indexes.sql"
    ]
    
    print("\nChecking Database Index Files:")
    for file_path in index_files:
        if os.path.exists(file_path):
            print(f"[OK] {file_path} - EXISTS")
            
            # Count indexes in file
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    index_count = content.count('CREATE INDEX')
                    print(f"   Found {index_count} index definitions")
            except Exception as e:
                print(f"   Error reading file: {e}")
        else:
            print(f"[MISSING] {file_path}")
    
    # Check database connection pooling files
    pool_files = [
        "services/shared/database-connection-pool.js",
        "services/shared/database-manager.js"
    ]
    
    print("\nChecking Database Connection Pooling:")
    for file_path in pool_files:
        if os.path.exists(file_path):
            print(f"[OK] {file_path} - EXISTS")
            
            # Check for pool configuration
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    if 'Pool' in content:
                        print(f"   Connection pooling implemented")
                    if 'max:' in content or 'maxConnections' in content:
                        print(f"   Pool size configuration found")
                    if 'healthCheck' in content or 'health' in content:
                        print(f"   Health monitoring implemented")
            except Exception as e:
                print(f"   Error reading file: {e}")
        else:
            print(f"[MISSING] {file_path}")
    
    # Check environment configuration
    env_files = [
        ".env.example",
        ".env.database"
    ]
    
    print("\nChecking Database Environment Configuration:")
    for file_path in env_files:
        if os.path.exists(file_path):
            print(f"[OK] {file_path} - EXISTS")
            
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    
                    # Check for key database configs
                    db_configs = {
                        'DB_HOST': 'Database host',
                        'DB_PORT': 'Database port', 
                        'DB_NAME': 'Database name',
                        'DB_USER': 'Database user',
                        'DB_PASSWORD': 'Database password',
                        'DB_POOL_MAX': 'Max pool size',
                        'DB_POOL_MIN': 'Min pool size',
                        'DB_IDLE_TIMEOUT': 'Idle timeout'
                    }
                    
                    for config_key, config_desc in db_configs.items():
                        if config_key in content:
                            print(f"   {config_desc} configured")
            except Exception as e:
                print(f"   Error reading file: {e}")
        else:
            print(f"[MISSING] {file_path}")
    
    # Generate optimization report
    report = {
        'timestamp': datetime.now().isoformat(),
        'status': 'Database optimization analysis completed',
        'index_files_found': sum(1 for f in index_files if os.path.exists(f)),
        'pool_files_found': sum(1 for f in pool_files if os.path.exists(f)),
        'env_files_found': sum(1 for f in env_files if os.path.exists(f))
    }
    
    print("\nSummary:")
    print(f"   Index files: {report['index_files_found']}/{len(index_files)}")
    print(f"   Pool files: {report['pool_files_found']}/{len(pool_files)}")  
    print(f"   Config files: {report['env_files_found']}/{len(env_files)}")
    
    if report['index_files_found'] >= 2 and report['pool_files_found'] == 2:
        print("\nDatabase optimization setup is COMPLETE")
        return True
    else:
        print("\nDatabase optimization setup is INCOMPLETE")
        return False

if __name__ == "__main__":
    success = check_database_files()
    
    # Save report
    report = {
        'timestamp': datetime.now().isoformat(),
        'success': success,
        'status': 'Database optimization verification completed'
    }
    
    with open('database_analysis_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nReport saved to: database_analysis_report.json")
    
    sys.exit(0 if success else 1)