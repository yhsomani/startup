const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Port Configuration
const PORT = process.env.VIDEO_SERVICE_PORT || 3011;

// Initialize Express
const app = express();
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow video loading
}));
app.use(express.json());

// Static folder for HLS segments
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const HLS_DIR = path.join(UPLOADS_DIR, 'hls');

// Ensure directories exist
if (!fs.existsSync(HLS_DIR)) {
    fs.mkdirSync(HLS_DIR, { recursive: true });
}
if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

// Serve static HLS files
app.use('/stream', express.static(HLS_DIR));

// Basic Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'video-service' });
});

// Import Routes
const vodRoutes = require('./routes/vod');
const interviewRoutes = require('./routes/interview');

app.use('/vod', vodRoutes);
app.use('/interview', interviewRoutes);

// Create HTTP Server & Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Configure this restrictively in production
        methods: ["GET", "POST"]
    }
});

// Signaling Logic for WebRTC
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`🎥 Video Service running on port ${PORT}`);
    console.log(`📂 Serving HLS from ${HLS_DIR}`);
});
