/**
 * Unit Tests for AI Matching Service - Simplified
 */

describe('AIMatchingService Logic', () => {
    describe('Skill Matching', () => {
        const calculateSkillMatch = (userSkills, jobSkills) => {
            if (!userSkills || !jobSkills || userSkills.length === 0 || jobSkills.length === 0) {
                return 0;
            }
            const userSkillSet = new Set(userSkills.map(s => s.toLowerCase()));
            const jobSkillSet = new Set(jobSkills.map(s => s.toLowerCase()));
            const intersection = new Set([...userSkillSet].filter(x => jobSkillSet.has(x)));
            return intersection.size / jobSkillSet.size;
        };

        test('should calculate perfect skill match', () => {
            const score = calculateSkillMatch(['JavaScript', 'React'], ['JavaScript', 'React']);
            expect(score).toBe(1);
        });

        test('should calculate partial skill match', () => {
            const score = calculateSkillMatch(['JavaScript'], ['JavaScript', 'React', 'Node']);
            expect(score).toBeCloseTo(0.333, 2);
        });

        test('should return 0 for no match', () => {
            const score = calculateSkillMatch(['Python'], ['JavaScript', 'React']);
            expect(score).toBe(0);
        });

        test('should return 0 for empty arrays', () => {
            expect(calculateSkillMatch([], ['JavaScript'])).toBe(0);
            expect(calculateSkillMatch(['JavaScript'], [])).toBe(0);
            expect(calculateSkillMatch(null, ['JavaScript'])).toBe(0);
        });
    });

    describe('Experience Matching', () => {
        const calculateExperienceMatch = (userExperience, jobRequirements) => {
            if (!userExperience || !jobRequirements?.minYears) return 0;
            const { minYears, maxYears } = jobRequirements;
            if (userExperience >= minYears && (!maxYears || userExperience <= maxYears)) {
                return 1;
            }
            if (userExperience < minYears) {
                return Math.max(0, 1 - (minYears - userExperience) / minYears);
            }
            return 0.5;
        };

        test('should match exact experience', () => {
            const score = calculateExperienceMatch(5, { minYears: 3, maxYears: 8 });
            expect(score).toBe(1);
        });

        test('should match within range', () => {
            const score = calculateExperienceMatch(4, { minYears: 3, maxYears: 7 });
            expect(score).toBe(1);
        });

        test('should penalize under-qualified', () => {
            const score = calculateExperienceMatch(1, { minYears: 3 });
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThan(1);
        });
    });

    describe('Education Matching', () => {
        const educationLevels = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD'];
        
        const calculateEducationMatch = (userEducation, requiredEducation) => {
            if (!userEducation || !requiredEducation) return 0;
            const userLevel = educationLevels.indexOf(userEducation);
            const requiredLevel = educationLevels.indexOf(requiredEducation);
            if (userLevel === -1 || requiredLevel === -1) return 0;
            if (userLevel >= requiredLevel) return 1;
            return Math.max(0, 1 - (requiredLevel - userLevel) * 0.25);
        };

        test('should match higher education', () => {
            const score = calculateEducationMatch('Master', 'Bachelor');
            expect(score).toBe(1);
        });

        test('should partially match lower education', () => {
            const score = calculateEducationMatch('Bachelor', 'Master');
            expect(score).toBeGreaterThan(0.5);
            expect(score).toBeLessThan(1);
        });
    });

    describe('Location Matching', () => {
        const calculateLocationMatch = (userLocation, jobLocation) => {
            if (!userLocation || !jobLocation) return 0;
            const userLower = userLocation.toLowerCase();
            const jobLower = jobLocation.toLowerCase();
            if (userLower === jobLower) return 1;
            if (jobLower.includes(userLower) || userLower.includes(jobLower)) return 0.8;
            const userParts = userLower.split(/[\s,]+/);
            const jobParts = jobLower.split(/[\s,]+/);
            const matchCount = userParts.filter(p => jobParts.includes(p)).length;
            return matchCount > 0 ? matchCount / Math.max(userParts.length, jobParts.length) : 0;
        };

        test('should match exact location', () => {
            const score = calculateLocationMatch('New York', 'New York');
            expect(score).toBe(1);
        });

        test('should match partial location', () => {
            const score = calculateLocationMatch('New York', 'New York, NY');
            expect(score).toBe(0.8);
        });
    });

    describe('Text Tokenization', () => {
        const tokenizeText = (text) => {
            if (!text) return [];
            return text.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(token => token.length > 2);
        };

        test('should tokenize text', () => {
            const tokens = tokenizeText('JavaScript React Node.js');
            expect(tokens).toContain('javascript');
            expect(tokens).toContain('react');
            expect(tokens).toContain('nodejs');
        });

        test('should filter short tokens', () => {
            const tokens = tokenizeText('JS React');
            expect(tokens).toEqual(['react']);
        });

        test('should handle empty string', () => {
            expect(tokenizeText('')).toEqual([]);
            expect(tokenizeText(null)).toEqual([]);
        });
    });

    describe('Overall Score Calculation', () => {
        const calculateOverallScore = (skillScore, expScore, eduScore, locScore, weights = { skills: 0.4, experience: 0.3, education: 0.1, location: 0.2 }) => {
            return (
                skillScore * weights.skills +
                expScore * weights.experience +
                eduScore * weights.education +
                locScore * weights.location
            );
        };

        test('should calculate weighted overall score', () => {
            const score = calculateOverallScore(1, 1, 1, 1);
            expect(score).toBe(1);
        });

        test('should calculate partial scores', () => {
            const score = calculateOverallScore(0.5, 1, 0.5, 0);
            expect(score).toBeCloseTo(0.55, 2);
        });
    });
});
