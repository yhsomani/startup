const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Data for TalentSphere
const candidates = [
    { id: 1, name: 'Alice Johnson', role: 'Senior Frontend Engineer', status: 'Interviewing' },
    { id: 2, name: 'Bob Smith', role: 'Product Manager', status: 'Applied' },
    { id: 3, name: 'Charlie Davis', role: 'Backend Developer', status: 'Offer Sent' },
];

// Routes
app.get('/api/candidates', (req, res) => {
    res.json({
        success: true,
        data: candidates
    });
});

app.listen(port, () => {
    console.log(`TalentSphere Backend running on port ${port}`);
});