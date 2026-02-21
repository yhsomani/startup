from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.response import standard_response, error_response
from app.utils.rate_limiting import rate_limit
import openai
import json
from typing import Dict, Any

ai_bp = Blueprint('ai', __name__)

# Initialize OpenAI client
try:
    openai_client = openai.OpenAI(
        api_key=os.getenv('OPENAI_API_KEY'),
        model="gpt-4"
    )
except Exception as e:
    openai_client = None
    print(f"Failed to initialize OpenAI client: {e}")

@ai_bp.route('/chat', methods=['POST'])
@jwt_required()
@rate_limit(requests=20, window=60)  # 20 requests per minute
@standard_response
def chat():
    """AI assistant chat endpoint"""
    if not openai_client:
        return error_response('AI_SERVICE_UNAVAILABLE', 'AI assistant service is currently unavailable'), 503
    
    data = request.get_json()
    message = data.get('message', '')
    context = data.get('context', {})
    language = data.get('language', 'python')
    
    if not message.strip():
        return error_response('MESSAGE_REQUIRED', 'Message is required'), 400
    
    try:
        # Build system prompt based on context
        system_prompt = build_system_prompt(context, language)
        
        # Create conversation history
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ]
        
        # Add context information if available
        if context.get('challenge_id'):
            messages.append({
                "role": "system", 
                "content": f"The user is working on challenge {context['challenge_id']}"
            })
        
        if context.get('course_id'):
            messages.append({
                "role": "system", 
                "content": f"The user is enrolled in course {context['course_id']}"
            })
        
        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
            timeout=30
        )
        
        ai_response = response.choices[0].message.content
        
        # Extract code examples if any
        code_examples = extract_code_examples(ai_response)
        
        # Get suggestions for improvement
        suggestions = generate_suggestions(ai_response, language)
        
        return {
            'response': ai_response,
            'codeExamples': code_examples,
            'suggestions': suggestions,
            'model': 'gpt-4',
            'context': context
        }
        
    except openai.RateLimitError:
        return error_response('AI_RATE_LIMIT', 'OpenAI rate limit exceeded. Please try again later.'), 429
    except openai.APITimeoutError:
        return error_response('AI_TIMEOUT', 'AI assistant request timed out'), 408
    except Exception as e:
        return error_response('AI_ERROR', f'AI assistant error: {str(e)}'), 500

@ai_bp.route('/explain', methods=['POST'])
@jwt_required()
@rate_limit(requests=10, window=60)  # 10 requests per minute
@standard_response
def explain_code():
    """Code explanation endpoint"""
    if not openai_client:
        return error_response('AI_SERVICE_UNAVAILABLE', 'AI assistant service is currently unavailable'), 503
    
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    if not code.strip():
        return error_response('CODE_REQUIRED', 'Code is required'), 400
    
    try:
        system_prompt = f"""You are an expert programmer and teacher. 
        Explain the following {language} code clearly and concisely:
        1. What the code does
        2. How it works
        3. Best practices or improvements
        4. Potential bugs or issues
        
        Provide the explanation in a way that helps someone learn."""
        
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Explain this {language} code:\n\n{code}"}
            ],
            max_tokens=800,
            temperature=0.3
        )
        
        explanation = response.choices[0].message.content
        
        return {
            'explanation': explanation,
            'code': code,
            'language': language,
            'model': 'gpt-4'
        }
        
    except Exception as e:
        return error_response('AI_ERROR', f'Code explanation error: {str(e)}'), 500

