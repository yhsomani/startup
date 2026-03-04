import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";

interface Message {
    id: string;
    to_developer_id: string;
    developer_name?: string;
    subject: string;
    body: string;
    status: 'sent' | 'read' | 'replied' | 'archived';
    sent_at: string;
}

const Pipeline: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPipeline = async () => {
            try {
                // In production, user.id would be correct. For MVP demo we'll use a hardcoded fallback 
                // if it's not present on the backend context yet.
                const res = await fetch(`/api/v1/messages?userId=${user?.id || 'mock-recruiter-id'}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (err) {
                console.error("Failed to fetch pipeline", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPipeline();
    }, [user?.id]);

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h2 style={{ margin: 0 }}>Outbound Pipeline</h2>
                <Link to="/candidates" style={{ padding: "0.75rem 1.5rem", background: "#4f46e5", color: "white", textDecoration: "none", borderRadius: "8px", fontWeight: 500 }}>
                    Find Candidates
                </Link>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
                    ⏳ Loading pipeline...
                </div>
            ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", background: "white", padding: "4rem", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📨</div>
                    <h3 style={{ margin: "0 0 0.5rem 0" }}>No outbound messages yet</h3>
                    <p style={{ color: "#6b7280", margin: "0 0 1.5rem 0" }}>Reach out directly to developers to initiate contact.</p>
                </div>
            ) : (
                <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#475569" }}>Candidate</th>
                                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#475569" }}>Subject</th>
                                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#475569" }}>Status</th>
                                <th style={{ padding: "1rem 1.5rem", textAlign: "left", fontWeight: 600, color: "#475569" }}>Date Sent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map((msg) => (
                                <tr key={msg.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                    <td style={{ padding: "1rem 1.5rem" }}>
                                        <div style={{ fontWeight: 500, color: "#1e293b" }}>{msg.developer_name || "Unknown Developer"}</div>
                                    </td>
                                    <td style={{ padding: "1rem 1.5rem", color: "#475569" }}>
                                        {msg.subject || "(No Subject)"}
                                    </td>
                                    <td style={{ padding: "1rem 1.5rem" }}>
                                        <span style={{
                                            padding: "0.25rem 0.75rem",
                                            borderRadius: "9999px",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            backgroundColor: msg.status === 'replied' ? '#dcfce7' : msg.status === 'read' ? '#dbeafe' : '#f1f5f9',
                                            color: msg.status === 'replied' ? '#166534' : msg.status === 'read' ? '#1e40af' : '#475569',
                                            textTransform: 'capitalize'
                                        }}>
                                            {msg.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem 1.5rem", color: "#64748b" }}>
                                        {new Date(msg.sent_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Pipeline;
