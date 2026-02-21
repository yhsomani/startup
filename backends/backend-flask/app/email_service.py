import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@talentsphere.com')
        self.from_name = os.getenv('FROM_NAME', 'TalentSphere')

    def send_password_reset_email(self, to_email, reset_token, user_name=None):
        """Send password reset email"""
        reset_link = f"https://talentsphere.com/reset-password?token={reset_token}"

        subject = "Reset Your TalentSphere Password"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Reset Your Password</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>TalentSphere</h1>
                    <p>Reset Your Password</p>
                </div>
                <div class="content">
                    <p>Hello {user_name or 'there'},</p>
                    <p>We received a request to reset your password for your TalentSphere account. Click the button below to reset your password:</p>
                    <p style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset Password</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #e5e7eb; padding: 10px; border-radius: 4px;">
                        {reset_link}
                    </p>
                    <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
                    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 TalentSphere. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Reset Your TalentSphere Password

        Hello {user_name or 'there'},

        We received a request to reset your password for your TalentSphere account.

        Click this link to reset your password: {reset_link}

        Or copy and paste this link into your browser: {reset_link}

        Note: This link will expire in 1 hour for security reasons.

        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

        © 2026 TalentSphere. All rights reserved.
        """

        return self._send_email(to_email, subject, html_body, text_body)

    def send_welcome_email(self, to_email, user_name):
        """Send welcome email"""
        subject = "Welcome to TalentSphere!"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to TalentSphere</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4f46e5; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>TalentSphere</h1>
                    <p>Welcome to the Learning Platform!</p>
                </div>
                <div class="content">
                    <p>Hello {user_name},</p>
                    <p>Welcome to TalentSphere! We're excited to have you join our learning community.</p>
                    <p>Your account has been successfully created and you can now:</p>
                    <ul>
                        <li>Browse our extensive course catalog</li>
                        <li>Enroll in courses that match your interests</li>
                        <li>Track your learning progress</li>
                        <li>Earn certificates upon completion</li>
                    </ul>
                    <p style="text-align: center;">
                        <a href="https://talentsphere.com/courses" class="button">Start Learning</a>
                    </p>
                    <p>If you have any questions, feel free to contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 TalentSphere. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Welcome to TalentSphere!

        Hello {user_name},

        Welcome to TalentSphere! We're excited to have you join our learning community.

        Your account has been successfully created and you can now:
        - Browse our extensive course catalog
        - Enroll in courses that match your interests
        - Track your learning progress
        - Earn certificates upon completion

        Start learning: https://talentsphere.com/courses

        If you have any questions, feel free to contact our support team.

        © 2026 TalentSphere. All rights reserved.
        """

        return self._send_email(to_email, subject, html_body, text_body)

    def _send_email(self, to_email, subject, html_body, text_body):
        """Send email using SMTP"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email

            # Attach parts
            text_part = MIMEText(text_body, 'plain')
            html_part = MIMEText(html_body, 'html')

            msg.attach(text_part)
            msg.attach(html_part)

            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()

            return True
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            return False

# Create a global email service instance
email_service = EmailService()
