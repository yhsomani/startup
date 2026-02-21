#!/bin/bash

# TalentSphere Database Migration Script
# This script runs all pending database migrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable is not set"
        print_error "Please set your database connection string:"
        print_error "export DATABASE_URL=\"postgresql://username:password@localhost:5432/database_name\""
        exit 1
    fi
    
    print_success "Environment variables check passed"
}

# Check if database is accessible
check_database_connection() {
    print_status "Checking database connection..."
    
    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "Cannot connect to database using DATABASE_URL"
        print_error "Please verify your database connection string"
        exit 1
    fi
    
    print_success "Database connection successful"
}

# Check if Node.js and required packages are available
check_node_dependencies() {
    print_status "Checking Node.js dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi
    
    if [ ! -f "scripts/migrate-database.js" ]; then
        print_error "Migration script not found at scripts/migrate-database.js"
        exit 1
    fi
    
    print_success "Node.js dependencies check passed"
}

# Show migration status
show_status() {
    print_status "Current migration status:"
    node scripts/migrate-database.js status
}

# Run migrations
run_migrations() {
    print_status "Starting database migration..."
    
    # Run the migration runner
    if node scripts/migrate-database.js migrate; then
        print_success "Database migration completed successfully"
    else
        print_error "Database migration failed"
        exit 1
    fi
}

# Create backup before migration (optional)
create_backup() {
    if [ "$1" = "--backup" ]; then
        print_status "Creating database backup..."
        
        # Extract database name from DATABASE_URL
        DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
        BACKUP_FILE="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
        
        if pg_dump "$DATABASE_URL" > "$BACKUP_FILE"; then
            print_success "Backup created: $BACKUP_FILE"
        else
            print_warning "Backup failed, continuing with migration..."
        fi
    fi
}

# Main execution
main() {
    print_status "🚀 TalentSphere Database Migration Started"
    echo ""
    
    # Parse command line arguments
    COMMAND=${1:-"status"}
    
    case "$COMMAND" in
        "migrate"|"up")
            check_environment
            check_database_connection
            check_node_dependencies
            create_backup "$2"
            run_migrations
            ;;
            
        "status")
            check_environment
            check_database_connection
            check_node_dependencies
            show_status
            ;;
            
        "help"|"-h"|"--help")
            echo ""
            echo "🎯 TalentSphere Database Migration Tool"
            echo ""
            echo "Usage:"
            echo "  $0 [COMMAND] [OPTIONS]"
            echo ""
            echo "Commands:"
            echo "  migrate, up     Run pending migrations"
            echo "  status          Show current migration status"
            echo "  help            Show this help message"
            echo ""
            echo "Options:"
            echo "  --backup       Create database backup before migration"
            echo ""
            echo "Environment Variables:"
            echo "  DATABASE_URL    PostgreSQL connection string (required)"
            echo ""
            echo "Examples:"
            echo "  DATABASE_URL=\"postgresql://user:pass@localhost:5432/talentsphere\" $0 status"
            echo "  DATABASE_URL=\"postgresql://user:pass@localhost:5432/talentsphere\" $0 migrate"
            echo "  DATABASE_URL=\"postgresql://user:pass@localhost:5432/talentsphere\" $0 migrate --backup"
            echo ""
            ;;
            
        *)
            print_error "Unknown command: $COMMAND"
            print_status "Use '$0 help' to see available commands"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "🎉 Migration script completed"
}

# Run main function with all arguments
main "$@"