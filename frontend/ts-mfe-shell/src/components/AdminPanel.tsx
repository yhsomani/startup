import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserRole } from "../types/auth";
import api from "../services/api";

interface User {
    id: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
}

interface Course {
    id: string;
    title: string;
    instructor_email: string;
    is_published: boolean;
    created_at: string;
    enrollment_count: number;
}

interface Stats {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    activeUsers: number;
}

type AdminTab = "overview" | "users" | "courses" | "settings";

export const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>("overview");
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        activeUsers: 0,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
        null
    );

    useEffect(() => {
        if (activeTab === "users") fetchUsers();
        if (activeTab === "courses") fetchCourses();
        if (activeTab === "overview") fetchStats();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/users");
            setUsers(response.data);
        } catch (error) {
            // Mock data for demo
            setUsers([
                {
                    id: "1",
                    email: "admin@talentsphere.com",
                    role: "ADMIN",
                    is_active: true,
                    created_at: "2024-01-01",
                },
                {
                    id: "2",
                    email: "instructor@demo.com",
                    role: "INSTRUCTOR",
                    is_active: true,
                    created_at: "2024-01-02",
                },
                {
                    id: "3",
                    email: "student@demo.com",
                    role: "STUDENT",
                    is_active: true,
                    created_at: "2024-01-03",
                },
                {
                    id: "4",
                    email: "recruiter@talentsphere.com",
                    role: "RECRUITER",
                    is_active: true,
                    created_at: "2024-01-04",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/courses");
            setCourses(response.data);
        } catch (error) {
            // Mock data
            setCourses([
                {
                    id: "1",
                    title: "Python Fundamentals",
                    instructor_email: "instructor@demo.com",
                    is_published: true,
                    created_at: "2024-01-01",
                    enrollment_count: 150,
                },
                {
                    id: "2",
                    title: "Full Stack Web Development",
                    instructor_email: "instructor@demo.com",
                    is_published: true,
                    created_at: "2024-01-02",
                    enrollment_count: 89,
                },
                {
                    id: "3",
                    title: "Data Science with Python",
                    instructor_email: "instructor@demo.com",
                    is_published: true,
                    created_at: "2024-01-03",
                    enrollment_count: 234,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get("/admin/stats");
            setStats(response.data);
        } catch (error) {
            setStats({ totalUsers: 4, totalCourses: 3, totalEnrollments: 473, activeUsers: 4 });
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: UserRole) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
            setMessage({ type: "success", text: "User role updated successfully" });
        } catch (error) {
            // Don't update state on failure - show error message instead
            setMessage({ type: "error", text: "Failed to update user role. Please try again." });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const toggleUserActive = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        try {
            await api.put(`/admin/users/${userId}/active`, { is_active: !user.is_active });
            setUsers(users.map(u => (u.id === userId ? { ...u, is_active: !u.is_active } : u)));
            setMessage({
                type: "success",
                text: `User ${user.is_active ? "deactivated" : "activated"}`,
            });
        } catch (error) {
            // Don't update state on failure - show error message instead
            setMessage({ type: "error", text: "Failed to update user status. Please try again." });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const tabStyle = (tab: AdminTab) => ({
        padding: "0.75rem 1.5rem",
        background:
            activeTab === tab ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" : "white",
        color: activeTab === tab ? "white" : "#4b5563",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "0.875rem",
        transition: "all 0.2s",
    });

    const cardStyle = {
        background: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    };

    return (
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "2rem",
                }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>⚙️ Admin Panel</h1>
                <span style={{ color: "#6b7280" }}>Logged in as: {user?.email}</span>
            </div>

            {message && (
                <div
                    style={{
                        padding: "1rem",
                        marginBottom: "1rem",
                        borderRadius: "8px",
                        background: message.type === "success" ? "#d1fae5" : "#fee2e2",
                        color: message.type === "success" ? "#065f46" : "#991b1b",
                    }}>
                    {message.text}
                </div>
            )}

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                <button style={tabStyle("overview")} onClick={() => setActiveTab("overview")}>
                    📊 Overview
                </button>
                <button style={tabStyle("users")} onClick={() => setActiveTab("users")}>
                    👥 Users
                </button>
                <button style={tabStyle("courses")} onClick={() => setActiveTab("courses")}>
                    📚 Courses
                </button>
                <button style={tabStyle("settings")} onClick={() => setActiveTab("settings")}>
                    🔧 Settings
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1.5rem",
                    }}>
                    <div
                        style={{
                            ...cardStyle,
                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                            color: "white",
                        }}>
                        <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>Total Users</div>
                        <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                            {stats.totalUsers}
                        </div>
                    </div>
                    <div
                        style={{
                            ...cardStyle,
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                        }}>
                        <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>Total Courses</div>
                        <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                            {stats.totalCourses}
                        </div>
                    </div>
                    <div
                        style={{
                            ...cardStyle,
                            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            color: "white",
                        }}>
                        <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>Enrollments</div>
                        <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                            {stats.totalEnrollments}
                        </div>
                    </div>
                    <div
                        style={{
                            ...cardStyle,
                            background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                            color: "white",
                        }}>
                        <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>Active Users</div>
                        <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
                            {stats.activeUsers}
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                        User Management
                    </h2>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                                    <th
                                        style={{
                                            padding: "0.75rem",
                                            textAlign: "left",
                                            fontWeight: 600,
                                        }}>
                                        Email
                                    </th>
                                    <th
                                        style={{
                                            padding: "0.75rem",
                                            textAlign: "left",
                                            fontWeight: 600,
                                        }}>
                                        Role
                                    </th>
                                    <th
                                        style={{
                                            padding: "0.75rem",
                                            textAlign: "left",
                                            fontWeight: 600,
                                        }}>
                                        Status
                                    </th>
                                    <th
                                        style={{
                                            padding: "0.75rem",
                                            textAlign: "left",
                                            fontWeight: 600,
                                        }}>
                                        Created
                                    </th>
                                    <th
                                        style={{
                                            padding: "0.75rem",
                                            textAlign: "right",
                                            fontWeight: 600,
                                        }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                        <td style={{ padding: "0.75rem" }}>{u.email}</td>
                                        <td style={{ padding: "0.75rem" }}>
                                            <select
                                                value={u.role}
                                                onChange={e =>
                                                    updateUserRole(u.id, e.target.value as UserRole)
                                                }
                                                style={{
                                                    padding: "0.375rem 0.75rem",
                                                    borderRadius: "6px",
                                                    border: "1px solid #d1d5db",
                                                    background: "white",
                                                    cursor: "pointer",
                                                }}>
                                                <option value="STUDENT">STUDENT</option>
                                                <option value="INSTRUCTOR">INSTRUCTOR</option>
                                                <option value="RECRUITER">RECRUITER</option>
                                                <option value="ADMIN">ADMIN</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: "0.75rem" }}>
                                            <span
                                                style={{
                                                    padding: "0.25rem 0.75rem",
                                                    borderRadius: "9999px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    background: u.is_active ? "#d1fae5" : "#fee2e2",
                                                    color: u.is_active ? "#065f46" : "#991b1b",
                                                }}>
                                                {u.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "0.75rem", color: "#6b7280" }}>
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: "0.75rem", textAlign: "right" }}>
                                            <button
                                                onClick={() => toggleUserActive(u.id)}
                                                style={{
                                                    padding: "0.375rem 0.75rem",
                                                    borderRadius: "6px",
                                                    border: "none",
                                                    background: u.is_active ? "#fee2e2" : "#d1fae5",
                                                    color: u.is_active ? "#991b1b" : "#065f46",
                                                    cursor: "pointer",
                                                    fontWeight: 500,
                                                    fontSize: "0.875rem",
                                                }}>
                                                {u.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                        Course Management
                    </h2>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "2rem" }}>Loading...</div>
                    ) : (
                        <div style={{ display: "grid", gap: "1rem" }}>
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1rem",
                                        background: "#f9fafb",
                                        borderRadius: "8px",
                                    }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{course.title}</div>
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                                            by {course.instructor_email} • {course.enrollment_count}{" "}
                                            enrollments
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "0.5rem",
                                            alignItems: "center",
                                        }}>
                                        <span
                                            style={{
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "9999px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                background: course.is_published
                                                    ? "#d1fae5"
                                                    : "#fef3c7",
                                                color: course.is_published ? "#065f46" : "#92400e",
                                            }}>
                                            {course.is_published ? "Published" : "Draft"}
                                        </span>
                                        <button
                                            style={{
                                                padding: "0.375rem 0.75rem",
                                                borderRadius: "6px",
                                                border: "1px solid #d1d5db",
                                                background: "white",
                                                cursor: "pointer",
                                                fontSize: "0.875rem",
                                            }}>
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
                <div style={cardStyle}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>
                        System Settings
                    </h2>
                    <div style={{ display: "grid", gap: "1.5rem", maxWidth: "600px" }}>
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: 500,
                                }}>
                                Platform Name
                            </label>
                            <input
                                type="text"
                                defaultValue="TalentSphere"
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                }}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: 500,
                                }}>
                                Support Email
                            </label>
                            <input
                                type="email"
                                defaultValue="support@talentsphere.com"
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                }}
                            />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <input
                                type="checkbox"
                                id="maintenance"
                                style={{ width: "20px", height: "20px" }}
                            />
                            <label htmlFor="maintenance" style={{ fontWeight: 500 }}>
                                Enable Maintenance Mode
                            </label>
                        </div>
                        <button
                            style={{
                                padding: "0.75rem 1.5rem",
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: 600,
                                width: "fit-content",
                            }}>
                            Save Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
