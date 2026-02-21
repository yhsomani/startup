/**
 * TalentSphere Video Interview Scheduling and Management Service
 * Handles video conference integration, scheduling, and management
 */

const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');

class VideoInterviewService {
    constructor(options = {}) {
        this.options = {
            // Video conferencing platform configuration
            videoPlatform: options.videoPlatform || 'jitsi', // jitsi, zoom, google_meet
            jitsiConfig: {
                baseUrl: options.jitsiConfig?.baseUrl || 'https://meet.jit.si',
                apiKey: options.jitsiConfig?.apiKey || process.env.JITSI_API_KEY,
                secret: options.jitsiConfig?.secret || process.env.JITSI_SECRET
            },
            zoomConfig: {
                apiKey: options.zoomConfig?.apiKey || process.env.ZOOM_API_KEY,
                apiSecret: options.zoomConfig?.apiSecret || process.env.ZOOM_API_SECRET,
                accountId: options.zoomConfig?.accountId || process.env.ZOOM_ACCOUNT_ID
            },
            googleMeetConfig: {
                apiKey: options.googleMeetConfig?.apiKey || process.env.GOOGLE_MEET_API_KEY,
                clientId: options.googleMeetConfig?.clientId || process.env.GOOGLE_CLIENT_ID,
                clientSecret: options.googleMeetConfig?.clientSecret || process.env.GOOGLE_CLIENT_SECRET
            },

            // Email notification settings
            email: {
                enabled: options.email?.enabled !== false,
                smtpHost: options.email?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
                smtpPort: options.email?.smtpPort || parseInt(process.env.SMTP_PORT) || 587,
                smtpUser: options.email?.smtpUser || process.env.SMTP_USER,
                smtpPassword: options.email?.smtpPassword || process.env.SMTP_PASSWORD,
                fromEmail: options.email?.fromEmail || process.env.FROM_EMAIL || 'noreply@talentsphere.com'
            },

            // Calendar integration settings
            calendarIntegration: options.calendarIntegration !== false,
            calendarProvider: options.calendarProvider || 'google', // google, outlook

            // Default meeting settings
            defaultMeetingSettings: {
                duration: options.defaultMeetingSettings?.duration || 60, // minutes
                autoRecording: options.defaultMeetingSettings?.autoRecording || false,
                waitingRoom: options.defaultMeetingSettings?.waitingRoom || true,
                muteParticipantsUponEntry: options.defaultMeetingSettings?.muteParticipantsUponEntry || false,
                waitingRoomEnabled: options.defaultMeetingSettings?.waitingRoomEnabled || true
            },

            // Storage for interviews
            interviews: new Map(),
            participants: new Map(),

            ...options
        };

        // Initialize email transporter if email is enabled
        if (this.options.email.enabled) {
            this.transporter = nodemailer.createTransporter({
                host: this.options.email.smtpHost,
                port: this.options.email.smtpPort,
                secure: this.options.email.smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: this.options.email.smtpUser,
                    pass: this.options.email.smtpPassword
                }
            });
        }
    }

    /**
     * Generate a unique meeting ID
     */
    generateMeetingId() {
        // For Jitsi, we can use a readable name
        return `talentsphere-${uuidv4().substring(0, 8)}`;
    }

    /**
     * Create a new video interview
     */
    async createInterview(interviewData) {
        const {
            jobId,
            applicantId,
            interviewerId,
            scheduledTime,
            duration = this.options.defaultMeetingSettings.duration,
            timezone = 'UTC',
            title,
            description,
            additionalParticipants = []
        } = interviewData;

        if (!jobId || !applicantId || !interviewerId || !scheduledTime) {
            throw new Error('Missing required fields: jobId, applicantId, interviewerId, scheduledTime');
        }

        // Validate scheduled time (should be in the future)
        const now = moment().tz(timezone);
        const scheduledMoment = moment(scheduledTime).tz(timezone);

        if (scheduledMoment.isBefore(now)) {
            throw new Error('Scheduled time must be in the future');
        }

        // Generate meeting ID and URL based on platform
        const meetingId = this.generateMeetingId();
        const meetingUrl = this.generateMeetingUrl(meetingId);

        // Create interview object
        const interview = {
            id: uuidv4(),
            meetingId,
            meetingUrl,
            jobId,
            applicantId,
            interviewerId,
            scheduledTime: scheduledMoment.toISOString(),
            duration,
            timezone,
            title: title || `Job Interview - Position #${jobId}`,
            description: description || `Video interview for job application`,
            status: 'scheduled', // scheduled, started, completed, cancelled
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            participants: [
                { id: applicantId, role: 'applicant', joinedAt: null, leftAt: null },
                { id: interviewerId, role: 'interviewer', joinedAt: null, leftAt: null },
                ...additionalParticipants.map(participantId => ({
                    id: participantId,
                    role: 'participant',
                    joinedAt: null,
                    leftAt: null
                }))
            ],
            meetingSettings: {
                ...this.options.defaultMeetingSettings,
                autoRecording: interviewData.autoRecording ?? this.options.defaultMeetingSettings.autoRecording,
                waitingRoom: interviewData.waitingRoom ?? this.options.defaultMeetingSettings.waitingRoom,
                muteParticipantsUponEntry: interviewData.muteParticipantsUponEntry ?? this.options.defaultMeetingSettings.muteParticipantsUponEntry
            }
        };

        // Store interview
        this.interviews.set(interview.id, interview);

        // Send notifications
        await this.sendInterviewNotifications(interview);

        return interview;
    }

    /**
     * Generate meeting URL based on platform
     */
    generateMeetingUrl(meetingId) {
        switch (this.options.videoPlatform) {
            case 'jitsi':
                return `${this.options.jitsiConfig.baseUrl}/${meetingId}`;
            case 'zoom':
                // Zoom meeting URL would be generated via API
                return `https://zoom.us/j/${meetingId}`;
            case 'google_meet':
                // Google Meet URL would be generated via API
                return `https://meet.google.com/${meetingId}`;
            default:
                return `${this.options.jitsiConfig.baseUrl}/${meetingId}`;
        }
    }

    /**
     * Get interview by ID
     */
    getInterview(interviewId) {
        const interview = this.interviews.get(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }
        return interview;
    }

    /**
     * Update interview
     */
    async updateInterview(interviewId, updateData) {
        const interview = this.interviews.get(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }

        // Prevent updates to completed or cancelled interviews
        if (['completed', 'cancelled'].includes(interview.status)) {
            throw new Error(`Cannot update interview with status: ${interview.status}`);
        }

        // Update fields
        const updatedInterview = {
            ...interview,
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        // If scheduled time changed, send updated notifications
        if (updateData.scheduledTime && updateData.scheduledTime !== interview.scheduledTime) {
            await this.sendInterviewUpdateNotifications(updatedInterview, interview);
        }

        this.interviews.set(interviewId, updatedInterview);
        return updatedInterview;
    }

    /**
     * Cancel interview
     */
    async cancelInterview(interviewId, cancellationReason = '') {
        const interview = this.interviews.get(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }

        const updatedInterview = {
            ...interview,
            status: 'cancelled',
            cancellationReason,
            cancelledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.interviews.set(interviewId, updatedInterview);

        // Send cancellation notifications
        await this.sendCancellationNotifications(updatedInterview);

        return updatedInterview;
    }

    /**
     * Start interview
     */
    async startInterview(interviewId) {
        const interview = this.interviews.get(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }

        if (interview.status !== 'scheduled') {
            throw new Error(`Cannot start interview with status: ${interview.status}`);
        }

        const updatedInterview = {
            ...interview,
            status: 'started',
            startedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.interviews.set(interviewId, updatedInterview);

        // Send start notifications
        await this.sendStartNotifications(updatedInterview);

        return updatedInterview;
    }

    /**
     * Complete interview
     */
    async completeInterview(interviewId) {
        const interview = this.interviews.get(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }

        if (interview.status !== 'started') {
            throw new Error(`Cannot complete interview with status: ${interview.status}`);
        }

        const updatedInterview = {
            ...interview,
            status: 'completed',
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.interviews.set(interviewId, updatedInterview);

        // Send completion notifications
        await this.sendCompletionNotifications(updatedInterview);

        return updatedInterview;
    }

    /**
     * Get interviews for a user
     */
    getUserInterviews(userId, role = 'any') {
        const userInterviews = [];

        for (const interview of this.interviews.values()) {
            const hasRole =
                (role === 'any') ||
                (role === 'applicant' && interview.applicantId === userId) ||
                (role === 'interviewer' && interview.interviewerId === userId) ||
                (role === 'participant' && interview.participants.some(p => p.id === userId && p.role === 'participant'));

            if (hasRole) {
                userInterviews.push(interview);
            }
        }

        return userInterviews;
    }

    /**
     * Get interviews by status
     */
    getInterviewsByStatus(status) {
        const interviews = [];

        for (const interview of this.interviews.values()) {
            if (interview.status === status) {
                interviews.push(interview);
            }
        }

        return interviews;
    }

    /**
     * Get upcoming interviews
     */
    getUpcomingInterviews(hours = 24) {
        const now = moment();
        const futureTime = moment().add(hours, 'hours');
        const upcomingInterviews = [];

        for (const interview of this.interviews.values()) {
            const scheduledTime = moment(interview.scheduledTime);

            if (scheduledTime.isBetween(now, futureTime) && ['scheduled'].includes(interview.status)) {
                upcomingInterviews.push(interview);
            }
        }

        return upcomingInterviews;
    }

    /**
     * Send interview notifications
     */
    async sendInterviewNotifications(interview) {
        if (!this.options.email.enabled) {
            return;
        }

        const { applicantId, interviewerId, scheduledTime, meetingUrl, title, description } = interview;

        // Format the scheduled time according to user's timezone
        const scheduledMoment = moment(scheduledTime).tz(interview.timezone);
        const formattedTime = scheduledMoment.format('MMMM Do YYYY, h:mm A z');

        // Send to applicant
        await this.sendEmail(
            applicantId, // This would be the email in a real implementation
            `Interview Scheduled: ${title}`,
            `
        <h2>Interview Scheduled</h2>
        <p>Hello,</p>
        <p>Your interview has been scheduled:</p>
        <ul>
          <li><strong>Title:</strong> ${title}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          <li><strong>Duration:</strong> ${interview.duration} minutes</li>
          <li><strong>Meeting Link:</strong> <a href="${meetingUrl}">${meetingUrl}</a></li>
          <li><strong>Description:</strong> ${description}</li>
        </ul>
        <p>Please join the meeting at least 5 minutes early.</p>
        <p>Best regards,<br>TalentSphere Team</p>
      `
        );

        // Send to interviewer
        await this.sendEmail(
            interviewerId, // This would be the email in a real implementation
            `Interview Scheduled: ${title}`,
            `
        <h2>Interview Scheduled</h2>
        <p>Hello,</p>
        <p>You have an interview scheduled:</p>
        <ul>
          <li><strong>Title:</strong> ${title}</li>
          <li><strong>Time:</strong> ${formattedTime}</li>
          <li><strong>Duration:</strong> ${interview.duration} minutes</li>
          <li><strong>Meeting Link:</strong> <a href="${meetingUrl}">${meetingUrl}</a></li>
          <li><strong>Description:</strong> ${description}</li>
        </ul>
        <p>Please join the meeting at least 5 minutes early.</p>
        <p>Best regards,<br>TalentSphere Team</p>
      `
        );
    }

    /**
     * Send interview update notifications
     */
    async sendInterviewUpdateNotifications(updatedInterview, originalInterview) {
        if (!this.options.email.enabled) {
            return;
        }

        const { applicantId, interviewerId, scheduledTime, meetingUrl, title } = updatedInterview;

        // Format the scheduled time according to user's timezone
        const scheduledMoment = moment(scheduledTime).tz(updatedInterview.timezone);
        const formattedTime = scheduledMoment.format('MMMM Do YYYY, h:mm A z');

        const originalScheduledMoment = moment(originalInterview.scheduledTime).tz(originalInterview.timezone);
        const originalFormattedTime = originalScheduledMoment.format('MMMM Do YYYY, h:mm A z');

        const updateMessage = `
      <h2>Interview Updated: ${title}</h2>
      <p>Hello,</p>
      <p>Your interview details have been updated:</p>
      <ul>
        <li><strong>Title:</strong> ${title}</li>
        <li><strong>Previous Time:</strong> ${originalFormattedTime}</li>
        <li><strong>New Time:</strong> ${formattedTime}</li>
        <li><strong>Duration:</strong> ${updatedInterview.duration} minutes</li>
        <li><strong>Meeting Link:</strong> <a href="${meetingUrl}">${meetingUrl}</a></li>
      </ul>
      <p>Please update your calendar accordingly.</p>
      <p>Best regards,<br>TalentSphere Team</p>
    `;

        // Send to applicant
        await this.sendEmail(applicantId, `Interview Updated: ${title}`, updateMessage);

        // Send to interviewer
        await this.sendEmail(interviewerId, `Interview Updated: ${title}`, updateMessage);
    }

    /**
     * Send cancellation notifications
     */
    async sendCancellationNotifications(interview) {
        if (!this.options.email.enabled) {
            return;
        }

        const { applicantId, interviewerId, scheduledTime, title, cancellationReason } = interview;

        // Format the scheduled time according to user's timezone
        const scheduledMoment = moment(scheduledTime).tz(interview.timezone);
        const formattedTime = scheduledMoment.format('MMMM Do YYYY, h:mm A z');

        const cancellationMessage = `
      <h2>Interview Cancelled: ${title}</h2>
      <p>Hello,</p>
      <p>Unfortunately, your interview has been cancelled:</p>
      <ul>
        <li><strong>Title:</strong> ${title}</li>
        <li><strong>Scheduled Time:</strong> ${formattedTime}</li>
        <li><strong>Reason:</strong> ${cancellationReason || 'Not specified'}</li>
      </ul>
      <p>We apologize for any inconvenience caused.</p>
      <p>Best regards,<br>TalentSphere Team</p>
    `;

        // Send to applicant
        await this.sendEmail(applicantId, `Interview Cancelled: ${title}`, cancellationMessage);

        // Send to interviewer
        await this.sendEmail(interviewerId, `Interview Cancelled: ${title}`, cancellationMessage);
    }

    /**
     * Send start notifications
     */
    async sendStartNotifications(interview) {
        if (!this.options.email.enabled) {
            return;
        }

        const { applicantId, interviewerId, meetingUrl, title } = interview;

        const startMessage = `
      <h2>Interview Started: ${title}</h2>
      <p>Hello,</p>
      <p>The interview has now started:</p>
      <ul>
        <li><strong>Title:</strong> ${title}</li>
        <li><strong>Meeting Link:</strong> <a href="${meetingUrl}">${meetingUrl}</a></li>
      </ul>
      <p>Please join the meeting immediately if you haven't already.</p>
      <p>Best regards,<br>TalentSphere Team</p>
    `;

        // Send to applicant
        await this.sendEmail(applicantId, `Interview Started: ${title}`, startMessage);

        // Send to interviewer
        await this.sendEmail(interviewerId, `Interview Started: ${title}`, startMessage);
    }

    /**
     * Send completion notifications
     */
    async sendCompletionNotifications(interview) {
        if (!this.options.email.enabled) {
            return;
        }

        const { applicantId, interviewerId, title } = interview;

        const completionMessage = `
      <h2>Interview Completed: ${title}</h2>
      <p>Hello,</p>
      <p>The interview has been completed:</p>
      <ul>
        <li><strong>Title:</strong> ${title}</li>
      </ul>
      <p>Thank you for participating in the interview.</p>
      <p>Best regards,<br>TalentSphere Team</p>
    `;

        // Send to applicant
        await this.sendEmail(applicantId, `Interview Completed: ${title}`, completionMessage);

        // Send to interviewer
        await this.sendEmail(interviewerId, `Interview Completed: ${title}`, completionMessage);
    }

    /**
     * Send email notification
     */
    async sendEmail(to, subject, html) {
        if (!this.transporter) {
            console.warn('Email transporter not configured, skipping email notification');
            return;
        }

        try {
            const mailOptions = {
                from: this.options.email.fromEmail,
                to, // In a real implementation, this would be the actual email address
                subject,
                html
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent successfully to ${to}: ${result.messageId}`);
            return result;
        } catch (error) {
            console.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }

    /**
     * Generate calendar invite
     */
    generateCalendarInvite(interview) {
        const { title, description, scheduledTime, duration, meetingUrl } = interview;

        // Format start and end times
        const startTime = moment(scheduledTime).toISOString();
        const endTime = moment(scheduledTime).add(duration, 'minutes').toISOString();

        // Create iCal format
        const calendarEvent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:TalentSphere Calendar',
            'METHOD:REQUEST',
            'BEGIN:VEVENT',
            `UID:${interview.id}@talentsphere.com`,
            `DTSTAMP:${moment().toISOString()}`,
            `DTSTART:${startTime}`,
            `DTEND:${endTime}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}\\nMeeting Link: ${meetingUrl}`,
            `LOCATION:Virtual Meeting`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        return calendarEvent;
    }

    /**
     * Get participant status
     */
    getParticipantStatus(interviewId, participantId) {
        const interview = this.interviews.get(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }

        const participant = interview.participants.find(p => p.id === participantId);
        if (!participant) {
            throw new Error(`Participant with ID ${participantId} not found in interview ${interviewId}`);
        }

        return {
            interviewId,
            participantId,
            role: participant.role,
            joinedAt: participant.joinedAt,
            leftAt: participant.leftAt,
            status: participant.joinedAt && !participant.leftAt ? 'in_meeting' :
                participant.joinedAt && participant.leftAt ? 'left_meeting' : 'not_joined'
        };
    }

    /**
     * Mark participant as joined
     */
    markParticipantJoined(interviewId, participantId) {
        const interview = this.interviews.get(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }

        const participantIndex = interview.participants.findIndex(p => p.id === participantId);
        if (participantIndex === -1) {
            throw new Error(`Participant with ID ${participantId} not found in interview ${interviewId}`);
        }

        interview.participants[participantIndex].joinedAt = new Date().toISOString();
        interview.participants[participantIndex].leftAt = null; // Reset if previously left
        interview.updatedAt = new Date().toISOString();

        this.interviews.set(interviewId, interview);

        return this.getParticipantStatus(interviewId, participantId);
    }

    /**
     * Mark participant as left
     */
    markParticipantLeft(interviewId, participantId) {
        const interview = this.interviews.get(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }

        const participantIndex = interview.participants.findIndex(p => p.id === participantId);
        if (participantIndex === -1) {
            throw new Error(`Participant with ID ${participantId} not found in interview ${interviewId}`);
        }

        // Only update if they had joined
        if (interview.participants[participantIndex].joinedAt) {
            interview.participants[participantIndex].leftAt = new Date().toISOString();
            interview.updatedAt = new Date().toISOString();

            this.interviews.set(interviewId, interview);
        }

        return this.getParticipantStatus(interviewId, participantId);
    }

    /**
     * Get interview statistics
     */
    getStatistics() {
        const stats = {
            totalInterviews: this.interviews.size,
            byStatus: {},
            byMonth: {},
            avgDuration: 0,
            completedCount: 0,
            scheduledCount: 0,
            cancelledCount: 0
        };

        let totalDuration = 0;

        for (const interview of this.interviews.values()) {
            // Count by status
            stats.byStatus[interview.status] = (stats.byStatus[interview.status] || 0) + 1;

            // Count by month
            const monthKey = moment(interview.scheduledTime).format('YYYY-MM');
            stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + 1;

            // Track counts
            if (interview.status === 'completed') {
                stats.completedCount++;
                totalDuration += interview.duration;
            } else if (interview.status === 'scheduled') {
                stats.scheduledCount++;
            } else if (interview.status === 'cancelled') {
                stats.cancelledCount++;
            }
        }

        // Calculate average duration
        stats.avgDuration = stats.completedCount > 0 ?
            Math.round(totalDuration / stats.completedCount) : 0;

        return stats;
    }

    /**
     * Get availability for a user
     */
    async getUserAvailability(userId, startDate, endDate, excludeInterviews = true) {
        // In a real implementation, this would integrate with a calendar service
        // to check the user's schedule and find available slots

        const start = moment(startDate);
        const end = moment(endDate);

        // Generate available time slots (every 30 minutes)
        const availableSlots = [];
        let current = start.clone().startOf('hour'); // Start at top of the hour

        while (current.isBefore(end)) {
            // Skip if it's in the past
            if (current.isAfter(moment())) {
                availableSlots.push(current.toISOString());
            }
            current.add(30, 'minutes');
        }

        // In a real implementation, we would filter out busy times
        // For now, return all available slots
        return availableSlots;
    }

    /**
     * Find mutual availability between users
     */
    async findMutualAvailability(userIds, startDate, endDate) {
        // In a real implementation, this would check each user's calendar
        // and find overlapping free time slots

        // For now, return the first available slot for demonstration
        const start = moment(startDate);
        return [start.toISOString()];
    }
}

module.exports = VideoInterviewService;