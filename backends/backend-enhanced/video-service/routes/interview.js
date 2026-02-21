const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory store for active rooms (Use Redis in production)
const activeRooms = new Map();

// POST /interview/rooms - Create a new interview room
router.post('/rooms', (req, res) => {
    const roomId = uuidv4();
    const { interviewerId, candidateId, scheduledAt } = req.body;

    const room = {
        id: roomId,
        interviewerId,
        candidateId,
        scheduledAt: scheduledAt || new Date().toISOString(),
        status: 'scheduled', // scheduled, active, completed
        createdAt: new Date().toISOString()
    };

    activeRooms.set(roomId, room);

    res.json({
        success: true,
        room
    });
});

// GET /interview/rooms/:roomId - Get room details
router.get('/rooms/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = activeRooms.get(roomId);

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
        success: true,
        room
    });
});

// POST /interview/rooms/:roomId/end - End an interview
router.post('/rooms/:roomId/end', (req, res) => {
    const { roomId } = req.params;
    const room = activeRooms.get(roomId);

    if (!room) {
        return res.status(404).json({ error: 'Room not found' });
    }

    room.status = 'completed';
    room.endedAt = new Date().toISOString();
    activeRooms.set(roomId, room);

    res.json({
        success: true,
        message: 'Interview ended',
        room
    });
});

module.exports = router;
