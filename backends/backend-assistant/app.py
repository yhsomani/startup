from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from datetime import datetime
import os
import requests

# Flask Feature Flags API URL
FLASK_FLAGS_URL = os.getenv('FLASK_FLAGS_URL', 'http://flask:5000')

# Optional OpenAI API (with graceful fallback)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
USE_MOCK = not bool(OPENAI_API_KEY)

class FeatureFlags:
    @classmethod
    def is_enabled(cls, flag):
        try:
            # Try to get flag from Flask service
            response = requests.get(
                f'{FLASK_FLAGS_URL}/api/v1/flags/is-enabled/{flag}',
                timeout=2
            )
            if response.status_code == 200:
                return response.json()['enabled']
        except Exception:
            # Fallback to environment variables
            pass
        return os.getenv(f'FF_{flag}', 'false').lower() == 'true'

app = Flask(__name__)
CORS(app)

# JWT Configuration
jwt_secret = os.getenv('JWT_SECRET_KEY')
if not jwt_secret:
    if os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError("CRITICAL: JWT_SECRET_KEY must be set in production environment.")
    import secrets
    jwt_secret = secrets.token_urlsafe(32)
    print(f"⚠️  WARNING: Generated temporary JWT_SECRET_KEY for development: {jwt_secret[:8]}...")
app.config['JWT_SECRET_KEY'] = jwt_secret
jwt = JWTManager(app)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
USE_MOCK = not OPENAI_API_KEY

if not USE_MOCK:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        print(f"✅ OpenAI client initialized")
    except ImportError:
        print("⚠️  OpenAI library not installed. Falling back to MOCK mode.")
        print("    Install with: pip install openai")
        USE_MOCK = True
    except Exception as e:
        print(f"⚠️  OpenAI initialization failed: {e}. Falling back to MOCK mode.")
        USE_MOCK = True

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'assistant-service',
        'mode': 'MOCK' if USE_MOCK else 'PRODUCTION',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/v1/assistant/chat', methods=['POST'])
@jwt_required()
def chat():
    """AI-powered tutoring chat endpoint"""
    if not FeatureFlags.is_enabled('ENABLE_AI_ASSISTANT'):
        return jsonify({'error': 'AI Assistant feature is disabled'}), 403
    
    data = request.get_json()
    user_message = data.get('message', '')
    context = data.get('context', {})
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    if USE_MOCK:
        # Mock response for development/testing
        response_text = f"[MOCK AI] I understand you're asking about: '{user_message[:50]}...'. In production mode with OPENAI_API_KEY set, I would provide detailed AI-powered tutoring assistance."
    else:
        # Production OpenAI integration
        try:
            system_prompt = "You are a helpful coding tutor for TalentSphere. Provide clear, educational explanations and help students learn programming concepts."
            
            if context.get('course'):
                system_prompt += f" Student is learning: {context['course']}"
            if context.get('code'):
                system_prompt += f"\n\nStudent's code:\n```\n{context['code']}\n```"
            
            completion = client.chat.completions.create(
                model=os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo'),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=int(os.getenv('MAX_TOKENS', '500')),
                temperature=0.7
            )
            
            response_text = completion.choices[0].message.content
        except Exception as e:
            return jsonify({'error': f'AI service error: {str(e)}'}), 500
    
    return jsonify({
        'response': response_text,
        'source': 'mock-ai-model' if USE_MOCK else 'openai',
        'mode': 'MOCK' if USE_MOCK else 'PRODUCTION',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/v1/assistant/analyze-code', methods=['POST'])
@jwt_required()
def analyze_code():
    """Analyze code and provide feedback"""
    if not FeatureFlags.is_enabled('ENABLE_AI_ASSISTANT'):
        return jsonify({'error': 'AI Assistant feature is disabled'}), 403
    
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    if not code:
        return jsonify({'error': 'Code is required'}), 400
    
    if USE_MOCK:
        analysis = {
            'quality_score': 0.75,
            'suggestions': ['Add error handling', 'Improve variable names', 'Consider edge cases'],
            'strengths': ['Code is readable', 'Logic is clear'],
            'mode': 'MOCK'
        }
    else:
        try:
            prompt = f"Analyze this {language} code and provide: 1) Quality score 0-1, 2) Top suggestions, 3) Strengths\n\n```{language}\n{code}\n```"
            
            completion = client.chat.completions.create(
                model=os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo'),
                messages=[
                    {"role": "system", "content": "You are a code reviewer. Be constructive and educational."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300
            )
            
            feedback = completion.choices[0].message.content
            analysis = {
                'feedback': feedback,
                'mode': 'PRODUCTION',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return jsonify({'error': f'Analysis failed: {str(e)}'}), 500
    
    return jsonify(analysis), 200

@app.route('/api/v1/assistant/summary/<lesson_id>', methods=['GET'])
@jwt_required()
def get_lesson_summary(lesson_id):
    """Generate AI-powered summary notes for a lesson"""
    if not FeatureFlags.is_enabled('ENABLE_AI_ASSISTANT'):
        return jsonify({'error': 'AI Assistant feature is disabled'}), 403
    
    if USE_MOCK:
        # Mock response for development/testing
        summary = {
            'lesson_id': lesson_id,
            'title': f'Summary for Lesson {lesson_id}',
            'summary': 'This is a mock AI-generated summary of the lesson content. In production mode with OPENAI_API_KEY set, this would provide actual AI-generated summary notes including key concepts, examples, and study tips.',
            'key_points': [
                'Key concept 1: Understanding the fundamentals',
                'Key concept 2: Practical applications',
                'Key concept 3: Best practices and tips'
            ],
            'study_tips': [
                'Review the code examples carefully',
                'Practice with hands-on exercises',
                'Connect concepts to real-world applications'
            ],
            'mode': 'MOCK'
        }
    else:
        try:
            # In production, you would fetch lesson content from LMS service
            # and then generate a summary using OpenAI
            prompt = f"Generate study summary notes for lesson ID {lesson_id}. Include: 1) Key points, 2) Study tips, 3) Brief summary"
            
            completion = client.chat.completions.create(
                model=os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo'),
                messages=[
                    {"role": "system", "content": "You are an educational assistant. Generate concise, helpful study notes."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400
            )
            
            summary_text = completion.choices[0].message.content
            summary = {
                'lesson_id': lesson_id,
                'summary': summary_text,
                'mode': 'PRODUCTION',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return jsonify({'error': f'Summary generation failed: {str(e)}'}), 500
    
    return jsonify(summary), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5005))
    mode_str = 'MOCK' if USE_MOCK else 'PRODUCTION (OpenAI)'
    print(f"🤖 AI Assistant Service")
    print(f"   Mode: {mode_str}")
    print(f"   Port: {port}")
    print(f"   Endpoints:")
    print(f"     - POST /api/v1/assistant/chat")
    print(f"     - POST /api/v1/assistant/analyze-code")
    print(f"     - GET  /api/v1/assistant/summary/<lesson_id>")
    if USE_MOCK:
        print(f"   💡 Set OPENAI_API_KEY environment variable for production mode")
    app.run(host='0.0.0.0', port=port, debug=True)

