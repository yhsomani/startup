/**
 * GraphQL Resolvers
 *
 * Implements resolvers for all GraphQL types, integrating with
 * existing microservices via REST/gRPC.
 */

const { UserAPI, JobAPI, CourseAPI, ChallengeAPI } = require("./datasources");

const resolvers = {
    Query: {
        me: async (_, __, context) => {
            if (!context.user) return null;
            return UserAPI.getUserById(context.user.id);
        },

        user: async (_, { id }) => {
            return UserAPI.getUserById(id);
        },

        users: async (_, { limit = 20, offset = 0 }) => {
            return UserAPI.getUsers({ limit, offset });
        },

        job: async (_, { id }) => {
            return JobAPI.getJobById(id);
        },

        jobs: async (_, { filter, limit = 20, offset = 0 }) => {
            return JobAPI.getJobs({ filter, limit, offset });
        },

        featuredJobs: async (_, { limit = 10 }) => {
            return JobAPI.getFeaturedJobs({ limit });
        },

        jobsByCompany: async (_, { companyId }) => {
            return JobAPI.getJobsByCompany(companyId);
        },

        company: async (_, { id }) => {
            return JobAPI.getCompanyById(id);
        },

        companies: async (_, { industry, limit = 20, offset = 0 }) => {
            return JobAPI.getCompanies({ industry, limit, offset });
        },

        course: async (_, { id }) => {
            return CourseAPI.getCourseById(id);
        },

        courses: async (_, { category, limit = 20, offset = 0 }) => {
            return CourseAPI.getCourses({ category, limit, offset });
        },

        myEnrollments: async (_, __, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return CourseAPI.getEnrollments(context.user.id);
        },

        challenge: async (_, { id }) => {
            return ChallengeAPI.getChallengeById(id);
        },

        challenges: async (_, { difficulty, limit = 20 }) => {
            return ChallengeAPI.getChallenges({ difficulty, limit });
        },

        mySubmissions: async (_, __, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return ChallengeAPI.getSubmissions(context.user.id);
        },

        search: async (_, { query, type = "ALL", limit = 20 }) => {
            return {
                users: type === "ALL" || type === "USERS" ? await UserAPI.search(query, limit) : [],
                jobs: type === "ALL" || type === "JOBS" ? await JobAPI.search(query, limit) : [],
                courses:
                    type === "ALL" || type === "COURSES"
                        ? await CourseAPI.search(query, limit)
                        : [],
                challenges:
                    type === "ALL" || type === "CHALLENGES"
                        ? await ChallengeAPI.search(query, limit)
                        : [],
                totalCount: 0,
            };
        },

        userAnalytics: async (_, { userId }, context) => {
            const targetUserId = userId || context.user?.id;
            if (!targetUserId) throw new Error("Unauthorized");
            return UserAPI.getAnalytics(targetUserId);
        },

        platformMetrics: async () => {
            return {
                totalUsers: 0,
                activeUsers: 0,
                totalJobs: 0,
                totalCourses: 0,
                totalSubmissions: 0,
            };
        },
    },

    Mutation: {
        login: async (_, { email, password }) => {
            return UserAPI.login(email, password);
        },

        register: async (_, { input }) => {
            return UserAPI.register(input);
        },

        forgotPassword: async (_, { email }) => {
            return UserAPI.forgotPassword(email);
        },

        resetPassword: async (_, { token, newPassword }) => {
            return UserAPI.resetPassword(token, newPassword);
        },

        updateProfile: async (_, { input }, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return UserAPI.updateProfile(context.user.id, input);
        },

        createJob: async (_, { input }, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return JobAPI.createJob(input, context.user.id);
        },

        updateJob: async (_, { id, input }, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return JobAPI.updateJob(id, input, context.user.id);
        },

        deleteJob: async (_, { id }, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return JobAPI.deleteJob(id, context.user.id);
        },

        applyToJob: async (_, { jobId }, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return JobAPI.applyToJob(jobId, context.user.id);
        },

        enrollCourse: async (_, { courseId }, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return CourseAPI.enrollCourse(courseId, context.user.id);
        },

        completeLesson: async (_, { courseId, lessonId }, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return CourseAPI.completeLesson(courseId, lessonId, context.user.id);
        },

        submitChallenge: async (_, { challengeId, code, language }, context) => {
            if (!context.user) throw new Error("Unauthorized");
            return ChallengeAPI.submit(challengeId, code, language, context.user.id);
        },
    },

    Subscription: {
        jobUpdated: {
            subscribe: async function* (_, { jobId }) {
                const { PubSub } = require("./pubsub");
                const pubsub = new PubSub();
                for await (const job of pubsub.asyncIterator(`JOB_UPDATED:${jobId}`)) {
                    yield { jobUpdated: job };
                }
            },
        },

        newJobAlert: {
            subscribe: async function* (_, { location }) {
                const { PubSub } = require("./pubsub");
                const pubsub = new PubSub();
                for await (const job of pubsub.asyncIterator("NEW_JOB")) {
                    if (!location || job.location?.city === location) {
                        yield { newJobAlert: job };
                    }
                }
            },
        },
    },

    User: {
        skills: async user => {
            return UserAPI.getUserSkills(user.id);
        },
        experience: async user => {
            return UserAPI.getUserExperience(user.id);
        },
        education: async user => {
            return UserAPI.getUserEducation(user.id);
        },
    },

    Job: {
        company: async job => {
            return JobAPI.getCompanyById(job.companyId);
        },
    },

    Course: {
        instructor: async course => {
            return UserAPI.getUserById(course.instructorId);
        },
        lessons: async course => {
            return CourseAPI.getLessons(course.id);
        },
    },

    Enrollment: {
        user: async enrollment => {
            return UserAPI.getUserById(enrollment.userId);
        },
        course: async enrollment => {
            return CourseAPI.getCourseById(enrollment.courseId);
        },
    },

    Challenge: {
        testCases: async challenge => {
            return challenge.testCases || [];
        },
    },

    Submission: {
        user: async submission => {
            return UserAPI.getUserById(submission.userId);
        },
        challenge: async submission => {
            return ChallengeAPI.getChallengeById(submission.challengeId);
        },
        testResults: async submission => {
            return submission.testResults || [];
        },
    },
};

module.exports = resolvers;
