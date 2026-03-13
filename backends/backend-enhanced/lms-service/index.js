const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// LMS Routes
app.get('/api/v1/courses', (req, res) => {
  res.json({ message: 'List of courses' });
});

app.post('/api/v1/courses', (req, res) => {
  res.json({ message: 'Course created' });
});

app.get('/api/v1/courses/:id', (req, res) => {
  res.json({ message: `Details for course ${req.params.id}` });
});

app.post('/api/v1/courses/:id/enroll', (req, res) => {
  res.json({ message: `Enrolled in course ${req.params.id}` });
});

// Used by CourseDetailPage/VideoPlayer for tracking progress
app.post('/api/v1/lms/progress', async (req, res) => {
  try {
    const { courseId, videoId, watchedSeconds, isCompleted, userId } = req.body;
    
    // In a real implementation this would upsert to 'lms_course_progress' and 'lms_video_progress'
    console.log(`[LMS] Saving progress for User ${userId}: Course ${courseId}, Video ${videoId}, Seconds: ${watchedSeconds}, Completed: ${isCompleted}`);
    
    res.json({ 
        message: 'Progress saved successfully',
        data: { courseId, videoId, watchedSeconds, isCompleted }
    });
  } catch (error) {
    console.error('LMS Progress Error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'lms-service' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`LMS Service running on port ${PORT}`);
});
