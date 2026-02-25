import React, { useState } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export const AIAssistant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(true); // Start minimized

    const sendMessage = async () => {
        if (!input.trim()) return;

        setError(null);
        const userMessage: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/api/v1/assistant/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input }),
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.statusText}`);
            }

            const data = await response.json();
            const assistantMessage: Message = {
                role: "assistant",
                content: data.response,
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to get response";
            setError(message);
            console.error("AI Assistant error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Minimized state - small floating button
    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                aria-label="Open AI Tutor"
                style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "white",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.4)",
                    cursor: "pointer",
                    fontSize: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.2s ease",
                    zIndex: 1000,
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                🤖
            </button>
        );
    }

    return (
        <div
            style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                width: "350px",
                height: "450px",
                border: "none",
                borderRadius: "16px",
                background: "white",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                zIndex: 1000,
                overflow: "hidden",
            }}>
            <div
                style={{
                    padding: "0.75rem 1rem",
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "white",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                <span>🤖 AI Tutor</span>
                <button
                    onClick={() => setIsMinimized(true)}
                    aria-label="Minimize AI Tutor"
                    style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "none",
                        color: "white",
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                    ✕
                </button>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    background: "#f9fafb",
                }}>
                {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: "2rem 1rem" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👋</div>
                        <p>Hi! I'm your AI tutor. Ask me anything about your courses!</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                            background:
                                msg.role === "user"
                                    ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                                    : "white",
                            color: msg.role === "user" ? "white" : "#1f2937",
                            padding: "0.75rem 1rem",
                            borderRadius:
                                msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            maxWidth: "85%",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        }}>
                        {msg.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: "flex-start", color: "#6b7280", fontStyle: "italic" }}>
                        ✨ Thinking...
                    </div>
                )}
                {error && (
                    <div
                        style={{
                            alignSelf: "flex-start",
                            color: "#dc2626",
                            background: "#fee2e2",
                            padding: "0.5rem",
                            borderRadius: "4px",
                        }}>
                        {error}
                    </div>
                )}
            </div>

            <div
                style={{
                    padding: "0.75rem",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    gap: "0.5rem",
                    background: "white",
                }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && sendMessage()}
                    placeholder="Ask me anything..."
                    aria-label="Chat message input"
                    style={{
                        flex: 1,
                        padding: "0.625rem 0.875rem",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        outline: "none",
                        transition: "border-color 0.2s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#4f46e5")}
                    onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                    style={{
                        padding: "0.625rem 1rem",
                        background:
                            loading || !input.trim()
                                ? "#d1d5db"
                                : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                        fontWeight: 500,
                    }}>
                    Send
                </button>
            </div>
        </div>
    );
};
