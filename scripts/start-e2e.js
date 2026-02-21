const { spawn } = require('child_process');
const path = require('path');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    backend: '\x1b[36m', // Cyan
    frontend: '\x1b[35m', // Magenta
    error: '\x1b[31m', // Red
};

function log(prefix, color, data) {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
        if (line.trim()) {
            console.log(`${color}[${prefix}]${colors.reset} ${line}`);
        }
    });
}

// Start Backend (API Gateway)
console.log('🚀 Starting Backend...');
const backend = spawn('npm', ['start'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'pipe'
});

backend.stdout.on('data', data => log('BACKEND', colors.backend, data));
backend.stderr.on('data', data => log('BACKEND', colors.error, data));

// Start Frontend
console.log('🚀 Starting Frontend...');
const frontend = spawn('npx', ['pnpm', 'dev'], {
    cwd: path.resolve(__dirname, '../frontend'),
    shell: true,
    stdio: 'pipe'
});

frontend.stdout.on('data', data => log('FRONTEND', colors.frontend, data));
frontend.stderr.on('data', data => log('FRONTEND', colors.error, data));

// Handle shutdown
const shutdown = () => {
    console.log('\n🛑 Shutting down services...');
    backend.kill();
    frontend.kill();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
