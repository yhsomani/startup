import y_py as Y
from ypy_websocket.yutils import YMessageType, process_sync_message, create_sync_step1_message
import asyncio
import threading
from datetime import datetime

class SessionManager:
    def __init__(self):
        self._sessions = {}
        self._lock = threading.Lock()

    def get_doc(self, session_id):
        """Get or create a Y.Doc for the session"""
        with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = {
                    'doc': Y.YDoc(),
                    'created_at': datetime.utcnow(),
                    'last_updated': datetime.utcnow(),
                    'participants': set()
                }
                # Initialize with empty text if new
                text = self._sessions[session_id]['doc'].get_text('codemirror')
                if not str(text):
                    with self._sessions[session_id]['doc'].begin_transaction() as txn:
                        text.push(txn, "")
            
            return self._sessions[session_id]['doc']

    def handle_sync_step1(self, session_id, state_vector):
        """Handle incoming SyncStep1: Return SyncStep2 (missing updates)"""
        doc = self.get_doc(session_id)
        # In a real async server like FastAPI/aiohttp we would use ypy-websocket directly.
        # Here we are adapting for Flask-SocketIO (threads/eventlet), so we use low-level utils.
        
        # Calculate missing updates based on client's state vector (step 1 -> step 2)
        try:
             # If state_vector is empty/None, encode entire document
            if not state_vector:
                update = Y.encode_state_as_update(doc)
            else:
                update = Y.encode_state_as_update(doc, state_vector)
            
            return update
        except Exception as e:
            print(f"Error calculating sync step: {e}")
            return Y.encode_state_as_update(doc)

    def process_update(self, session_id, update_data):
        """Apply an update from a client"""
        doc = self.get_doc(session_id)
        with self._lock:
            with doc.begin_transaction() as txn:
                Y.apply_update(txn, update_data)
            self._sessions[session_id]['last_updated'] = datetime.utcnow()

    def get_document_state(self, session_id):
        """Get the full document state as update message (for new clients)"""
        doc = self.get_doc(session_id)
        update = Y.encode_state_as_update(doc)
        return update

session_manager = SessionManager()
