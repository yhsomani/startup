/**
 * TalentSphere AI-Powered Job Matching and Recommendation Service
 * Implements machine learning algorithms for job matching and recommendations
 */

const { v4: uuidv4 } = require('uuid');
const similarity = require('compute-cosine-similarity');

class AIMatchingService {
    constructor(options = {}) {
        this.options = {
            // Similarity threshold for matching
            similarityThreshold: options.similarityThreshold || 0.6,

            // Number of recommendations to return
            maxRecommendations: options.maxRecommendations || 10,

            // Weight factors for different matching criteria
            weights: {
                skills: options.weights?.skills || 0.4,
                experience: options.weights?.experience || 0.3,
                education: options.weights?.education || 0.2,
                location: options.weights?.location || 0.1
            },

            // Scoring algorithm configuration
            scoring: {
                perfectMatchScore: options.scoring?.perfectMatchScore || 100,
                partialMatchScore: options.scoring?.partialMatchScore || 50,
                weakMatchScore: options.scoring?.weakMatchScore || 20
            },

            // Storage for user preferences and feedback
            userProfiles: new Map(),
            jobProfiles: new Map(),
            userInteractions: new Map(),

            // Model parameters
            modelVersion: 'v1.0',
            lastTrained: new Date(),

            ...options
        };
    }

    /**
     * Calculate cosine similarity between two arrays of features
     */
    calculateCosineSimilarity(vecA, vecB) {
        return similarity(vecA, vecB);
    }

