import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateJob: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Engineering');
    const [type, setType] = useState('Full-time');
    const [salaryRange, setSalaryRange] = useState('');
    const [location, setLocation] = useState('');

    // Skills based on the Phase 2 taxonomy mapped previously
    const availableSkills = ['React', 'Node.js', 'Python', 'Arrays', 'Hash Maps', 'AWS', 'Docker', 'GraphQL'];

    const [selectedSkills, setSelectedSkills] = useState<{ name: string, level: string }[]>([]);

    const handleAddSkill = (skill: string) => {
        if (!selectedSkills.find(s => s.name === skill)) {
            setSelectedSkills([...selectedSkills, { name: skill, level: 'intermediate' }]);
        }
    };

    const handleRemoveSkill = (skill: string) => {
        setSelectedSkills(selectedSkills.filter(s => s.name !== skill));
    };

    const handleLevelChange = (skill: string, level: string) => {
        setSelectedSkills(selectedSkills.map(s => s.name === skill ? { ...s, level } : s));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Transform internal state to match the backend contract for Phase 3 Job Service API
        const requiredSkillsList = selectedSkills.map(s => s.name);
        const requiredSkillProficiencyObj = selectedSkills.reduce((acc, curr) => {
            acc[curr.name] = curr.level;
            return acc;
        }, {} as Record<string, string>);

        const jobPayload = {
            title,
            description,
            type,
            location: {
                address: location,
                city: location.split(',')[0] || location,
                state: location.split(',')[1]?.trim() || 'NY',
                country: 'USA',
                postalCode: '10001',
                remote: type.includes('Remote')
            },
            salary: {
                min: parseInt(salaryRange.replace(/\D/g, '')),
                max: parseInt(salaryRange.replace(/\D/g, '')) * 1.5,
                currency: 'USD',
                type: 'annual'
            },
            requirements: ['Previous experience'],
            responsibilities: ['Build features'],
            experience: 'mid-level',
            companyId: '123e4567-e89b-12d3-a456-426614174000', // Mock company ID
            industry: 'technology',
            skills: requiredSkillsList, // Deprecated fallback
            requiredSkills: requiredSkillsList,
            requiredSkillProficiency: requiredSkillProficiencyObj
        };

        try {
            await fetch("/api/v1/jobs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(jobPayload),
            });

            const msg = document.getElementById("job-success-msg");
            if (msg) msg.style.display = "block";

            setTimeout(() => {
                navigate("/jobs/manage");
            }, 1500);
        } catch (err) {
            console.error("Failed to post job:", err);
            alert("Failed to post job. Please try again.");
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h2>Post New Job</h2>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "grid",
                    gap: "1.5rem",
                    background: "white",
                    padding: "2rem",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                }}>
                <div
                    id="job-success-msg"
                    data-testid="success-message"
                    style={{
                        display: "none",
                        backgroundColor: "#dcfce7",
                        color: "#16a34a",
                        padding: "1rem",
                        borderRadius: "8px",
                        textAlign: "center",
                        fontWeight: 600,
                    }}>
                    Job posted successfully
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Job Title
                    </label>
                    <input
                        data-testid="job-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px" }}
                        required
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Description
                    </label>
                    <textarea
                        data-testid="job-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px" }}
                        required
                    />
                </div>

                {/* SKILLS SECTION */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Required Skills</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {availableSkills.map(skill => (
                            <button
                                key={skill}
                                type="button"
                                onClick={() => handleAddSkill(skill)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '999px',
                                    border: '1px solid #cbd5e1',
                                    background: selectedSkills.find(s => s.name === skill) ? '#e0e7ff' : 'white',
                                    color: selectedSkills.find(s => s.name === skill) ? '#4338ca' : '#475569',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                {skill} {selectedSkills.find(s => s.name === skill) ? '✓' : '+'}
                            </button>
                        ))}
                    </div>

                    {selectedSkills.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Minimum Proficiency Requirements</h4>
                            {selectedSkills.map(skill => (
                                <div key={skill.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                                    <span style={{ fontWeight: 500 }}>{skill.name}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <select
                                            value={skill.level}
                                            onChange={(e) => handleLevelChange(skill.name, e.target.value)}
                                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSkill(skill.name)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                            Category
                        </label>
                        <select
                            data-testid="job-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px" }}>
                            <option>Engineering</option>
                            <option>Design</option>
                            <option>Marketing</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                            Type
                        </label>
                        <select
                            data-testid="job-type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px" }}>
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Salary Range
                    </label>
                    <input
                        data-testid="salary-range"
                        value={salaryRange}
                        onChange={(e) => setSalaryRange(e.target.value)}
                        placeholder="e.g. $100,000 - $150,000"
                        style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px" }}
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                        Location
                    </label>
                    <input
                        data-testid="job-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. New York, NY"
                        style={{ width: "100%", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "8px" }}
                    />
                </div>

                <button
                    type="submit"
                    data-testid="publish-job"
                    style={{
                        padding: "1rem",
                        background: "#4f46e5",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}>
                    Publish Job
                </button>
            </form>
        </div>
    );
};

export default CreateJob;
