import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface Enrollment {
    id: string;
    courseId: string;
    courseTitle: string;
    instructorName: string;
    courseThumbnail: string; // URL or placeholder
    progressPercentage: number;
    enrolledAt: string;
    completedAt: string | null;
    lastAccessedAt: string;
}

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<"in_progress" | "completed" | "all">("in_progress");

    useEffect(() => {
        const fetchEnrollments = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId) {
                navigate("/login");
                return;
            }

            try {
                // Fetch enrollments from LMS service via Gateway
                // Assuming path: /enrollments/user/:userId
                // The spec said /api/v1/enrollments/user/:userId
                const response = await api.get(`/enrollments/user/${userId}`);
                // API returns a List (Array), so use response.data directly
                setEnrollments(Array.isArray(response.data) ? response.data : []);
                setLoading(false);
            } catch (err: any) {
                console.error(err);
                setError("Failed to load enrollments.");
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, [navigate]);

    const filteredEnrollments = enrollments.filter(e => {
        if (filter === "in_progress") return e.progressPercentage < 100;
        if (filter === "completed") return e.progressPercentage === 100;
        return true;
    });

    const stats = {
        totalEnrolled: enrollments.length,
        completed: enrollments.filter(e => e.progressPercentage === 100).length,
        hours: 0,
    };

    const userPoints = parseInt(localStorage.getItem("userPoints") || "0");
    const userStreak = parseInt(localStorage.getItem("userStreak") || "0");
    const userBadges: string[] = JSON.parse(localStorage.getItem("userBadges") || "[]");

    if (loading)
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px",
                }}>
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: "40px",
                            height: "40px",
                            border: "4px solid #e5e7eb",
                            borderTop: "4px solid #4f46e5",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            margin: "0 auto 1rem",
                        }}></div>
                    <p style={{ color: "#6b7280" }}>Loading your dashboard...</p>
                </div>
            </div>
        );
    if (error)
        return (
            <div
                style={{
                    maxWidth: "500px",
                    margin: "4rem auto",
                    textAlign: "center",
                    padding: "2rem",
                }}>
                <div
                    style={{
                        width: "64px",
                        height: "64px",
                        background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                        borderRadius: "50%",
                        margin: "0 auto 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                    <span style={{ fontSize: "1.5rem" }}>📚</span>
                </div>
                <h2
                    style={{
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        color: "#1f2937",
                        marginBottom: "0.5rem",
                    }}>
                    Start Your Learning Journey
                </h2>
                <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                    Browse our courses and enroll to see your progress here.
                </p>
                <button
                    onClick={() => navigate("/courses")}
                    style={{
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        color: "white",
                        padding: "0.75rem 2rem",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                        boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.3)",
                    }}>
                    Explore Courses
                </button>
            </div>
        );

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
            {/* Header */}
            <div style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#1f2937" }}>
                    Welcome Back!
                </h1>
                <p style={{ color: "#6b7280" }}>Track your progress and continue learning.</p>
            </div>

            {/* Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                    marginBottom: "2rem",
                }}>
                <div
                    className="stat-card"
                    style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}>
                    <div
                        style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}>
                        Enrolled Courses
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#4f46e5" }}>
                        {stats.totalEnrolled}
                    </div>
                </div>
                <div
                    className="stat-card"
                    style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}>
                    <div
                        style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}>
                        Completed
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#059669" }}>
                        {stats.completed}
                    </div>
                </div>
                <div
                    className="stat-card"
                    style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}>
                    <div
                        style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}>
                        Points
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b" }}>
                        {userPoints}
                    </div>
                </div>
                <div
                    className="stat-card"
                    style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}>
                    <div
                        style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}>
                        Day Streak
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#ef4444" }}>
                        {userStreak}
                    </div>
                </div>
                <div
                    className="stat-card"
                    style={{
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}>
                    <div
                        style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                        }}>
                        Badges
                    </div>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#8b5cf6" }}>
                        {userBadges.length}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #e5e7eb" }}>
                <button
                    onClick={() => setFilter("in_progress")}
                    style={{
                        padding: "0.75rem 1.5rem",
                        borderBottom: filter === "in_progress" ? "2px solid #4f46e5" : "none",
                        color: filter === "in_progress" ? "#4f46e5" : "#6b7280",
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                    }}>
                    In Progress
                </button>
                <button
                    onClick={() => setFilter("completed")}
                    style={{
                        padding: "0.75rem 1.5rem",
                        borderBottom: filter === "completed" ? "2px solid #4f46e5" : "none",
                        color: filter === "completed" ? "#4f46e5" : "#6b7280",
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                    }}>
                    Completed
                </button>
                <button
                    onClick={() => setFilter("all")}
                    style={{
                        padding: "0.75rem 1.5rem",
                        borderBottom: filter === "all" ? "2px solid #4f46e5" : "none",
                        color: filter === "all" ? "#4f46e5" : "#6b7280",
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                    }}>
                    All Courses
                </button>
            </div>

            {/* Course Grid */}
            {filteredEnrollments.length === 0 ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: "4rem",
                        background: "#f9fafb",
                        borderRadius: "8px",
                    }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#374151" }}>
                        No courses found.
                    </h3>
                    <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                        Start your learning journey today!
                    </p>
                    <button
                        onClick={() => navigate("/courses")}
                        style={{
                            background: "#4f46e5",
                            color: "white",
                            padding: "0.75rem 1.5rem",
                            borderRadius: "4px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                        }}>
                        Explore Courses
                    </button>
                </div>
            ) : (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "2rem",
                    }}>
                    {filteredEnrollments.map(enrollment => (
                        <div
                            key={enrollment.id}
                            style={{
                                background: "white",
                                borderRadius: "8px",
                                overflow: "hidden",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                display: "flex",
                                flexDirection: "column",
                            }}>
                            <div
                                style={{
                                    height: "160px",
                                    background: "#e5e7eb",
                                    position: "relative",
                                }}>
                                {enrollment.courseThumbnail ? (
                                    <img
                                        src={enrollment.courseThumbnail}
                                        alt={enrollment.courseTitle}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            height: "100%",
                                            color: "#9ca3af",
                                        }}>
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div
                                style={{
                                    padding: "1.5rem",
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                }}>
                                <h3
                                    style={{
                                        fontSize: "1.125rem",
                                        fontWeight: 600,
                                        marginBottom: "0.5rem",
                                        color: "#111827",
                                    }}>
                                    {enrollment.courseTitle}
                                </h3>
                                <p
                                    style={{
                                        fontSize: "0.875rem",
                                        color: "#6b7280",
                                        marginBottom: "1rem",
                                    }}>
                                    {enrollment.instructorName}
                                </p>

                                <div style={{ marginTop: "auto" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: "0.875rem",
                                            marginBottom: "0.25rem",
                                            color: "#4b5563",
                                        }}>
                                        <span>Progress</span>
                                        <span>{enrollment.progressPercentage}%</span>
                                    </div>
                                    <div
                                        style={{
                                            height: "8px",
                                            background: "#e5e7eb",
                                            borderRadius: "4px",
                                            overflow: "hidden",
                                        }}>
                                        <div
                                            style={{
                                                width: `${enrollment.progressPercentage}%`,
                                                background: "#4f46e5",
                                                height: "100%",
                                            }}></div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            navigate(`/courses/${enrollment.courseId}/learn`)
                                        }
                                        style={{
                                            width: "100%",
                                            marginTop: "1rem",
                                            padding: "0.625rem",
                                            background:
                                                enrollment.progressPercentage === 100
                                                    ? "#059669"
                                                    : "#4f46e5",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                        }}>
                                        {enrollment.progressPercentage === 100
                                            ? "Review Course"
                                            : enrollment.progressPercentage === 0
                                              ? "Start Learning"
                                              : "Resume Learning"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