    /**
     * Tokenize text into features (simplified approach)
     */
    tokenizeText(text) {
        if (!text) {return [];}

        // Convert to lowercase and split by common delimiters
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 2)
            .map(token => token.trim());
    }

    /**
     * Vectorize a text document
     */
    vectorizeText(text, vocabulary = null) {
        const tokens = this.tokenizeText(text);

        if (!vocabulary) {
            // Create vocabulary from tokens
            vocabulary = [...new Set(tokens)];
        }

        // Create binary vector representation
        const vector = new Array(vocabulary.length).fill(0);

        tokens.forEach(token => {
            const index = vocabulary.indexOf(token);
            if (index !== -1) {
                vector[index] = 1;
            }
        });

        return { vector, vocabulary };
    }

    /**
     * Calculate skill match score
     */
    calculateSkillMatch(userSkills, jobSkills) {
        if (!userSkills || !jobSkills || userSkills.length === 0 || jobSkills.length === 0) {
            return 0;
        }

        const userSkillSet = new Set(userSkills.map(skill => skill.toLowerCase()));
        const jobSkillSet = new Set(jobSkills.map(skill => skill.toLowerCase()));

        // Calculate intersection
        const intersection = [...userSkillSet].filter(skill => jobSkillSet.has(skill));
        const union = new Set([...userSkillSet, ...jobSkillSet]);

        // Jaccard similarity
        return intersection.length / union.size;
    }

    /**
     * Calculate experience match score
     */
    calculateExperienceMatch(userExperience, jobRequirements) {
        if (!userExperience || !jobRequirements) {return 0;}

        // Simplified experience matching
        // In a real implementation, this would be more sophisticated
        const userYears = userExperience.years || 0;
        const requiredYears = jobRequirements.minExperience || 0;

        if (userYears >= requiredYears) {
            // Perfect match if user has equal or more experience
            return 1.0;
        } else {
            // Partial match based on ratio
            return userYears / requiredYears;
        }
    }

    /**
     * Calculate education match score
     */
    calculateEducationMatch(userEducation, jobEducation) {
        if (!userEducation || !jobEducation) {return 0;}

        // Match on degree type and field of study
        let score = 0;

        for (const userEdu of userEducation) {
            for (const jobEdu of jobEducation) {
                if (userEdu.degree && jobEdu.requiredDegree) {
                    if (userEdu.degree.toLowerCase().includes(jobEdu.requiredDegree.toLowerCase())) {
                        score += 0.5; // Degree match
                    }
                }

                if (userEdu.fieldOfStudy && jobEdu.fieldOfStudy) {
                    if (userEdu.fieldOfStudy.toLowerCase().includes(jobEdu.fieldOfStudy.toLowerCase())) {
                        score += 0.3; // Field match
                    }
                }
            }
        }

        return Math.min(score, 1.0); // Cap at 1.0
    }

    /**
     * Calculate location match score
     */
    calculateLocationMatch(userLocation, jobLocation) {
        if (!userLocation || !jobLocation) {return 0;}

        // Simple string matching for location
        const userLoc = userLocation.toLowerCase();
        const jobLoc = jobLocation.toLowerCase();

        if (userLoc === jobLoc) {return 1.0;} // Exact match

        if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) {return 0.8;} // Partial match

        // Check if they're in the same region/state
        // This is a simplified approach
        return 0.3;
    }

    /**
     * Create a profile vector for a user
     */
    createUserProfileVector(user) {
        const skillsText = user.skills ? user.skills.join(' ') : '';
        const experienceText = user.experience ?
            user.experience.map(exp => `${exp.position} ${exp.company} ${exp.description}`).join(' ') : '';
        const educationText = user.education ?
            user.education.map(edu => `${edu.degree} ${edu.institution} ${edu.fieldOfStudy}`).join(' ') : '';
        const bioText = user.bio || '';

        // Combine all texts for vectorization
        const combinedText = `${skillsText} ${experienceText} ${educationText} ${bioText}`;

        return this.vectorizeText(combinedText);
    }

    /**
     * Create a profile vector for a job
     */
    createJobProfileVector(job) {
        const titleText = job.title || '';
        const descriptionText = job.description || '';
        const requirementsText = job.requirements || '';
        const skillsText = job.skills ? job.skills.join(' ') : '';
        const companyText = job.company || '';

        // Combine all texts for vectorization
        const combinedText = `${titleText} ${descriptionText} ${requirementsText} ${skillsText} ${companyText}`;

        return this.vectorizeText(combinedText);
    }

    /**
     * Calculate overall match score between user and job
     */
    calculateMatchScore(user, job) {
        const skillScore = this.calculateSkillMatch(user.skills || [], job.skills || []);
        const experienceScore = this.calculateExperienceMatch(
            user.experience,
            { minExperience: job.experienceLevel }
        );
        const educationScore = this.calculateEducationMatch(
            user.education || [],
            [{ requiredDegree: job.educationRequirements, fieldOfStudy: job.fieldOfStudy }]
        );
        const locationScore = this.calculateLocationMatch(
            user.location,
            job.location
        );

        // Weighted average
        const weightedScore = (
            skillScore * this.options.weights.skills +
            experienceScore * this.options.weights.experience +
            educationScore * this.options.weights.education +
            locationScore * this.options.weights.location
        );

        return {
            totalScore: weightedScore,
            breakdown: {
                skills: skillScore,
                experience: experienceScore,
                education: educationScore,
                location: locationScore
            }
        };
    }

    /**
     * Train the recommendation model (simulated)
     */
    async trainModel(userData, jobData, interactionData) {
        console.log('Training AI recommendation model...');

        // In a real implementation, this would involve:
        // 1. Processing user data and job data
        // 2. Training ML models (collaborative filtering, content-based filtering)
        // 3. Storing trained models
        // 4. Validating model performance

        // For now, we'll just store the data and simulate training
        userData.forEach(user => {
            this.userProfiles.set(user.id, user);
        });

        jobData.forEach(job => {
            this.jobProfiles.set(job.id, job);
        });

        interactionData.forEach(interaction => {
            if (!this.userInteractions.has(interaction.userId)) {
                this.userInteractions.set(interaction.userId, []);
            }
            this.userInteractions.get(interaction.userId).push(interaction);
        });

        this.lastTrained = new Date();

        console.log('AI model training completed');
        return {
            success: true,
            modelVersion: this.options.modelVersion,
            trainedAt: this.lastTrained,
            usersProcessed: userData.length,
            jobsProcessed: jobData.length,
            interactionsProcessed: interactionData.length
        };
    }

    /**
     * Get job recommendations for a user
     */
    async getJobRecommendations(userId, options = {}) {
        const user = this.userProfiles.get(userId);
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }

        // Get all jobs
        const allJobs = Array.from(this.jobProfiles.values());

        // Calculate match scores for all jobs
        const scoredJobs = allJobs.map(job => {
            const matchResult = this.calculateMatchScore(user, job);
            return {
                jobId: job.id,
                job,
                matchScore: matchResult.totalScore,
                matchBreakdown: matchResult.breakdown
            };
        });

        // Filter jobs above threshold and sort by score
        const filteredJobs = scoredJobs
            .filter(job => job.matchScore >= (options.threshold || this.options.similarityThreshold))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, options.limit || this.options.maxRecommendations);

        // Record recommendation event for feedback learning
        this.recordRecommendationEvent(userId, filteredJobs.map(j => j.jobId));

        return {
            userId,
            recommendations: filteredJobs,
            totalPossible: scoredJobs.length,
            thresholdUsed: options.threshold || this.options.similarityThreshold,
            calculatedAt: new Date().toISOString()
        };
    }

    /**
     * Get user recommendations for a job (find suitable candidates)
     */
    async getUserRecommendations(jobId, options = {}) {
        const job = this.jobProfiles.get(jobId);
        if (!job) {
            throw new Error(`Job with ID ${jobId} not found`);
        }

        // Get all users
        const allUsers = Array.from(this.userProfiles.values());

        // Calculate match scores for all users
        const scoredUsers = allUsers.map(user => {
            const matchResult = this.calculateMatchScore(user, job);
            return {
                userId: user.id,
                user,
                matchScore: matchResult.totalScore,
                matchBreakdown: matchResult.breakdown
            };
        });

        // Filter users above threshold and sort by score
        const filteredUsers = scoredUsers
            .filter(user => user.matchScore >= (options.threshold || this.options.similarityThreshold))
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, options.limit || this.options.maxRecommendations);

        return {
            jobId,
            recommendations: filteredUsers,
            totalPossible: scoredUsers.length,
            thresholdUsed: options.threshold || this.options.similarityThreshold,
            calculatedAt: new Date().toISOString()
        };
    }

    /**
     * Collaborative filtering based on user behavior
     */
    async getCollaborativeRecommendations(userId, options = {}) {
        const userInteractions = this.userInteractions.get(userId) || [];

        // Find users with similar interaction patterns
        const similarUsers = this.findSimilarUsers(userId, 10);

        // Get jobs liked by similar users that the current user hasn't seen
        const candidateJobs = new Map();

        for (const similarUserId of similarUsers) {
            const similarUserInteractions = this.userInteractions.get(similarUserId) || [];

            for (const interaction of similarUserInteractions) {
                if (interaction.action === 'apply' || interaction.action === 'save' || interaction.rating > 3) {
                    // Job was positively interacted with by similar user
                    if (!userInteractions.some(ui => ui.jobId === interaction.jobId)) {
                        // Current user hasn't interacted with this job
                        if (!candidateJobs.has(interaction.jobId)) {
                            candidateJobs.set(interaction.jobId, { count: 0, score: 0 });
                        }
                        candidateJobs.get(interaction.jobId).count++;
                    }
                }
            }
        }

        // Convert to array and sort by popularity among similar users
        const collaborativeRecs = Array.from(candidateJobs.entries())
            .map(([jobId, data]) => ({
                jobId,
                score: data.count / similarUsers.length, // Normalize by number of similar users
                reason: 'similar_users_liked'
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, options.limit || this.options.maxRecommendations);

        return collaborativeRecs;
    }

    /**
     * Find users similar to a given user
     */
    findSimilarUsers(targetUserId, limit = 10) {
        const targetUserInteractions = this.userInteractions.get(targetUserId) || [];
        const targetJobIds = new Set(targetUserInteractions.map(i => i.jobId));

        const similarities = [];

        for (const [userId, userInteractions] of this.userInteractions) {
            if (userId === targetUserId) {continue;}

            // Calculate Jaccard similarity based on job interactions
            const userJobIds = new Set(userInteractions.map(i => i.jobId));
            const intersection = [...targetJobIds].filter(id => userJobIds.has(id)).length;
            const union = new Set([...targetJobIds, ...userJobIds]).size;

            const similarity = union > 0 ? intersection / union : 0;

            similarities.push({ userId, similarity });
        }

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => item.userId);
    }

    /**
     * Hybrid recommendation combining content-based and collaborative filtering
     */
    async getHybridRecommendations(userId, options = {}) {
        // Get content-based recommendations
        const contentRecs = await this.getJobRecommendations(userId, options);

        // Get collaborative recommendations
        const collabRecs = await this.getCollaborativeRecommendations(userId, options);

        // Combine and weight the recommendations
        const hybridScores = new Map();

        // Add content-based scores
        contentRecs.recommendations.forEach(rec => {
            hybridScores.set(rec.jobId, {
                contentScore: rec.matchScore,
                collabScore: 0,
                finalScore: rec.matchScore * 0.7 // 70% content, 30% collaborative
            });
        });

        // Add collaborative scores
        collabRecs.forEach(rec => {
            if (hybridScores.has(rec.jobId)) {
                const existing = hybridScores.get(rec.jobId);
                existing.collabScore = rec.score;
                existing.finalScore = (existing.contentScore * 0.7) + (rec.score * 0.3);
            } else {
                hybridScores.set(rec.jobId, {
                    contentScore: 0,
                    collabScore: rec.score,
                    finalScore: rec.score * 0.3
                });
            }
        });

        // Convert to array and sort by final score
        const hybridRecs = Array.from(hybridScores.entries())
            .map(([jobId, scores]) => ({
                jobId,
                ...scores,
                job: this.jobProfiles.get(jobId)
            }))
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, options.limit || this.options.maxRecommendations);

        return {
            userId,
            recommendations: hybridRecs,
            calculatedAt: new Date().toISOString()
        };
    }

    /**
     * Record user interaction for model improvement
     */
    recordInteraction(userId, jobId, interactionType, metadata = {}) {
        const interaction = {
            id: uuidv4(),
            userId,
            jobId,
            action: interactionType,
            timestamp: new Date().toISOString(),
            metadata
        };

        if (!this.userInteractions.has(userId)) {
            this.userInteractions.set(userId, []);
        }

        this.userInteractions.get(userId).push(interaction);

        return interaction.id;
    }

    /**
     * Record recommendation event for feedback analysis
     */
    recordRecommendationEvent(userId, jobIds) {
        jobIds.forEach(jobId => {
            this.recordInteraction(userId, jobId, 'recommendation_shown');
        });
    }

    /**
     * Get recommendation explanations
     */
    getRecommendationExplanation(userId, jobId) {
        const user = this.userProfiles.get(userId);
        const job = this.jobProfiles.get(jobId);

        if (!user || !job) {
            return null;
        }

        const matchResult = this.calculateMatchScore(user, job);

        const explanation = {
            userId,
            jobId,
            matchScore: matchResult.totalScore,
            reasons: [],
            strengths: [],
            weaknesses: []
        };

        // Analyze strengths
        if (matchResult.breakdown.skills > 0.7) {
            explanation.strengths.push('Strong skill match');
        }
        if (matchResult.breakdown.experience > 0.7) {
            explanation.strengths.push('Good experience fit');
        }
        if (matchResult.breakdown.education > 0.7) {
            explanation.strengths.push('Good education match');
        }
        if (matchResult.breakdown.location > 0.7) {
            explanation.strengths.push('Location match');
        }

        // Analyze weaknesses
        if (matchResult.breakdown.skills < 0.3) {
            explanation.weaknesses.push('Skills gap identified');
        }
        if (matchResult.breakdown.experience < 0.3) {
            explanation.weaknesses.push('Experience requirement may be challenging');
        }

        // Generate reasons
        explanation.reasons.push(`Match score: ${(matchResult.totalScore * 100).toFixed(1)}%`);

        if (user.skills && job.skills) {
            const commonSkills = user.skills.filter(skill =>
                job.skills.some(jobSkill =>
                    skill.toLowerCase().includes(jobSkill.toLowerCase()) ||
                    jobSkill.toLowerCase().includes(skill.toLowerCase())
                )
            );

            if (commonSkills.length > 0) {
                explanation.reasons.push(`Common skills: ${commonSkills.slice(0, 3).join(', ')}`);
            }
        }

        return explanation;
    }

    /**
     * Get model statistics
     */
    getModelStats() {
        return {
            modelVersion: this.options.modelVersion,
            lastTrained: this.lastTrained,
            userCount: this.userProfiles.size,
            jobCount: this.jobProfiles.size,
            interactionCount: Array.from(this.userInteractions.values()).flat().length,
            weights: this.options.weights,
            threshold: this.options.similarityThreshold
        };
    }

    /**
     * Update user profile
     */
    updateUserProfile(userId, profileUpdates) {
        const existingProfile = this.userProfiles.get(userId);
        if (!existingProfile) {
            throw new Error(`User with ID ${userId} not found`);
        }

        const updatedProfile = { ...existingProfile, ...profileUpdates };
        this.userProfiles.set(userId, updatedProfile);

        return updatedProfile;
    }

    /**
     * Update job profile
     */
    updateJobProfile(jobId, profileUpdates) {
        const existingProfile = this.jobProfiles.get(jobId);
        if (!existingProfile) {
            throw new Error(`Job with ID ${jobId} not found`);
        }

        const updatedProfile = { ...existingProfile, ...profileUpdates };
        this.jobProfiles.set(jobId, updatedProfile);

        return updatedProfile;
    }

    /**
     * Reset the model (for retraining)
     */
    resetModel() {
        this.userProfiles.clear();
        this.jobProfiles.clear();
        this.userInteractions.clear();
        this.lastTrained = new Date();

        return {
            success: true,
            resetAt: new Date().toISOString()
        };
    }
}

module.exports = AIMatchingService;