@ai_bp.route('/debug', methods=['POST'])
@jwt_required()
@rate_limit(requests=15, window=60)  # 15 requests per minute
@standard_response
def debug_code():
    """Code debugging endpoint"""
    if not openai_client:
        return error_response('AI_SERVICE_UNAVAILABLE', 'AI assistant service is currently unavailable'), 503
    
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', 'python')
    error_message = data.get('error', '')
    
    if not code.strip():
        return error_response('CODE_REQUIRED', 'Code is required'), 400
    
    try:
        system_prompt = f"""You are an expert debugger and programmer. 
        Help debug the following {language} code.
        The user is getting this error: {error_message}
        
        Provide:
        1. The likely cause of the error
        2. How to fix it
        3. Improved code version
        4. Explanation of the fix
        
        Be specific and provide working solutions."""
        
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Debug this {language} code:\n\n{code}\n\nError: {error_message}"}
            ],
            max_tokens=1000,
            temperature=0.2
        )
        
        debug_info = response.choices[0].message.content
        
        # Try to extract fixed code
        fixed_code = extract_code_from_response(debug_info)
        
        return {
            'debugInfo': debug_info,
            'originalCode': code,
            'fixedCode': fixed_code,
            'language': language,
            'error': error_message,
            'model': 'gpt-4'
        }
        
    except Exception as e:
        return error_response('AI_ERROR', f'Debugging error: {str(e)}'), 500

@ai_bp.route('/suggest', methods=['POST'])
@jwt_required()
@rate_limit(requests=25, window=60)  # 25 requests per minute
@standard_response
def suggest_improvements():
    """Code improvement suggestions endpoint"""
    if not openai_client:
        return error_response('AI_SERVICE_UNAVAILABLE', 'AI assistant service is currently unavailable'), 503
    
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    if not code.strip():
        return error_response('CODE_REQUIRED', 'Code is required'), 400
    
    try:
        system_prompt = f"""You are an expert code reviewer. 
        Review the following {language} code and suggest improvements for:
        1. Performance optimization
        2. Code readability and maintainability
        3. Best practices and patterns
        4. Security considerations
        5. Modern language features
        
        Provide specific, actionable suggestions with code examples."""
        
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Suggest improvements for this {language} code:\n\n{code}"}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        suggestions = response.choices[0].message.content
        
        return {
            'suggestions': suggestions,
            'originalCode': code,
            'language': language,
            'model': 'gpt-4'
        }
        
    except Exception as e:
        return error_response('AI_ERROR', f'Suggestion error: {str(e)}'), 500

def build_system_prompt(context: Dict[str, Any], language: str) -> str:
    """Build contextual system prompt"""
    base_prompt = """You are TalentSphere AI, a helpful programming and learning assistant.
    You specialize in helping users with coding challenges, course content, and learning paths."""
    
    if context.get('challenge_id'):
        base_prompt += f"""
        The user is currently working on challenge {context['challenge_id']}.
        Help them understand the requirements and provide hints without giving away the solution."""
    
    if context.get('course_id'):
        base_prompt += f"""
        The user is enrolled in course {context['course_id']}.
        Help them with course-related questions and provide additional learning resources."""
    
    if context.get('skill_level'):
        level = context['skill_level']
        base_prompt += f"""
        The user's skill level is {level}.
        Adjust your explanations accordingly: {'simple' if level == 'beginner' else 'detailed but not overly complex'}."""
    
    return base_prompt

def extract_code_examples(response: str) -> list:
    """Extract code examples from AI response"""
    import re
    
    # Look for code blocks
    code_blocks = re.findall(r'```(\w+)?\n(.*?)\n```', response, re.DOTALL)
    
    examples = []
    for language, code in code_blocks:
        examples.append({
            'language': language or 'text',
            'code': code.strip(),
            'type': 'example'
        })
    
    return examples

def generate_suggestions(response: str, language: str) -> list:
    """Generate improvement suggestions from AI response"""
    suggestions = []
    
    # Common improvement patterns
    if 'performance' in response.lower():
        suggestions.append({
            'type': 'performance',
            'description': 'Consider optimizing for better performance',
            'priority': 'high'
        })
    
    if 'security' in response.lower():
        suggestions.append({
            'type': 'security',
            'description': 'Review security implications',
            'priority': 'critical'
        })
    
    if 'best practice' in response.lower() or 'bestpractice' in response.lower():
        suggestions.append({
            'type': 'best_practice',
            'description': 'Follow coding best practices',
            'priority': 'medium'
        })
    
    return suggestions

def extract_code_from_response(response: str) -> str:
    """Extract code from AI response"""
    import re
    
    # Look for the last code block
    code_blocks = re.findall(r'```(?:\w+)?\n(.*?)\n```', response, re.DOTALL)
    
    if code_blocks:
        return code_blocks[-1].strip()  # Return the last code block
    
    return ''