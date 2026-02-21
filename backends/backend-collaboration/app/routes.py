from flask import Blueprint, request, jsonify, session
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_socketio import SocketIO, emit, join_room, leave_room
from services.shared.cors_config import CORSConfig
from app.utils.response import standard_response, error_response
from app.utils.rate_limiting import rate_limit
from app.session_manager import session_manager
import uuid
import json
from datetime import datetime

# WebSocket integration
# Initialize CORS configuration
cors_config = CORSConfig()

# Use secure CORS configuration based on environment
socketio = SocketIO(
    cors_allowed_origins=cors_config.getAllowedOrigins(),
    logger=True, 
    engineio_logger=True,
    max_http_buffer_size=1e8  # Increase buffer for large updates
)

collab_bp = Blueprint('collaboration', __name__)

# Store active collaboration sessions metadata
active_sessions = {}

@collab_bp.route('/sessions', methods=['POST'])
@jwt_required()
@rate_limit(requests=10, window=60)
@standard_response
def create_session():
    """Create new collaboration session"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    session_id = str(uuid.uuid4())
    session_data = {
        'id': session_id,
        'creator_id': user_id,
        'name': data.get('name', f"Collaboration Session {session_id[:8]}"),
        'type': data.get('type', 'general'),
        'max_participants': data.get('maxParticipants', 4),
        'created_at': datetime.utcnow().isoformat(),
        'participants': [user_id],
        'settings': data.get('settings', {})
    }
    
    active_sessions[session_id] = session_data
    
    # Initialize YDoc for this session
    session_manager.get_doc(session_id)
    
    return session_data

@collab_bp.route('/sessions/<session_id>', methods=['GET'])
@jwt_required()
@rate_limit(requests=20, window=60)
@standard_response
def get_session(session_id):
    """Get collaboration session details"""
    if session_id not in active_sessions:
        return error_response('SESSION_NOT_FOUND', 'Collaboration session not found'), 404
    
    return active_sessions[session_id]

@collab_bp.route('/sessions/<session_id>/join', methods=['POST'])
@jwt_required()
@rate_limit(requests=10, window=60)
@standard_response
def join_session():
    """Join existing collaboration session"""
    user_id = get_jwt_identity()
    data = request.get_json()
    session_id = data.get('sessionId')
    
    if session_id not in active_sessions:
        return error_response('SESSION_NOT_FOUND', 'Collaboration session not found'), 404
    
    session = active_sessions[session_id]
    
    if len(session['participants']) >= session['max_participants']:
        return error_response('SESSION_FULL', 'Collaboration session is full'), 400
    
    if user_id not in session['participants']:
        session['participants'].append(user_id)
        session['updated_at'] = datetime.utcnow().isoformat()
    
    # Notify other participants
    socketio.emit('user_joined', {
        'user_id': user_id,
        'session_id': session_id,
        'participant_count': len(session['participants'])
    }, to=f"session_{session_id}")
    
    return session

@collab_bp.route('/sessions/<session_id>/leave', methods=['POST'])
@jwt_required()
@rate_limit(requests=20, window=60)
@standard_response
def leave_session():
    """Leave collaboration session"""
    user_id = get_jwt_identity()
    data = request.get_json()
    session_id = data.get('sessionId')
    
    if session_id not in active_sessions:
        return error_response('SESSION_NOT_FOUND', 'Collaboration session not found'), 404
    
    session = active_sessions[session_id]
    
    if user_id in session['participants']:
        session['participants'].remove(user_id)
        session['updated_at'] = datetime.utcnow().isoformat()
    
    # Notify other participants
    socketio.emit('user_left', {
        'user_id': user_id,
        'session_id': session_id,
        'participant_count': len(session['participants'])
    }, to=f"session_{session_id}")
    
    return {'message': 'Left session successfully'}

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    emit('connected', {'message': 'Connected to collaboration service'})

@socketio.on('join_session')
def handle_join_session(data):
    """Handle joining session via WebSocket"""
    session_id = data.get('session_id')
    user_id = data.get('user_id')
    
    join_room(f"session_{session_id}")
    
    if session_id in active_sessions:
        session = active_sessions[session_id]
        if user_id not in session['participants']:
            session['participants'].append(user_id)
            session['updated_at'] = datetime.utcnow().isoformat()
        
        emit('session_state', {
            'session_id': session_id,
            'participants': session['participants'],
            'settings': session.get('settings', {})
        }, to=f"session_{session_id}")

@socketio.on('yjs_sync_step1')
def handle_yjs_sync_step1(data):
    """
    Handle Yjs Sync Step 1.
    Client sends State Vector. Server calculates missing updates (Step 2).
    """
    session_id = data.get('session_id')
    state_vector = data.get('state_vector') # Expecting bytes or list of ints
    
    if not session_id:
        return
        
    # Convert list of ints to bytes if necessary (JSON serialization might make it list)
    if isinstance(state_vector, list):
        state_vector = bytes(state_vector)
        
    # Get Step 2 (updates for client)
    sync_step2 = session_manager.handle_sync_step1(session_id, state_vector)
    
    # Send back Step 2
    emit('yjs_sync_step2', {
        'session_id': session_id,
        'update': list(sync_step2) # Convert bytes back to list for JSON compatibility
    })
    
    # OPTIONAL: Send server's state vector so client can send missing updates to server?
    # For now, we assume client will push updates separately or we implement full 2-way sync here.
    # To keep it simple, we just respond with what the client is missing.

@socketio.on('yjs_update')
def handle_yjs_update(data):
    """
    Handle Yjs Document Update.
    Client sends an update. Server applies it and broadcasts to others.
    """
    session_id = data.get('session_id')
    update = data.get('update') # Expecting bytes or list of ints
    
    if not session_id or not update:
        return
        
    if isinstance(update, list):
        update = bytes(update)
        
    # Apply update using SessionManager
    session_manager.process_update(session_id, update)
    
    # Broadcast update to all other clients in the session
    emit('yjs_update', {
        'session_id': session_id,
        'update': list(update)
    }, to=f"session_{session_id}", include_self=False)

@socketio.on('cursor_position')
def handle_cursor_position(data):
    """Handle real-time cursor positions"""
    session_id = data.get('session_id')
    user_id = data.get('user_id')
    position = data.get('position')
    
    # Broadcast cursor position to all participants in session
    emit('cursor_updated', {
        'session_id': session_id,
        'user_id': user_id,
        'position': position,
        'timestamp': datetime.utcnow().isoformat()
    }, to=f"session_{session_id}", include_self=False)

@socketio.on('chat_message')
def handle_chat_message(data):
    """Handle real-time chat messages"""
    session_id = data.get('session_id')
    user_id = data.get('user_id')
    message = data.get('message')
    
    chat_message_data = {
        'id': str(uuid.uuid4()),
        'session_id': session_id,
        'user_id': user_id,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Broadcast chat message to all participants in session
    emit('chat_message', chat_message_data, to=f"session_{session_id}")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    emit('disconnected', {'message': 'Disconnected from collaboration service'})