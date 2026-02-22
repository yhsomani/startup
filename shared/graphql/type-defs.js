const typeDefs = `#graphql
  scalar DateTime
  scalar JSON

  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(limit: Int, offset: Int): [User!]!
    userByEmail(email: String!): User

    # Job queries
    job(id: ID!): Job
    jobs(filter: JobFilter, limit: Int, offset: Int): [Job!]!
    featuredJobs(limit: Int): [Job!]!
    jobsByCompany(companyId: ID!): [Job!]!

    # Company queries
    company(id: ID!): Company
    companies(industry: String, limit: Int, offset: Int): [Company!]!

    # Course queries
    course(id: ID!): Course
    courses(category: String, limit: Int, offset: Int): [Course!]!
    myEnrollments: [Enrollment!]!

    # Challenge queries
    challenge(id: ID!): Challenge
    challenges(difficulty: String, limit: Int): [Challenge!]!
    mySubmissions: [Submission!]!

    # Search
    search(query: String!, type: SearchType, limit: Int): SearchResults!

    # Analytics
    userAnalytics(userId: ID): UserAnalytics
    platformMetrics: PlatformMetrics
  }

  type Mutation {
    # Auth
    login(email: String!, password: String!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
    forgotPassword(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!

    # User
    updateProfile(input: ProfileInput!): User!

    # Jobs
    createJob(input: JobInput!): Job!
    updateJob(id: ID!, input: JobInput!): Job!
    deleteJob(id: ID!): Boolean!
    applyToJob(jobId: ID!): Application!

    # Courses
    enrollCourse(courseId: ID!): Enrollment!
    completeLesson(courseId: ID!, lessonId: ID!): LessonProgress!

    # Challenges
    submitChallenge(challengeId: ID!, code: String!, language: String!): Submission!
  }

  type Subscription {
    # Real-time updates
    jobUpdated(jobId: ID!): Job!
    newJobAlert(location: String): Job!
    courseProgressChanged(courseId: ID!): Enrollment!
    leaderboardUpdated(challengeId: ID!): LeaderboardEntry!
    notificationReceived(userId: ID!): Notification!
  }

  # Types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    avatar: String
    title: String
    bio: String
    skills: [Skill!]!
    experience: [Experience!]!
    education: [Education!]!
    isPremium: Boolean!
    createdAt: DateTime!
  }

  type Job {
    id: ID!
    title: String!
    description: String!
    company: Company!
    location: JSON
    salary: Salary
    employmentType: String!
    requirements: [String!]!
    skills: [String!]!
    isRemote: Boolean!
    status: JobStatus!
    applicationsCount: Int!
    viewsCount: Int!
    postedAt: DateTime!
    expiresAt: DateTime
  }

  type Company {
    id: ID!
    name: String!
    industry: String!
    size: String!
    location: JSON
    description: String
    logo: String
    website: String
    rating: Float
    jobsCount: Int!
  }

  type Course {
    id: ID!
    title: String!
    description: String!
    thumbnail: String
    instructor: User!
    category: String!
    level: String!
    duration: Int!
    lessonsCount: Int!
    enrolledCount: Int!
    rating: Float
    lessons: [Lesson!]!
    isEnrolled: Boolean
  }

  type Lesson {
    id: ID!
    title: String!
    content: String!
    videoUrl: String
    duration: Int!
    order: Int!
    isCompleted: Boolean
  }

  type Enrollment {
    id: ID!
    user: User!
    course: Course!
    progress: Float!
    completedLessons: [ID!]!
    startedAt: DateTime!
    completedAt: DateTime
  }

  type Challenge {
    id: ID!
    title: String!
    description: String!
    difficulty: String!
    categories: [String!]!
    points: Int!
    testCases: [TestCase!]!
    submissionsCount: Int!
    acceptanceRate: Float
  }

  type Submission {
    id: ID!
    user: User!
    challenge: Challenge!
    code: String!
    language: String!
    status: SubmissionStatus!
    testResults: [TestResult!]!
    score: Int
    submittedAt: DateTime!
  }

  type TestCase {
    input: String!
    expectedOutput: String!
    isHidden: Boolean
  }

  type TestResult {
    testCase: TestCase!
    passed: Boolean!
    actualOutput: String
    error: String
  }

  type Application {
    id: ID!
    user: User!
    job: Job!
    status: ApplicationStatus!
    coverLetter: String
    resumeUrl: String
    appliedAt: DateTime!
  }

  type AuthPayload {
    token: String!
    user: User!
    expiresIn: Int!
  }

  type Skill {
    id: ID!
    name: String!
    category: String
    proficiency: String
  }

  type Experience {
    id: ID!
    company: String!
    position: String!
    startDate: DateTime!
    endDate: DateTime
    isCurrent: Boolean!
    description: String
  }

  type Education {
    id: ID!
    institution: String!
    degree: String!
    fieldOfStudy: String!
    startDate: DateTime!
    endDate: DateTime
    gpa: Float
  }

  type Salary {
    min: Int
    max: Int
    currency: String!
  }

  type SearchResults {
    users: [User!]!
    jobs: [Job!]!
    courses: [Course!]!
    challenges: [Challenge!]!
    totalCount: Int!
  }

  type UserAnalytics {
    totalViews: Int!
    profileViews: Int!
    jobApplications: Int!
    courseCompletions: Int!
    challengesCompleted: Int!
    streak: Int!
    lastActive: DateTime!
  }

  type PlatformMetrics {
    totalUsers: Int!
    activeUsers: Int!
    totalJobs: Int!
    totalCourses: Int!
    totalSubmissions: Int!
  }

  type LeaderboardEntry {
    rank: Int!
    user: User!
    score: Int!
    submissionsCount: Int!
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    message: String!
    data: JSON
    read: Boolean!
    createdAt: DateTime!
  }

  type LessonProgress {
    lessonId: ID!
    completed: Boolean!
    completedAt: DateTime
  }

  # Enums
  enum JobStatus {
    DRAFT
    ACTIVE
    PAUSED
    CLOSED
    EXPIRED
  }

  enum ApplicationStatus {
    PENDING
    REVIEWING
    SHORTLISTED
    REJECTED
    ACCEPTED
  }

  enum SubmissionStatus {
    PENDING
    RUNNING
    PASSED
    FAILED
    ERROR
  }

  enum SearchType {
    ALL
    USERS
    JOBS
    COURSES
    CHALLENGES
  }

  # Inputs
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  input ProfileInput {
    firstName: String
    lastName: String
    title: String
    bio: String
    skills: [SkillInput!]
  }

  input SkillInput {
    name: String!
    proficiency: String
  }

  input JobInput {
    title: String!
    description: String!
    companyId: ID!
    location: JSON
    salary: SalaryInput
    employmentType: String!
    requirements: [String!]!
    skills: [String!]!
    isRemote: Boolean
  }

  input SalaryInput {
    min: Int
    max: Int
    currency: String
  }

  input JobFilter {
    location: String
    employmentType: String
    experienceLevel: String
    salaryMin: Int
    salaryMax: Int
    skills: [String!]
    isRemote: Boolean
  }
`;

module.exports = typeDefs;
