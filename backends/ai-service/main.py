from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os

app = FastAPI(title="TalentSphere AI Service", description="AI Assistant and Recommendations API")

class AIQuery(BaseModel):
    query: str
    context: dict = None

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    context: dict = None

class ResumeParse(BaseModel):
    resume_text: str

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ai-service"}

@app.post("/api/v1/assistant/chat")
def chat_assistant(query: AIQuery):
    # Legacy Mock AI response
    return {"response": f"Mock AI response to: {query.query}", "intent": "general"}

@app.post("/api/v1/ai/chat")
def ai_chat(req: ChatRequest):
    """
    New API endpoint for AIAssistantPage frontend component.
    """
    message_content = req.message.lower()
    
    # Simple mock response logic based on keywords
    reply = f"I received your message: '{req.message}'. I am a mock AI assistant."
    
    if "code" in message_content or "debug" in message_content:
        reply = "Here is a code snippet to help you:\n```javascript\nfunction greet() {\n  console.log('Hello World!');\n}\n```\nLet me know if you need any further explanation!"
        
    if "hello" in message_content or "hi " in message_content:
        reply = "Hello! I am TalentSphere's AI assistant. How can I help you today?"
        
    return {
        "reply": reply,
        "tokens_used": len(req.message.split()) + len(reply.split()),
        "status": "success"
    }

@app.post("/api/v1/assistant/recommend-jobs")
def recommend_jobs(user_id: str):
    # Mock job recommendation
    return {"jobs": ["job-1", "job-2", "job-3"]}

@app.post("/api/v1/assistant/parse-resume")
def parse_resume(data: ResumeParse):
    # Mock resume parsing
    return {"skills": ["Python", "FastAPI"], "experience_years": 5}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5005))
    uvicorn.run(app, host="0.0.0.0", port=port)
