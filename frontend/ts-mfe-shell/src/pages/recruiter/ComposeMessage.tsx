import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ComposeMessage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const candidateId = searchParams.get("candidateId") || "";
    const candidateName = searchParams.get("candidateName") || "Developer";

    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [jobId, setJobId] = useState("");
    const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Load recruiter jobs for the dropdown
    useEffect(() => {
        // In a real app we would load real jobs via fetch('/api/jobs?employerId=...')
        // Using mock data for MVP UI
        setJobs([
            { id: "job-1", title: "Senior Software Engineer" },
            { id: "job-2", title: "Frontend Ninja" }
        ]);
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (body.length < 20 || body.length > 500) {
            setError("Message must be between 20 and 500 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    from_recruiter_id: user?.id || "mock-recruiter-id",
                    to_developer_id: candidateId || "mock-developer-id",
                    subject,
                    body,
                    job_id: jobId || null
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to send message");
            }

            setSuccessMessage("Message sent successfully! Redirecting to your pipeline...");
            setTimeout(() => {
                navigate("/employer/pipeline");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "An error occurred while sending.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "3rem auto", padding: "2rem", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
            <h2 style={{ marginTop: 0 }}>Message {candidateName}</h2>

            {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}
            {successMessage && <div style={{ background: "#dcfce7", color: "#16a34a", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>{successMessage}</div>}

            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Reference a Job (Optional)</label>
                    <select
                        value={jobId}
                        onChange={(e) => setJobId(e.target.value)}
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
                    >
                        <option value="">-- None --</option>
                        {jobs.map(job => (
                            <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Opportunity at TechCorp"
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db" }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>Message</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={6}
                        placeholder="Hi there! I saw your profile and..."
                        style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #d1d5db", resize: "vertical" }}
                    />
                    <div style={{ textAlign: "right", fontSize: "0.875rem", color: body.length < 20 || body.length > 500 ? "#ef4444" : "#6b7280", marginTop: "0.25rem" }}>
                        {body.length} / 500 (Min 20 chars)
                    </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{ padding: "0.75rem 1.5rem", background: "white", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontWeight: 500 }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || body.length < 20 || body.length > 500}
                        style={{
                            padding: "0.75rem 1.5rem",
                            background: isSubmitting || body.length < 20 || body.length > 500 ? "#818cf8" : "#4f46e5",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: (isSubmitting || body.length < 20 || body.length > 500) ? "not-allowed" : "pointer",
                            fontWeight: 500
                        }}
                    >
                        {isSubmitting ? "Sending..." : "Send Message"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ComposeMessage;
