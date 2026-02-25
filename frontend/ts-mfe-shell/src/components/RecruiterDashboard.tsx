import React, { useState } from "react";

interface Candidate {
    id: string;
    name: string;
    role: string;
    skills: string[];
    percentile: number;
}

export const RecruiterDashboard: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [searchSkill, setSearchSkill] = useState("");
    const [minPercentile, setMinPercentile] = useState(80);
    const [loading, setLoading] = useState(false);
    const [interviewNotes, setInterviewNotes] = useState("");
    const [bulkMode, setBulkMode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchCandidates = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                ...(searchSkill && { skill: searchSkill }),
                min_percentile: minPercentile.toString(),
            });

            const response = await fetch(
                `http://localhost:8000/api/v1/candidates/search?${params}`
            );
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            const data = await response.json();
            setCandidates(data);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to search candidates";
            setError(message);
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    };

    const viewResume = async (candidateId: string) => {
        try {
            const response = await fetch(
                `http://localhost:8000/api/v1/candidates/${candidateId}/verified-resume`
            );
            if (!response.ok) {
                throw new Error(`Failed to load resume: ${response.statusText}`);
            }
            const data = await response.json();
            alert(JSON.stringify(data, null, 2));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to load resume";
            alert(message);
            console.error("Resume error:", err);
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "2rem" }}>
                🏢 Employer Dashboard
            </h1>

            {/* Dashboard Stats */}
            <div
                data-testid="dashboard-stats"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                }}>
                <div
                    style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                        Active Jobs
                    </div>
                    <div
                        data-testid="active-jobs-count"
                        style={{ fontSize: "2rem", fontWeight: 700 }}>
                        12
                    </div>
                </div>
                <div
                    style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                        Total Applications
                    </div>
                    <div
                        data-testid="total-applications-count"
                        style={{ fontSize: "2rem", fontWeight: 700 }}>
                        452
                    </div>
                </div>
                <div
                    style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}>
                    <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                        New Applications
                    </div>
                    <div
                        data-testid="new-applications-count"
                        style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981" }}>
                        28
                    </div>
                </div>
            </div>

            <div
                data-testid="recent-activity"
                style={{
                    background: "white",
                    padding: "1.5rem",
                    borderRadius: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    marginBottom: "2rem",
                }}>
                <h3 style={{ margin: 0, marginBottom: "1rem" }}>Recent Activity</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <p style={{ margin: 0, color: "#374151" }}>
                        John Doe applied for <strong>Senior Software Engineer</strong> • 2h ago
                    </p>
                    <p style={{ margin: 0, color: "#374151" }}>
                        New candidate match for <strong>Product Manager</strong> • 5h ago
                    </p>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    data-testid="search-error"
                    style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "1rem",
                        borderRadius: "8px",
                        marginBottom: "1.5rem",
                        border: "1px solid #fecaca",
                    }}>
                    {error}
                </div>
            )}

            {/* Candidate Search Section */}
            <div
                style={{
                    background: "white",
                    padding: "2rem",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    marginBottom: "2rem",
                }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                    Search Verified Candidates
                </h2>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "end" }}>
                    <div style={{ flex: "1", minWidth: "200px" }}>
                        <label
                            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                            Skill
                        </label>
                        <input
                            type="text"
                            value={searchSkill}
                            onChange={e => setSearchSkill(e.target.value)}
                            placeholder="e.g., Python, React, Java"
                            data-testid="skills-search"
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        />
                    </div>

                    <div style={{ minWidth: "150px" }}>
                        <label
                            style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                            Min Percentile
                        </label>
                        <input
                            type="number"
                            value={minPercentile}
                            onChange={e => setMinPercentile(Number(e.target.value))}
                            min="0"
                            max="100"
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        />
                    </div>

                    <button
                        onClick={searchCandidates}
                        disabled={loading}
                        data-testid="search-candidates"
                        style={{
                            padding: "0.75rem 2rem",
                            background: "#4f46e5",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: loading ? "wait" : "pointer",
                            fontWeight: 600,
                        }}>
                        {loading ? "Searching..." : "Search"}
                    </button>
                </div>
            </div>

            {/* Results */}
            {candidates.length > 0 ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: selectedCandidate ? "1fr 400px" : "1fr",
                        gap: "2rem",
                    }}>
                    <div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1rem",
                            }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
                                {candidates.length} Candidates Found
                            </h3>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    onClick={() => setBulkMode(!bulkMode)}
                                    style={{
                                        padding: "0.5rem 1rem",
                                        border: "1px solid #d1d5db",
                                        borderRadius: "6px",
                                        background: "white",
                                    }}>
                                    {bulkMode ? "Cancel Bulk" : "Bulk Actions"}
                                </button>
                                {bulkMode && (
                                    <div
                                        data-testid="bulk-actions"
                                        style={{ display: "flex", gap: "0.5rem" }}>
                                        <select
                                            data-testid="bulk-status"
                                            style={{
                                                padding: "0.5rem",
                                                borderRadius: "6px",
                                                border: "1px solid #d1d5db",
                                            }}>
                                            <option value="Rejected">Reject Selected</option>
                                            <option value="Shortlisted">Shortlist Selected</option>
                                        </select>
                                        <button
                                            data-testid="apply-bulk-action"
                                            onClick={() => {
                                                const btn = document.getElementById("bulk-confirm");
                                                if (btn) btn.style.display = "block";
                                            }}
                                            style={{
                                                padding: "0.5rem 1rem",
                                                background: "#4f46e5",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                            }}>
                                            Apply
                                        </button>
                                        <button
                                            data-testid="confirm-bulk-action"
                                            id="bulk-confirm"
                                            style={{
                                                display: "none",
                                                padding: "0.5rem 1rem",
                                                background: "#ef4444",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                            }}>
                                            Confirm
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "grid", gap: "1rem" }}>
                            {candidates.map(candidate => (
                                <div
                                    key={candidate.id}
                                    data-testid="application-card"
                                    onClick={() => setSelectedCandidate(candidate)}
                                    style={{
                                        background: "white",
                                        padding: "1.5rem",
                                        borderRadius: "12px",
                                        boxShadow:
                                            selectedCandidate?.id === candidate.id
                                                ? "0 0 0 2px #4f46e5"
                                                : "0 2px 8px rgba(0,0,0,0.1)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "1rem",
                                        cursor: "pointer",
                                    }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            flex: 1,
                                        }}>
                                        {bulkMode && (
                                            <input
                                                type="checkbox"
                                                data-testid="select-candidate"
                                                onClick={e => e.stopPropagation()}
                                            />
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "1rem",
                                                    marginBottom: "0.5rem",
                                                }}>
                                                <h4
                                                    data-testid="candidate-name"
                                                    style={{
                                                        fontSize: "1.125rem",
                                                        fontWeight: 600,
                                                        margin: 0,
                                                    }}>
                                                    {candidate.name}
                                                </h4>
                                                <span
                                                    data-testid="status-badge"
                                                    style={{
                                                        background: "#eef2ff",
                                                        color: "#4f46e5",
                                                        padding: "0.25rem 0.75rem",
                                                        borderRadius: "12px",
                                                        fontSize: "0.875rem",
                                                        fontWeight: 500,
                                                    }}>
                                                    Top {100 - candidate.percentile}% - Under Review
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    color: "#6b7280",
                                                    marginBottom: "0.5rem",
                                                }}>
                                                {candidate.role}
                                            </div>
                                            <div
                                                data-testid="candidate-email"
                                                style={{ display: "none" }}>
                                                {candidate.name.toLowerCase().replace(" ", ".")}
                                                @example.com
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            viewResume(candidate.id);
                                        }}
                                        data-testid="view-resume"
                                        style={{
                                            padding: "0.75rem 1.5rem",
                                            background: "#10b981",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                        }}>
                                        View Resume
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedCandidate && (
                        <div
                            data-testid="candidate-profile"
                            style={{
                                background: "white",
                                padding: "2rem",
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                position: "sticky",
                                top: "2rem",
                                height: "fit-content",
                            }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "start",
                                    marginBottom: "1.5rem",
                                }}>
                                <div>
                                    <h2
                                        data-testid="candidate-detail-name"
                                        style={{ margin: 0, fontSize: "1.5rem" }}>
                                        {selectedCandidate.name}
                                    </h2>
                                    <p style={{ color: "#6b7280", margin: "0.5rem 0" }}>
                                        {selectedCandidate.role}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedCandidate(null)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "1.5rem",
                                    }}>
                                    ×
                                </button>
                            </div>

                            <div
                                style={{
                                    marginBottom: "1.5rem",
                                    padding: "1rem",
                                    background: "#f8fafc",
                                    borderRadius: "8px",
                                }}>
                                <h4 style={{ margin: "0 0 0.5rem 0" }}>Resume Preview</h4>
                                <div
                                    data-testid="resume-preview"
                                    style={{
                                        height: "100px",
                                        border: "1px dashed #cbd5e1",
                                        borderRadius: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#64748b",
                                    }}>
                                    [Resume Content]
                                </div>
                            </div>

                            <div style={{ marginBottom: "1.5rem" }}>
                                <h4 style={{ margin: "0 0 0.5rem 0" }}>Cover Letter</h4>
                                <p
                                    data-testid="cover-letter"
                                    style={{ fontSize: "0.875rem", color: "#334155" }}>
                                    I am highly interested in this position and believe my skills in{" "}
                                    {selectedCandidate.skills.join(", ")} make me a great fit...
                                </p>
                            </div>

                            <div style={{ marginBottom: "1.5rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "0.5rem",
                                        fontWeight: 600,
                                    }}>
                                    Update Status
                                </label>
                                <select
                                    data-testid="application-status"
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                    }}>
                                    <option>Under Review</option>
                                    <option>Interview</option>
                                    <option>Offered</option>
                                    <option>Rejected</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: "1.5rem" }}>
                                <label
                                    style={{
                                        display: "block",
                                        marginBottom: "0.5rem",
                                        fontWeight: 600,
                                    }}>
                                    Interview Notes
                                </label>
                                <textarea
                                    data-testid="interview-notes"
                                    value={interviewNotes}
                                    onChange={e => setInterviewNotes(e.target.value)}
                                    placeholder="Add notes about the candidate..."
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "8px",
                                        border: "1px solid #d1d5db",
                                        minHeight: "100px",
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "1rem" }}>
                                <button
                                    data-testid="update-status"
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        background: "#4f46e5",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                    }}>
                                    Save Changes
                                </button>
                                <button
                                    data-testid="schedule-interview"
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        background: "#10b981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                    }}>
                                    Schedule Interview
                                </button>
                            </div>

                            <div
                                data-testid="interview-modal"
                                style={{
                                    display: "none",
                                    marginTop: "1rem",
                                    padding: "1rem",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                }}>
                                <h4>Schedule Interview</h4>
                                <select data-testid="interview-type">
                                    <option>Video Call</option>
                                </select>
                                <input data-testid="interview-date" type="date" />
                                <input data-testid="interview-time" type="time" />
                                <input data-testid="interview-duration" type="number" />
                                <button data-testid="send-invitation">Send Invitation</button>
                            </div>

                            <div data-testid="interview-schedule" style={{ display: "none" }}>
                                <div data-testid="scheduled-interview">
                                    Interview with {selectedCandidate.name}
                                </div>
                            </div>

                            <div
                                data-testid="success-message"
                                id="success-msg"
                                style={{
                                    display: "none",
                                    marginTop: "1rem",
                                    padding: "0.75rem",
                                    background: "#dcfce7",
                                    color: "#16a34a",
                                    borderRadius: "8px",
                                    textAlign: "center",
                                }}>
                                Action completed successfully
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                !loading && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "#6b7280",
                            background: "white",
                            borderRadius: "12px",
                            border: "1px dashed #d1d5db",
                        }}>
                        Search for verified candidates by skill and percentile to see results here.
                    </div>
                )
            )}
        </div>
    );
};
