"""
TalentSphere Database Optimization Scripts

This module provides comprehensive database optimization and management tools.
"""

import os
import logging
import time
from datetime import datetime, timedelta
from sqlalchemy import text, Index
from sqlalchemy import inspect
from app.models import db, User, Course, Challenge, Submission
from app import create_app
from flask import current_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseOptimizer:
    def __init__(self, app=None):
        self.app = app or create_app()
        self.session = self.app.extensions['sqlalchemy'].create_scoped_session()
        
    def analyze_slow_queries(self, threshold_ms=100):
        """Identify slow queries from query logs"""
        slow_queries = []
        total_slow_time = 0
        query_count = 0
        
        start_time = time.time()
        
        with self.session as session:
            try:
                # Enable query performance monitoring
                session.connection.configure(logging_name='sqlalchemy.dialects.postgresql.pysql')
                
                # Query all registered models
                models_to_inspect = [User, Course, Challenge, Submission]
                
                for model in models_to_inspect:
                    try:
                        # Check for missing indexes
                        inspector = inspect(model)
                        columns = [column.name for column in inspector.columns]
                        missing_indexes = []
                        
                        for column in columns:
                            # Check if index exists for commonly filtered columns
                            if column.index is None and column.name in ['user_id', 'challenge_id', 'created_at', 'updated_at', 'course_id']:
                                missing_indexes.append(f"table {model.__tablename__} - column {column.name}")
                        
                        if missing_indexes:
                            logger.info(f"⚠️ Missing index for {model.__tablename__}.{column.name}")
                        
                except Exception as e:
                    logger.error(f"Error analyzing {model.__tablename__}: {str(e)}")
        
                query_count += len(session.execute(text('SELECT sql_identifier() FROM pg_stat_activity WHERE calls >= 0 AND calls <= 100').fetchall())
        
        total_slow_time = time.time() - start_time
        
        avg_query_time = total_slow_time / query_count if query_count > 0 else 0
        
        slow_query_threshold = threshold_ms / 1000
        
        # Log slow queries
        with self.session as session:
            slow_query_events = session.execute(text("""
                SELECT query, mean_time, calls
                FROM pg_stat_statements 
                WHERE query LIKE '%SELECT%'
                ORDER BY mean_time DESC
                LIMIT 10
            """))
            
            for event in slow_query_events:
                if event.mean_time > slow_query_threshold:
                    slow_queries.append({
                        'query': event.query,
                        'time': event.mean_time,
                        'calls': event.calls,
                        'timestamp': event.timestamp
                    })
        
        if slow_queries:
            logger.warning(f"⚠️ Found {len(slow_queries)} slow queries (> {threshold_ms}ms)")
            for query in slow_queries[:5]:
                logger.warning(f"Query: {query['query']}")
                logger.warning(f"  Time: {query['time']}ms, Calls: {query['calls']}")
        
        return {
            'slow_queries': slow_queries,
            'total_queries': query_count,
            'avg_query_time': avg_query_time,
            'slow_query_count': len(slow_queries)
            'threshold_ms': threshold_ms
        }

    def analyze_table_sizes(self):
        """Analyze table sizes and recommend optimizations"""
        table_stats = {}
        
        with self.session as session:
            # Get table sizes
            tables = session.execute("""
                SELECT 
                    schemaname, 
                    tablename,
                    pg_size_pretty,
                    pg_total_size,
                    pg_relation_size,
                    pg_total_size
                FROM information_schema.tables 
                ORDER BY pg_total_size DESC
            """))
            
            for table in tables:
                table_stats[table[1]] = {
                    'table_name': table[1],
                    'size_mb': table[2],
                    'row_count': table[3],
                    'index_count': len([idx for idx in inspect(table) if idx.name.startswith('idx_')])
                }
        
        return table_stats

    def suggest_indexes(self, table_stats, slow_queries):
        """Suggest database indexes based on analysis"""
        suggestions = []
        
        for table_name, stats in table_stats.items():
            # Recommend indexes for frequently queried tables
            if stats['row_count'] > 10000:
                # Check for large tables without indexes
                # Check commonly filtered fields
                if 'challenges' in table_name.lower():
                    challenge_inspector = inspect(Challenge)
                    challenge_columns = [col.name for col in challenge_inspector.columns]
                    
                    # Check for missing indexes on commonly searched columns
                    search_fields = ['challenge_id', 'user_id', 'created_at', 'language']
                    missing_search_indexes = []
                    
                    for col in challenge_columns:
                        if col.index is None and col.name in search_fields:
                            missing_search_indexes.append(f"Missing index on {table_name}.{col.name}")
                    
                    if stats['row_count'] > 10000:
                        suggestions.append(f"Add index on {table_name}.{col.name} for better query performance")
        
        return suggestions

    def optimize_database(self):
        """Run database optimizations"""
        logger.info("🔧 Starting database optimization...")
        
        # Stage 1: Analyze current performance
        logger.info("📊 Analyzing slow queries...")
        slow_analysis = self.analyze_slow_queries()
        
        logger.info("📊 Analyzing table sizes...")
        table_stats = self.analyze_table_sizes()
        
        # Stage 2: Implement optimizations
        logger.info("🔧 Implementing database optimizations...")
        
        optimizations_applied = 0
        
        # Optimization 1: Add missing indexes
        table_suggestions = self.suggest_indexes(table_stats, slow_analysis)
        if table_suggestions:
            logger.info(f"📈 Adding recommended indexes...")
            for suggestion in table_suggestions:
                try:
                    self.execute(f"CREATE INDEX IF NOT EXISTS {suggestion}")
                    optimizations_applied += 1
                    logger.info(f"✅ Created index: {suggestion}")
                except Exception as e:
                    logger.error(f"❌ Failed to create index: {suggestion}: {e}")
        
        # Optimization 2: Update statistics
        logger.info("📊 Updating database statistics...")
        
        # Create/update database statistics table
        self.session.execute("""
            CREATE TABLE IF NOT EXISTS db_stats (
                id SERIAL PRIMARY KEY,
                table_name VARCHAR(255) NOT NULL,
                analysis_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                total_records INTEGER DEFAULT 0,
                slow_queries_count INTEGER DEFAULT 0,
                avg_query_time DECIMAL(10,2) DEFAULT 0
            )
        """)
        
        optimizations_applied += optimizations_applied

        # Optimization 3: Update configurations
        logger.info("🔧 Applying configuration optimizations...")
        
        # Set connection pool size
        if hasattr(self.app.config, 'SQLALCHEMY_ENGINE_OPTIONS'):
            self.app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
                'pool_size': 20,
                'max_overflow': 30,
                'pool_timeout': 30,
                'pool_recycle': 3600,
                'pool_pre_ping': True,
                'pool_reset_on_return': 'fail'
            }
            logger.info("✅ Connection pool configured: 20 connections")

        return optimizations_applied

    def create_missing_indexes(self, suggestions):
        """Create missing database indexes"""
        created_count = 0
        
        for suggestion in suggestions:
            try:
                self.execute(suggestion)
                created_count += 1
                logger.info(f"✅ Created index: {suggestion}")
            except Exception as e:
                logger.error(f"❌ Failed to create index: {suggestion}: {e}")
        
        logger.info(f"🏆 Created {created_count} missing indexes")
        return created_count

    def update_statistics(self):
        """Update database performance statistics"""
        current_stats = self.analyze_slow_queries()
        
        # Update table statistics
        self.session.execute("""
            INSERT INTO db_stats (table_name, total_records, slow_queries_count, avg_query_time)
            VALUES 
                (
                    SELECT 
                        COUNT(*) as total_records,
                        AVG(mean_time) as avg_query_time
                    FROM (
                        SELECT sql_identifier() 
                        FROM pg_stat_statements 
                        WHERE query LIKE '%SELECT%'
                    ) AS subquery
                )
        """))
        
        logger.info("📊 Database statistics updated")

    def monitor_performance(self, interval=60):
        """Monitor database performance metrics"""
        while True:
            slow_queries = self.analyze_slow_queries()
            
            if slow_queries:
                logger.warning(f"🚨 {len(slow_queries)} slow queries detected")
            
            time.sleep(interval)

    def export_optimization_report(self):
        """Export optimization report"""
        # Create comprehensive performance report
        slow_analysis = self.analyze_slow_queries()
        table_stats = self.analyze_table_sizes()
        table_suggestions = self.suggest_indexes(table_stats, slow_analysis)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'slow_queries': slow_analysis['slow_queries'][:10],
            'avg_query_time': slow_analysis['avg_query_time'],
            'table_stats': table_stats,
            'table_suggestions': table_suggestions,
            'optimizations_applied': optimizations_applied
        }
        
        # Save report to file
        with open('optimization_report.json', 'w') as f:
            json.dump(report, indent=2)
        
        return report

# Create main optimization function
def main():
    """Run comprehensive database optimization"""
    app = create_app()
    
    with app.app_context():
        optimizer = DatabaseOptimizer(app)
        
        # Run optimization sequence
        optimizer.optimize_database()
        
        # Export report
        report = optimizer.export_optimization_report()
        logger.info("📊 Optimization complete. Report saved to optimization_report.json")

if __name__ == '__main__':
    main()