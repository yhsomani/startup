@echo off
REM TalentSphere Database Migration Script (Windows)
REM This script runs all pending database migrations

setlocal enabledelayedexpansion

REM Color codes for output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Function to print colored output (simplified for Windows)
:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Check if required environment variables are set
:check_environment
call :print_status "Checking environment variables..."

if "%DATABASE_URL%"=="" (
    call :print_error "DATABASE_URL environment variable is not set"
    call :print_error "Please set your database connection string:"
    call :print_error "set DATABASE_URL=postgresql://username:password@localhost:5432/database_name"
    exit /b 1
)

call :print_success "Environment variables check passed"
goto :eof

REM Check if database is accessible
:check_database_connection
call :print_status "Checking database connection..."

psql "%DATABASE_URL%" -c "SELECT 1;" >nul 2>&1
if !errorlevel! neq 0 (
    call :print_error "Cannot connect to database using DATABASE_URL"
    call :print_error "Please verify your database connection string"
    exit /b 1
)

call :print_success "Database connection successful"
goto :eof

REM Check if Node.js and required packages are available
:check_node_dependencies
call :print_status "Checking Node.js dependencies..."

node --version >nul 2>&1
if !errorlevel! neq 0 (
    call :print_error "Node.js is not installed or not in PATH"
    exit /b 1
)

if not exist "scripts\migrate-database.js" (
    call :print_error "Migration script not found at scripts\migrate-database.js"
    exit /b 1
)

call :print_success "Node.js dependencies check passed"
goto :eof

REM Show migration status
:show_status
call :print_status "Current migration status:"
node scripts\migrate-database.js status
goto :eof

REM Run migrations
:run_migrations
call :print_status "Starting database migration..."

REM Run the migration runner
node scripts\migrate-database.js migrate
if !errorlevel! neq 0 (
    call :print_error "Database migration failed"
    exit /b 1
)

call :print_success "Database migration completed successfully"
goto :eof

REM Main execution
:main
call :print_status "🚀 TalentSphere Database Migration Started"
echo.

set "COMMAND=%1"
if "%COMMAND%"=="" set "COMMAND=status"

if "%COMMAND%"=="migrate" goto :migrate
if "%COMMAND%"=="up" goto :migrate
if "%COMMAND%"=="status" goto :status
if "%COMMAND%"=="help" goto :help
if "%COMMAND%"=="-h" goto :help
if "%COMMAND%"=="--help" goto :help

call :print_error "Unknown command: %COMMAND%"
call :print_status "Use '%0 help' to see available commands"
exit /b 1

:migrate
call :check_environment
call :check_database_connection
call :check_node_dependencies
call :run_migrations
goto :end

:status
call :check_environment
call :check_database_connection
call :check_node_dependencies
call :show_status
goto :end

:help
echo.
echo 🎯 TalentSphere Database Migration Tool
echo.
echo Usage:
echo   %~nx0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   migrate, up     Run pending migrations
echo   status          Show current migration status
echo   help            Show this help message
echo.
echo Options:
echo   --backup       Create database backup before migration
echo.
echo Environment Variables:
echo   DATABASE_URL    PostgreSQL connection string (required)
echo.
echo Examples:
echo   set DATABASE_URL=postgresql://user:pass@localhost:5432/talentsphere
echo   %~nx0 status
echo   %~nx0 migrate
echo   %~nx0 migrate --backup
echo.
goto :end

:end
echo.
call :print_success "🎉 Migration script completed"
endlocal