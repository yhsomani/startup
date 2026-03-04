import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface Message {
    id: string;
    from_recruiter_id: string;
    recruiter_company?: string;
    subject: string;
    body: string;
    status: 'sent' | 'read' | 'replied' | 'archived';
    sent_at: string;
}

const Inbox: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [replyStatus, setReplyStatus] = useState<"idle" | "success" | "error">("idle");

    useEffect(() => {
        const fetchInbox = async () => {
            try {
                const res = await fetch(`/api/v1/messages?userId=${user?.id || 'mock-developer-id'}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (err) {
                console.error("Failed to fetch inbox", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInbox();
    }, [user?.id]);

    const handleSelectMessage = async (msg: Message) => {
        setSelectedMessage(msg);
        setReplyStatus("idle");
        setReplyText("");

        if (msg.status === 'sent') {
            try {
                await fetch(`/api/v1/messages/${msg.id}/read`, { method: 'PUT' });
                // Optimistically update local state
                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m));
            } catch (err) {
                console.error("Failed to mark read");
            }
        }
    };

    const handleSendReply = async () => {
        if (!selectedMessage || replyText.length < 5) return;

        setIsReplying(true);
        setReplyStatus("idle");

        try {
            const res = await fetch(`/api/v1/messages/${selectedMessage.id}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: replyText })
            });

            if (res.ok) {
                setReplyStatus("success");
                setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, status: 'replied' } : m));
                setTimeout(() => setSelectedMessage(null), 2000);
            } else {
                setReplyStatus("error");
            }
        } catch (err) {
            setReplyStatus("error");
        } finally {
            setIsReplying(false);
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "2rem", height: "calc(100vh - 120px)" }}>
            {/* Inbox List */}
            <div style={{ flex: "1", background: "white", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    <h2 style={{ margin: 0 }}>Inbox</h2>
                </div>

                <div style={{ flex: 1, overflowY: "auto" }}>
                    {isLoading ? (
                        <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Loading...</div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📭</div>
                            No messages yet.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => handleSelectMessage(msg)}
                                    style={{
                                        padding: "1.5rem",
                                        borderBottom: "1px solid #e2e8f0",
                                        cursor: "pointer",
                                        background: selectedMessage?.id === msg.id ? "#eff6ff" : (msg.status === 'sent' ? "#f0fdf4" : "white"),
                                        transition: "background 0.2s"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                        <div style={{ fontWeight: msg.status === 'sent' ? 700 : 500 }}>{msg.recruiter_company || "Recruiter"}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(msg.sent_at).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ fontWeight: msg.status === 'sent' ? 600 : 500, color: "#1e293b", marginBottom: "0.5rem" }}>
                                        {msg.subject || "(No Subject)"}
                                    </div>
                                    <div style={{ fontSize: "0.875rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                        {msg.body}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reading/Reply Section */}
            <div style={{ flex: "2", background: "white", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {!selectedMessage ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", flexDirection: "column" }}>
                        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✉️</div>
                        <h3>Select a message to read</h3>
                    </div>
                ) : (
                    <>
                        <div style={{ padding: "2rem", borderBottom: "1px solid #e2e8f0", overflowY: "auto", flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
                                <div>
                                    <h2 style={{ margin: "0 0 0.5rem 0" }}>{selectedMessage.subject || "No Subject"}</h2>
                                    <div style={{ color: "#475569", fontWeight: 500 }}>From: {selectedMessage.recruiter_company || "Recruiter"}</div>
                                </div>
                                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>{new Date(selectedMessage.sent_at).toLocaleString()}</div>
                            </div>
                            <div style={{ lineHeight: "1.6", color: "#334155", whiteSpace: "pre-wrap" }}>
                                {selectedMessage.body}
                            </div>
                        </div>

                        <div style={{ padding: "2rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                            {selectedMessage.status === 'replied' ? (
                                <div style={{ padding: "1rem", background: "#dcfce7", color: "#166534", borderRadius: "8px", textAlign: "center", fontWeight: 500 }}>
                                    ✓ You have replied to this message.
                                </div>
                            ) : (
                                <div>
                                    <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Draft Reply</h3>
                                    {replyStatus === "error" && <div style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "0.875rem" }}>Failed to send reply. Please try again.</div>}
                                    {replyStatus === "success" ? (
                                        <div style={{ color: "#16a34a", padding: "1rem", background: "#dcfce7", borderRadius: "8px" }}>Reply sent successfully!</div>
                                    ) : (
                                        <>
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write your response here..."
                                                rows={5}
                                                style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none", marginBottom: "1rem", fontFamily: "inherit" }}
                                            />
                                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                                <button
                                                    onClick={handleSendReply}
                                                    disabled={replyText.length < 5 || isReplying}
                                                    style={{
                                                        padding: "0.75rem 2rem",
                                                        background: replyText.length < 5 || isReplying ? "#94a3b8" : "#4f46e5",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontWeight: 600,
                                                        cursor: replyText.length < 5 || isReplying ? "not-allowed" : "pointer"
                                                    }}
                                                >
                                                    {isReplying ? "Sending..." : "Send Reply"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Inbox;
