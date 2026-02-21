/**
 * TalentSphere Recruitment Service - Optimized Version
 * Demonstrates N+1 query fixes using batch loading, IN clauses, and eager loading
 */

const { Pool } = require("pg");
const { n1Optimizer } = require("../../shared/n1-optimizer");

class OptimizedRecruitmentService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        // Create batch loaders using the N1QueryOptimizer
        this.candidateLoader = n1Optimizer.createBatchLoader(
            async candidateIds => {
                const query = n1Optimizer.createInClauseQuery(
                    "SELECT * FROM candidates",
                    candidateIds,
                    "id"
                );
                const result = await this.pool.query(query.query, query.params);
                return result.rows;
            },
            { batchDelay: 10, maxBatchSize: 100 }
        );

        this.jobLoader = n1Optimizer.createBatchLoader(
            async jobIds => {
                const query = n1Optimizer.createInClauseQuery("SELECT * FROM jobs", jobIds, "id");
                const result = await this.pool.query(query.query, query.params);
                return result.rows;
            },
            { batchDelay: 10, maxBatchSize: 100 }
        );

        this.skillLoader = n1Optimizer.createBatchLoader(
            async candidateIds => {
                const query = n1Optimizer.createInClauseQuery(
                    `SELECT cs.* FROM candidate_skills cs 
                     JOIN candidates c ON cs.candidate_id = c.id`,
                    candidateIds,
                    "c.id"
                );
                const result = await this.pool.query(query.query, query.params);
                return result.rows;
            },
            { batchDelay: 10, maxBatchSize: 100 }
        );
    }

    /**
     * FIX #1: BATCH LOADING
     * Instead of querying for each candidate's skills inside a loop,
     * we use the batch loader to fetch all skills in a single query
     */
    async getCandidatesWithSkills(candidateIds) {
        // OLD N+1 PATTERN (BAD):
        // const candidates = [];
        // for (const id of candidateIds) {
        //     const candidate = await this.pool.query('SELECT * FROM candidates WHERE id = $1', [id]);
        //     const skills = await this.pool.query('SELECT * FROM candidate_skills WHERE candidate_id = $1', [id]);
        //     candidates.push({ ...candidate.rows[0], skills: skills.rows });
        // }

        // NEW BATCH LOADER PATTERN (GOOD):
        const candidates = await Promise.all(candidateIds.map(id => this.candidateLoader(id)));

        const allSkills = await this.skillLoader(candidateIds);

        // Group skills by candidate_id
        const skillsByCandidate = new Map();
        for (const skill of allSkills) {
            if (!skillsByCandidate.has(skill.candidate_id)) {
                skillsByCandidate.set(skill.candidate_id, []);
            }
            skillsByCandidate.get(skill.candidate_id).push(skill);
        }

        // Combine candidate with their skills
        return candidates.map(candidate => ({
            ...candidate,
            skills: skillsByCandidate.get(candidate?.id) || [],
        }));
    }

    /**
     * FIX #2: SQL IN CLAUSES
     * Instead of multiple queries, use a single query with IN clause
     */
    async getJobsByCompany(companyIds) {
        // OLD N+1 PATTERN (BAD):
        // const jobs = [];
        // for (const companyId of companyIds) {
        //     const result = await this.pool.query(
        //         'SELECT * FROM jobs WHERE company_id = $1',
        //         [companyId]
        //     );
        //     jobs.push(...result.rows);
        // }

        // NEW IN CLAUSE PATTERN (GOOD):
        // Use the optimizer's createInClauseQuery method
        const query = n1Optimizer.createInClauseQuery(
            "SELECT j.*, c.name as company_name FROM jobs j JOIN companies c ON j.company_id = c.id",
            companyIds,
            "j.company_id"
        );

        const result = await this.pool.query(query.query, query.params);

        // Group jobs by company
        const jobsByCompany = new Map();
        for (const job of result.rows) {
            if (!jobsByCompany.has(job.company_id)) {
                jobsByCompany.set(job.company_id, []);
            }
            jobsByCompany.get(job.company_id).push(job);
        }

        return jobsByCompany;
    }

    /**
     * FIX #3: EAGER LOADING WITH JOINS
     * Fetch parent records and all related children in a single query
     */
    async getApplicationsWithDetails(applicationIds) {
        // OLD N+1 PATTERN (BAD):
        // const applications = await this.pool.query('SELECT * FROM applications WHERE id = ANY($1)', [applicationIds]);
        // for (const app of applications.rows) {
        //     app.candidate = (await this.pool.query('SELECT * FROM candidates WHERE id = $1', [app.candidate_id])).rows[0];
        //     app.job = (await this.pool.query('SELECT * FROM jobs WHERE id = $1', [app.job_id])).rows[0];
        //     app.company = (await this.pool.query('SELECT * FROM companies WHERE id = $1', [app.company_id])).rows[0];
        // }

        // NEW EAGER LOADING WITH JOINS (GOOD):
        const eagerQuery = `
            SELECT 
                a.id as application_id,
                a.status as application_status,
                a.created_at as application_created_at,
                c.id as candidate_id,
                c.name as candidate_name,
                c.email as candidate_email,
                c.resume_url as candidate_resume,
                j.id as job_id,
                j.title as job_title,
                j.description as job_description,
                co.id as company_id,
                co.name as company_name,
                co.logo_url as company_logo
            FROM applications a
            JOIN candidates c ON a.candidate_id = c.id
            JOIN jobs j ON a.job_id = j.id
            JOIN companies co ON j.company_id = co.id
            WHERE a.id = ANY($1)
        `;

        const result = await this.pool.query(eagerQuery, [applicationIds]);

        return result.rows.map(row => ({
            id: row.application_id,
            status: row.application_status,
            createdAt: row.application_created_at,
            candidate: {
                id: row.candidate_id,
                name: row.candidate_name,
                email: row.candidate_email,
                resumeUrl: row.candidate_resume,
            },
            job: {
                id: row.job_id,
                title: row.job_title,
                description: row.job_description,
            },
            company: {
                id: row.company_id,
                name: row.company_name,
                logoUrl: row.company_logo,
            },
        }));
    }

    /**
     * COMPLEX EXAMPLE: Combine all three patterns
     */
    async getRecommendedJobsForCandidates(candidateIds, limit = 10) {
        // Step 1: Batch load all candidates
        const candidates = await this.getCandidatesWithSkills(candidateIds);

        // Step 2: Extract skill IDs and use IN clause to find matching jobs
        const allSkillIds = [];
        const skillsByCandidate = new Map();

        for (const candidate of candidates) {
            if (candidate.skills) {
                const skillIds = candidate.skills.map(s => s.skill_id);
                skillsByCandidate.set(candidate.id, skillIds);
                allSkillIds.push(...skillIds);
            }
        }

        // Use IN clause to get all matching jobs in one query
        const uniqueSkillIds = [...new Set(allSkillIds)];
        if (uniqueSkillIds.length === 0) {
            return [];
        }

        const skillsQuery = n1Optimizer.createInClauseQuery(
            `SELECT js.job_id, s.name as skill_name 
             FROM job_skills js 
             JOIN skills s ON js.skill_id = s.id 
             WHERE s.id = ANY($1)`,
            uniqueSkillIds,
            "s.id"
        );

        const skillsResult = await this.pool.query(skillsQuery.query, skillsQuery.params);

        // Group job skills
        const jobSkills = new Map();
        for (const row of skillsResult.rows) {
            if (!jobSkills.has(row.job_id)) {
                jobSkills.set(row.job_id, []);
            }
            jobSkills.get(row.job_id).push(row.skill_name);
        }

        // Step 3: Use eager loading to get job details with company info
        const jobIds = [...jobSkills.keys()].slice(0, limit * 2);

        const jobsQuery = n1Optimizer.createInClauseQuery(
            `SELECT j.*, c.name as company_name, c.logo_url as company_logo 
             FROM jobs j 
             JOIN companies c ON j.company_id = c.id 
             WHERE j.id = ANY($1)`,
            jobIds,
            "j.id"
        );

        const jobsResult = await this.pool.query(jobsQuery.query, jobsQuery.params);

        // Combine all data
        return candidates.map(candidate => {
            const candidateSkills = skillsByCandidate.get(candidate.id) || [];
            const matchingJobs = jobsResult.rows
                .filter(job => {
                    const js = jobSkills.get(job.id) || [];
                    return js.some(skill => candidateSkills.includes(skill));
                })
                .slice(0, limit)
                .map(job => ({
                    ...job,
                    matchedSkills: (jobSkills.get(job.id) || []).filter(skill =>
                        candidateSkills.includes(skill)
                    ),
                    company: {
                        name: job.company_name,
                        logoUrl: job.company_logo,
                    },
                }));

            return {
                candidate: {
                    id: candidate.id,
                    name: candidate.name,
                    skills: candidate.skills,
                },
                recommendedJobs: matchingJobs,
            };
        });
    }
}

module.exports = { OptimizedRecruitmentService };
