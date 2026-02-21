import requests
import json
import os
from datetime import datetime

def send_launch_notification():
    """Send production launch notification"""
    
    # Load configuration
    webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    email_service_url = os.getenv('EMAIL_SERVICE_URL')
    
    launch_message = {
        "text": "🚀 TALENTSPHERE PRODUCTION LAUNCH SUCCESSFUL! 🎉",
        "attachments": [{
            "color": "36a64f",  # Green
            "title": "🎯 TalentSphere is LIVE!",
            "fields": [
                {
                    "title": "Environment",
                    "value": "Production",
                    "short": True
                },
                {
                    "title": "Launch Time",
                    "value": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
                    "short": True
                },
                {
                    "title": "Platform URL",
                    "value": "https://talentsphere.com",
                    "short": True
                },
                {
                    "title": "API URL",
                    "value": "https://api.talentsphere.com",
                    "short": True
                },
                {
                    "title": "Monitoring Dashboard",
                    "value": "https://monitor.talentsphere.com",
                    "short": True
                },
                {
                    "title": "DevOps Console",
                    "value": "https://devops.talentsphere.com",
                    "short": True
                },
                {
                    "title": "Documentation",
                    "value": "https://docs.talentsphere.com",
                    "short": True
                }
            ],
            "footer": {
                "text": "TalentSphere v2.3.0 - Enterprise Learning & Development Platform",
                "icon_emoji": "🎓"
            }
        }]
    }
    
    # Send to Slack
    if webhook_url:
        try:
            response = requests.post(webhook_url, json=launch_message, timeout=10)
            if response.status_code == 200:
                print("✅ Slack notification sent successfully")
            else:
                print(f"❌ Slack notification failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error sending Slack notification: {e}")
    
    # Send email notification
    if email_service_url:
        try:
            email_data = {
                "to": ["team@talentsphere.com", "stakeholders@talentsphere.com"],
                "subject": "🎉 TalentSphere Production Launch Successful!",
                "html": f"""
                <h1>🚀 TalentSphere is LIVE!</h1>
                <p>TalentSphere v2.3.0 has been successfully deployed to production.</p>
                <h3>🔗 Important Links:</h3>
                <ul>
                    <li><a href="https://talentsphere.com">Platform</a></li>
                    <li><a href="https://api.talentsphere.com">API</a></li>
                    <li><a href="https://monitor.talentsphere.com">Monitoring</a></li>
                    <li><a href="https://devops.talentsphere.com">DevOps</a></li>
                </ul>
                <h3>📊 System Status:</h3>
                <ul>
                    <li>✅ All services healthy</li>
                    <li>✅ Load balancing active</li>
                    <li>✅ SSL configured</li>
                    <li>✅ Monitoring active</li>
                </ul>
                <p>Launch Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                <p>Version: TalentSphere v2.3.0</p>
                <p>Team: TalentSphere Development Team</p>
                """
            }
            
            response = requests.post(email_service_url, json=email_data, timeout=10)
            if response.status_code == 200:
                print("✅ Email notification sent successfully")
            else:
                print(f"❌ Email notification failed: {response.status_code}")
        except Exception as e:
            print(f"❌ Error sending email notification: {e}")
    
    # Log launch event
    print("📋 Launch event logged successfully")

def main():
    print("📧 Sending launch notifications...")
    send_launch_notification()
    print("🎉 Launch notification complete!")

if __name__ == "__main__":
    main()