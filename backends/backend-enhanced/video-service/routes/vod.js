const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/videos');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// POST /vod/upload - Upload and start processing
router.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
    }

    const videoId = uuidv4();
    const inputPath = req.file.path;
    const outputDir = path.join(__dirname, '../uploads/hls', videoId);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'playlist.m3u8');

    // Start Processing (Async)
    // In production, this should be offloaded to a queue (Bull/Redis)
    processVideo(inputPath, outputPath, videoId);

    res.json({
        success: true,
        message: 'Video uploaded and processing started',
        videoId,
        streamUrl: `/stream/${videoId}/playlist.m3u8`
    });
});

function processVideo(inputPath, outputPath, videoId) {
    console.log(`🎬 Starting transcoding for ${videoId}...`);

    ffmpeg(inputPath, { timeout: 432000 })
        .addOptions([
            '-profile:v baseline',
            '-level 3.0',
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls'
        ])
        .output(outputPath)
        .on('end', () => {
            console.log(`✅ Transcoding finished for ${videoId}`);
            // Only delete source if needed
            // fs.unlinkSync(inputPath); 
        })
        .on('error', (err) => {
            console.error(`❌ Transcoding error for ${videoId}:`, err.message);
        })
        .run();
}

module.exports = router;
