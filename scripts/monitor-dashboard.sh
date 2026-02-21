# TalentSphere Continuous Monitoring Dashboard
# Real-time monitoring and analytics for production

echo "📊 TALENTSPHERE MONITORING DASHBOARD"
echo "=================================="

# Database performance metrics
echo "🗄️ Database Performance:"
psql -h localhost -U talentphere_user -p 5432 -c "
    -c "
    -c "
SELECT 
        schemaname,
        tablename,
        indexname,
        num_rows,
        pages_tup,
        size_bytes,
        CASE WHEN size_bytes = 0 THEN 0 ELSE size_bytes / num_rows as numeric
    END as schema_size,
    AVG(
        CASE WHEN size_bytes = 0 THEN 0 ELSE size_bytes / num_rows as numeric
    END as avg_row_size
FROM pg_statio_all_user_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname, tablename, indexname
ORDER BY pages_tup DESC
LIMIT 20;" | \
    while IFS= read -r; do
        read -r row
        echo "  Table: $row | awk '{print $1 "." $2 "." $3}'"
        echo "  Size: $row | awk '{print $6}' | numfmt --to=iec | suffix=B'"
        echo "  Pages: $row | awk '{print $5}'"
        echo "  Avg Row Size: $row | awk '{print $8}' | numfmt --to=iec | suffix=B'"
        echo "  Schema Size: $row | awk '{print $4}' | numfmt --to=iec | suffix=B'"
    done

echo ""

# User engagement metrics
echo "👥 User Engagement Metrics:"
curl -s "https://api.talentsphere.com/analytics/engagement" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Accept: application/json" \
     -d '{
       "metric": "daily_active_users",
       "start_date": "'$(date -d '2024-01-01'\"'
     }' | \
     jq '.daily_active_users.active_users + .daily_new_users.new_users' | \
     awk 'BEGIN {printf "%.0f", $0; print "  Daily Active Users: ", $0 + $1, "  } END'

echo ""

# Performance metrics
echo "📈 System Performance Metrics:"
curl -s "https://monitor.talentsphere.com/metrics/current" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Accept: application/json" | \
     jq '.cpu_percentage + .memory_percentage + .disk_usage + .uptime + .response_time_avg'

echo ""

# Alert summary (last 24h)
echo "🚨 Alert Summary (24h):"
curl -s "https://monitor.talentsphere.com/alerts/summary" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Accept: application/json" | \
     jq '.total_alerts + .critical_alerts + .warning_alerts'

echo ""

# Top performance issues
echo "🔍 Top Performance Issues:"
curl -s "https://api.talentsphere.com/analytics/performance-issues" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Accept: application/json" | \
     jq '.issues[] | .[] | sort_by(.response_time_p95) | .[0:3]' | \
     head -10

echo ""
echo "📊 TALENTSPHERE MONITORING ACTIVE"
echo "=================================="