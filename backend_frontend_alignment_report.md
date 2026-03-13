# Backend–Frontend Alignment Intelligence Report

## Detected Backend Frameworks

| Framework | Modules / Controllers Detected |
|---|---|
| **Spring Boot** | 72 |
| **Flask** | 3 |

## Alignment Metrics

| Metric | Description |
|---|---|
| Total Backend Endpoints | 161 |
| Total Frontend API Calls | 36 |
| Matched Contracts | 24 |
| Contract Mismatches / Unused | 139 |

## Endpoint Contract Matching

| Endpoint | Method | Frontend Component | Backend Controller | Backend Exists | Frontend Uses | Status |
|---|---|---|---|---|---|---|
| `() => { }` | POST | `AuthProvider` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/auth/logout` | POST | `AuthProvider` | `AuthController` | Yes | Yes | **Match** |
| `/api/v1/notifications` | GET | `NotificationDropdown` | `index` | Yes | Yes | **Match** |
| `/api/v1/notifications/read-all` | PUT | `NotificationDropdown` | `NotificationController` | Yes | Yes | **Match** |
| `/api/v1/notifications/:id/read` | PUT | `NotificationDropdown` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/search?q=:id` | GET | `GlobalSearch` | `index` | Yes | Yes | **Match** |
| `/api/v1/ai/chat` | POST | `AIAssistantPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/auth/forgot-password` | POST | `ForgotPasswordPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/auth/verify-otp` | POST | `ForgotPasswordPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/auth/reset-password` | POST | `ForgotPasswordPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/auth/login` | POST | `LoginPage` | `AuthController` | Yes | Yes | **Match** |
| `/api/v1/auth/register` | POST | `RegistrationPage` | `AuthController` | Yes | Yes | **Match** |
| `/api/v1/challenges` | GET | `ChallengeHubPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/challenges/:id` | GET | `CodeEditorPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/challenges/execute` | POST | `CodeEditorPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/challenges/:id/submit` | POST | `CodeEditorPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/companies/:id` | GET | `CompanyProfilePage` | `index` | Yes | Yes | **Match** |
| `/api/v1/jobs` | GET | `CompanyProfilePage` | `index` | Yes | Yes | **Match** |
| `/api/v1/jobs/active?limit=3` | GET | `DeveloperDashboard` | `index` | Yes | Yes | **Match** |
| `/api/v1/achievements` | GET | `DeveloperDashboard` | `index` | Yes | Yes | **Match** |
| `/api/v1/jobs/active?limit=100` | GET | `RecruiterDashboard` | `index` | Yes | Yes | **Match** |
| `/api/v1/applications` | GET | `ApplicationsPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/jobs/:id` | GET | `JobDetailsPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/jobs/:id/apply` | POST | `JobDetailsPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/jobs` | POST | `JobPostingFlowPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/jobs?:id` | GET | `JobsPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/courses` | GET | `CourseCatalogPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/courses/:id` | GET | `CourseDetailPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/courses/:id/enroll` | POST | `CourseDetailPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/courses/:id` | GET | `VideoPlayerPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/lms/progress` | PUT | `VideoPlayerPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/users/profiles/discover` | GET | `NetworkingPage` | `index` | Yes | Yes | **Match** |
| `/api/v1/users/profiles/:id/connect` | POST | `NetworkingPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/users/profile` | GET | `ProfilePage` | `index` | Yes | Yes | **Match** |
| `/api/v1/users/profile` | PUT | `ProfilePage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/v1/settings/preferences` | PUT | `SettingsPage` | `Missing` | No | Yes | **Missing Backend Endpoint** |
| `/api/` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/health` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/collaboration` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/uploads` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api/docs` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `*` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/dashboard` | GET | `None` | `api` | Yes | No | **Unused by Frontend** |
| `/metrics` | GET | `None` | `api` | Yes | No | **Unused by Frontend** |
| `/alerts` | GET | `None` | `api` | Yes | No | **Unused by Frontend** |
| `/services` | GET | `None` | `api` | Yes | No | **Unused by Frontend** |
| `/system` | GET | `None` | `api` | Yes | No | **Unused by Frontend** |
| `/api/v1/auth` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api/v1/upload` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/health` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/admin/services` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/admin/metrics` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/admin/refresh-cache` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `*` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api/v1/challenges/:id/test-run` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api/v1/challenges/:id/submit` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/health` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/upload/profile-picture` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/upload/resume` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/uploads` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/health` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/metrics` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/users/:id/points` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/users/:id/points` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/users/:id/points/history` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/users/:id/badges` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/users/:id/badges` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/badges` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/users/:id/streaks` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/users/:id/streaks/checkin` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/leaderboard` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/actions` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/jobs/:id` | PUT | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/jobs/:id` | DELETE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api/v1/courses/:id/enroll` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/health` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api/v1/payments/webhook` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api/v1/payments/checkout` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/health` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api` | USE | `None` | `comprehensive-security-middleware` | Yes | No | **Unused by Frontend** |
| `/api` | USE | `None` | `comprehensive-security-middleware` | Yes | No | **Unused by Frontend** |
| `/api` | USE | `None` | `comprehensive-security-middleware` | Yes | No | **Unused by Frontend** |
| `/profiles` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id` | PUT | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id` | DELETE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/user/:userId` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id/skills` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id/skills` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/skills/:skillId` | PUT | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/skills/:skillId` | DELETE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id/experiences` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id/experiences` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/experiences/:experienceId` | PUT | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/experiences/:experienceId` | DELETE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id/educations` | POST | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/profiles/:id/educations` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/educations/:educationId` | PUT | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/educations/:educationId` | DELETE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/stream` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/health` | GET | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/vod` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/interview` | USE | `None` | `index` | Yes | No | **Unused by Frontend** |
| `/api` | USE | `None` | `service-template` | Yes | No | **Unused by Frontend** |
| `/health` | GET | `None` | `service-template` | Yes | No | **Unused by Frontend** |
| `/api/info` | GET | `None` | `service-template` | Yes | No | **Unused by Frontend** |
| `*` | USE | `None` | `service-template` | Yes | No | **Unused by Frontend** |
| `/rooms` | POST | `None` | `interview` | Yes | No | **Unused by Frontend** |
| `/rooms/:roomId` | GET | `None` | `interview` | Yes | No | **Unused by Frontend** |
| `/rooms/:roomId/end` | POST | `None` | `interview` | Yes | No | **Unused by Frontend** |
| `/upload` | POST | `None` | `vod` | Yes | No | **Unused by Frontend** |
| `/api/v1/analytics/events` | POST | `None` | `AnalyticsController` | Yes | No | **Unused by Frontend** |
| `/api/v1/analytics/user/:id` | GET | `None` | `AnalyticsController` | Yes | No | **Unused by Frontend** |
| `/api/v1/analytics/daily` | GET | `None` | `AnalyticsController` | Yes | No | **Unused by Frontend** |
| `/api/v1/applications/:id/status` | PUT | `None` | `ApplicationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/applications/:id` | DELETE | `None` | `ApplicationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/applications/:id/withdraw` | POST | `None` | `ApplicationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/auth/refresh` | POST | `None` | `AuthController` | Yes | No | **Unused by Frontend** |
| `/api/v1/challenges/:id/submit` | POST | `None` | `ChallengeController` | Yes | No | **Unused by Frontend** |
| `/api/v1/challenges/:id/submissions/:id/score` | PUT | `None` | `ChallengeController` | Yes | No | **Unused by Frontend** |
| `/api/v1/companies/:id` | PUT | `None` | `CompanyController` | Yes | No | **Unused by Frontend** |
| `/api/v1/companies/verified` | GET | `None` | `CompanyController` | Yes | No | **Unused by Frontend** |
| `/api/v1/companies/search` | GET | `None` | `CompanyController` | Yes | No | **Unused by Frontend** |
| `/api/v1/companies/:id/verify` | POST | `None` | `CompanyController` | Yes | No | **Unused by Frontend** |
| `/api/v1/companies/health` | GET | `None` | `CompanyController` | Yes | No | **Unused by Frontend** |
| `/api/v1/email/send` | POST | `None` | `EmailController` | Yes | No | **Unused by Frontend** |
| `/api/v1/email/send/templated` | POST | `None` | `EmailController` | Yes | No | **Unused by Frontend** |
| `/api/v1/email/templates/:id` | GET | `None` | `EmailController` | Yes | No | **Unused by Frontend** |
| `/api/v1/email/templates` | POST | `None` | `EmailController` | Yes | No | **Unused by Frontend** |
| `/api/v1/email/logs` | GET | `None` | `EmailController` | Yes | No | **Unused by Frontend** |
| `/api/v1/email/logs/:id/retry` | POST | `None` | `EmailController` | Yes | No | **Unused by Frontend** |
| `/api/v1/files/upload` | POST | `None` | `FileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/files/:id` | GET | `None` | `FileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/files/user/:id` | GET | `None` | `FileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/files/:id` | DELETE | `None` | `FileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/files/:id/download` | GET | `None` | `FileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/files/:id/presigned` | GET | `None` | `FileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/gamification/badge/award` | POST | `None` | `GamificationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/gamification/user/:id/badges` | GET | `None` | `GamificationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/gamification/user/:id/points` | POST | `None` | `GamificationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/gamification/user/:id/points` | GET | `None` | `GamificationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/gamification/leaderboard` | GET | `None` | `GamificationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/gamification/badges` | GET | `None` | `GamificationController` | Yes | No | **Unused by Frontend** |
| `/api/v1/jobs/:id` | PUT | `None` | `JobController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id` | GET | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id` | PUT | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id/experience` | POST | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id/experience/:id` | DELETE | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id/education` | POST | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id/education/:id` | DELETE | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/search` | GET | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id` | POST | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id` | PUT | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/:id` | GET | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/profiles/health` | GET | `None` | `UserProfileController` | Yes | No | **Unused by Frontend** |
| `/api/v1/videos/:id` | GET | `None` | `VideoController` | Yes | No | **Unused by Frontend** |
| `/api/v1/videos/user/:id` | GET | `None` | `VideoController` | Yes | No | **Unused by Frontend** |
| `/api/v1/videos/category/:id` | GET | `None` | `VideoController` | Yes | No | **Unused by Frontend** |
| `/api/v1/videos/:id` | DELETE | `None` | `VideoController` | Yes | No | **Unused by Frontend** |
| `/api/v1/videos/:id/view` | POST | `None` | `VideoController` | Yes | No | **Unused by Frontend** |
| `/api/v1/videos/trending` | GET | `None` | `VideoController` | Yes | No | **Unused by Frontend** |
| `/api/v1/videos/health` | GET | `None` | `VideoController` | Yes | No | **Unused by Frontend** |

## Frontend API Usage (Data Shape Requirements)

| Component | Endpoint Used | HTTP Method | Request Payload | Expected Response |
|---|---|---|---|---|
| `AuthProvider` | `() => { }` | POST | `None` | JSON Object |
| `AuthProvider` | `/api/v1/auth/logout` | POST | `{ refreshToken }` | JSON Object |
| `NotificationDropdown` | `/api/v1/notifications` | GET | `None` | JSON Object |
| `NotificationDropdown` | `/api/v1/notifications/read-all` | PUT | `None` | JSON Object |
| `NotificationDropdown` | `/api/v1/notifications/:id/read` | PUT | `None` | JSON Object |
| `GlobalSearch` | `/api/v1/search?q=:id` | GET | `None` | JSON Object |
| `AIAssistantPage` | `/api/v1/ai/chat` | POST | `{ message: trimmed }` | JSON Object |
| `ForgotPasswordPage` | `/api/v1/auth/forgot-password` | POST | `{ email }` | JSON Object |
| `ForgotPasswordPage` | `/api/v1/auth/verify-otp` | POST | `{ email, otp: code }` | JSON Object |
| `ForgotPasswordPage` | `/api/v1/auth/reset-password` | POST | `{ email, otp: otp.join(''), newPassword: password ` | JSON Object |
| `LoginPage` | `/api/v1/auth/login` | POST | `{                 email: formData.email,        ` | JSON Object |
| `RegistrationPage` | `/api/v1/auth/register` | POST | `{                 ...formData,                 r` | JSON Object |
| `ChallengeHubPage` | `/api/v1/challenges` | GET | `{ params }` | JSON Object |
| `CodeEditorPage` | `/api/v1/challenges/:id` | GET | `None` | JSON Object |
| `CodeEditorPage` | `/api/v1/challenges/execute` | POST | `{                 challengeId,                 l` | JSON Object |
| `CodeEditorPage` | `/api/v1/challenges/:id/submit` | POST | `{                 language,                 code` | JSON Object |
| `CompanyProfilePage` | `/api/v1/companies/:id` | GET | `None` | JSON Object |
| `CompanyProfilePage` | `/api/v1/jobs` | GET | `{ params: { search: companyData.name } }` | JSON Object |
| `DeveloperDashboard` | `/api/v1/jobs/active?limit=3` | GET | `None` | JSON Object |
| `DeveloperDashboard` | `/api/v1/achievements` | GET | `None` | JSON Object |
| `RecruiterDashboard` | `/api/v1/jobs/active?limit=100` | GET | `None` | JSON Object |
| `ApplicationsPage` | `/api/v1/applications` | GET | `None` | JSON Object |
| `JobDetailsPage` | `/api/v1/jobs/:id` | GET | `None` | JSON Object |
| `JobDetailsPage` | `/api/v1/jobs/:id/apply` | POST | `{                 coverLetter: applyForm.coverLett` | JSON Object |
| `JobPostingFlowPage` | `/api/v1/jobs` | POST | `payload` | JSON Object |
| `JobsPage` | `/api/v1/jobs?:id` | GET | `None` | JSON Object |
| `CourseCatalogPage` | `/api/v1/courses` | GET | `{ params }` | JSON Object |
| `CourseDetailPage` | `/api/v1/courses/:id` | GET | `None` | JSON Object |
| `CourseDetailPage` | `/api/v1/courses/:id/enroll` | POST | `None` | JSON Object |
| `VideoPlayerPage` | `/api/v1/courses/:id` | GET | `None` | JSON Object |
| `VideoPlayerPage` | `/api/v1/lms/progress` | PUT | `{                 courseId,                 less` | JSON Object |
| `NetworkingPage` | `/api/v1/users/profiles/discover` | GET | `{ params }` | JSON Object |
| `NetworkingPage` | `/api/v1/users/profiles/:id/connect` | POST | `None` | JSON Object |
| `ProfilePage` | `/api/v1/users/profile` | GET | `None` | JSON Object |
| `ProfilePage` | `/api/v1/users/profile` | PUT | `payload` | JSON Object |
| `SettingsPage` | `/api/v1/settings/preferences` | PUT | `{ notifPrefs, privacyPrefs }` | JSON Object |

## Backend Endpoints (Full Route Map)

| Endpoint Path | Method | Controller | Framework | Auth Required | Request Schema | Response |
|---|---|---|---|---|---|---|
| `/api/` | USE | `index` | Node.js | No | None | Unknown |
| `/health` | GET | `index` | Node.js | No | None | Unknown |
| `/collaboration` | USE | `index` | Node.js | No | None | Unknown |
| `/uploads` | USE | `index` | Node.js | No | None | Unknown |
| `/api/docs` | GET | `index` | Node.js | No | None | JSON Payload |
| `*` | USE | `index` | Node.js | No | None | Unknown |
| `/dashboard` | GET | `api` | Node.js | No | timeRange | JSON Payload |
| `/metrics` | GET | `api` | Node.js | No | metric, timeRange | JSON Payload |
| `/alerts` | GET | `api` | Node.js | No | severity, limit | JSON Payload |
| `/services` | GET | `api` | Node.js | No | None | JSON Payload |
| `/system` | GET | `api` | Node.js | No | None | JSON Payload |
| `/api/v1/auth` | USE | `index` | Node.js | No | None | Unknown |
| `/api/v1/upload` | USE | `index` | Node.js | No | None | Unknown |
| `/api` | USE | `index` | Node.js | No | None | Unknown |
| `/health` | GET | `index` | Node.js | No | None | Unknown |
| `/admin/services` | GET | `index` | Node.js | No | None | JSON Payload |
| `/admin/metrics` | GET | `index` | Node.js | No | None | JSON Payload |
| `/admin/refresh-cache` | POST | `index` | Node.js | No | None | JSON Payload |
| `/` | GET | `index` | Node.js | No | None | JSON Payload |
| `*` | USE | `index` | Node.js | No | None | Unknown |
| `/api/v1/challenges` | GET | `index` | Node.js | No | None | JSON Payload |
| `/api/v1/challenges/:slug` | GET | `index` | Node.js | No | slug | JSON Payload |
| `/api/v1/challenges/:id/test-run` | POST | `index` | Node.js | No | id, code, language | JSON Payload |
| `/api/v1/challenges/:id/submit` | POST | `index` | Node.js | No | id, code, language, userId | JSON Payload |
| `/health` | GET | `index` | Node.js | No | None | JSON Payload |
| `/upload/profile-picture` | POST | `index` | Node.js | No | userId | JSON Payload |
| `/upload/resume` | POST | `index` | Node.js | No | userId | JSON Payload |
| `/uploads` | USE | `index` | Node.js | No | None | Unknown |
| `/health` | GET | `index` | Node.js | No | None | JSON Payload |
| `/metrics` | GET | `index` | Node.js | No | None | JSON Payload |
| `/users/:id/points` | GET | `index` | Node.js | No | id | JSON Payload |
| `/users/:id/points` | POST | `index` | Node.js | No | id, action, description | JSON Payload |
| `/users/:id/points/history` | GET | `index` | Node.js | No | id, limit | JSON Payload |
| `/users/:id/badges` | GET | `index` | Node.js | No | id | JSON Payload |
| `/users/:id/badges` | POST | `index` | Node.js | No | id, badge_key | Unknown |
| `/badges` | GET | `index` | Node.js | No | None | JSON Payload |
| `/users/:id/streaks` | GET | `index` | Node.js | No | id | JSON Payload |
| `/users/:id/streaks/checkin` | POST | `index` | Node.js | No | id | JSON Payload |
| `/leaderboard` | GET | `index` | Node.js | No | limit | JSON Payload |
| `/actions` | GET | `index` | Node.js | No | None | JSON Payload |
| `/jobs` | POST | `index` | Node.js | No | None | Unknown |
| `/jobs` | GET | `index` | Node.js | No | None | Unknown |
| `/jobs/:id` | GET | `index` | Node.js | No | None | Unknown |
| `/jobs/:id` | PUT | `index` | Node.js | No | None | Unknown |
| `/jobs/:id` | DELETE | `index` | Node.js | No | None | Unknown |
| `/jobs/:id/apply` | POST | `index` | Node.js | No | None | Unknown |
| `/jobs/:id/applications` | GET | `index` | Node.js | No | None | Unknown |
| `/api/v1/courses` | GET | `index` | Node.js | No | None | JSON Payload |
| `/api/v1/courses` | POST | `index` | Node.js | No | None | JSON Payload |
| `/api/v1/courses/:id` | GET | `index` | Node.js | No | id | JSON Payload |
| `/api/v1/courses/:id/enroll` | POST | `index` | Node.js | No | id | JSON Payload |
| `/health` | GET | `index` | Node.js | No | None | JSON Payload |
| `/api/v1/payments/webhook` | POST | `index` | Node.js | No | None | Unknown |
| `/api/v1/payments/checkout` | POST | `index` | Node.js | No | None | JSON Payload |
| `/health` | GET | `index` | Node.js | No | None | JSON Payload |
| `/api` | USE | `comprehensive-security-middleware` | Node.js | No | None | Unknown |
| `/api` | USE | `comprehensive-security-middleware` | Node.js | No | None | Unknown |
| `/api` | USE | `comprehensive-security-middleware` | Node.js | No | None | Unknown |
| `/profiles` | POST | `index` | Node.js | No | None | Unknown |
| `/profiles/:id` | GET | `index` | Node.js | No | None | Unknown |
| `/profiles/:id` | PUT | `index` | Node.js | No | None | Unknown |
| `/profiles/:id` | DELETE | `index` | Node.js | No | None | Unknown |
| `/profiles/user/:userId` | GET | `index` | Node.js | No | None | Unknown |
| `/profiles/:id/skills` | POST | `index` | Node.js | No | None | Unknown |
| `/profiles/:id/skills` | GET | `index` | Node.js | No | None | Unknown |
| `/skills/:skillId` | PUT | `index` | Node.js | No | None | Unknown |
| `/skills/:skillId` | DELETE | `index` | Node.js | No | None | Unknown |
| `/profiles/:id/experiences` | POST | `index` | Node.js | No | None | Unknown |
| `/profiles/:id/experiences` | GET | `index` | Node.js | No | None | Unknown |
| `/experiences/:experienceId` | PUT | `index` | Node.js | No | None | Unknown |
| `/experiences/:experienceId` | DELETE | `index` | Node.js | No | None | Unknown |
| `/profiles/:id/educations` | POST | `index` | Node.js | No | None | Unknown |
| `/profiles/:id/educations` | GET | `index` | Node.js | No | None | Unknown |
| `/educations/:educationId` | PUT | `index` | Node.js | No | None | Unknown |
| `/educations/:educationId` | DELETE | `index` | Node.js | No | None | Unknown |
| `/stream` | USE | `index` | Node.js | No | None | Unknown |
| `/health` | GET | `index` | Node.js | No | None | JSON Payload |
| `/vod` | USE | `index` | Node.js | No | None | Unknown |
| `/interview` | USE | `index` | Node.js | No | None | Unknown |
| `/api` | USE | `service-template` | Node.js | No | None | Unknown |
| `/health` | GET | `service-template` | Node.js | No | None | JSON Payload |
| `/api/info` | GET | `service-template` | Node.js | No | None | JSON Payload |
| `/api/v1` | GET | `service-template` | Node.js | No | None | JSON Payload |
| `*` | USE | `service-template` | Node.js | No | None | Unknown |
| `/rooms` | POST | `interview` | Node.js | No | interviewerId, candidateId, scheduledAt | JSON Payload |
| `/rooms/:roomId` | GET | `interview` | Node.js | No | roomId | JSON Payload |
| `/rooms/:roomId/end` | POST | `interview` | Node.js | No | roomId | JSON Payload |
| `/upload` | POST | `vod` | Node.js | No | None | JSON Payload |
| `/api/v1/analytics/events` | POST | `AnalyticsController` | Spring Boot | No | AnalyticsEvent | DTO/JSON |
| `/api/v1/analytics/user/:id` | GET | `AnalyticsController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/analytics/daily` | GET | `AnalyticsController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/applications/:id` | GET | `ApplicationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/applications/candidate/:id` | GET | `ApplicationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/applications/job/:id` | GET | `ApplicationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/applications/:id/status` | PUT | `ApplicationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/applications/:id/timeline` | GET | `ApplicationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/applications/:id` | DELETE | `ApplicationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/applications/:id/withdraw` | POST | `ApplicationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/auth/register` | POST | `AuthController` | Spring Boot | No | RegisterRequest | DTO/JSON |
| `/api/v1/auth/login` | POST | `AuthController` | Spring Boot | No | LoginRequest | DTO/JSON |
| `/api/v1/auth/refresh` | POST | `AuthController` | Spring Boot | No | Map | DTO/JSON |
| `/api/v1/auth/logout` | POST | `AuthController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/challenges/:id` | GET | `ChallengeController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/challenges/active` | GET | `ChallengeController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/challenges/:id/submit` | POST | `ChallengeController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/challenges/user/:id/submissions` | GET | `ChallengeController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/challenges/:id/submissions/:id/score` | PUT | `ChallengeController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/challenges/health` | GET | `ChallengeController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/companies/:id` | PUT | `CompanyController` | Spring Boot | No | CompanyRequest | DTO/JSON |
| `/api/v1/companies/:id` | GET | `CompanyController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/companies/verified` | GET | `CompanyController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/companies/search` | GET | `CompanyController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/companies/:id/verify` | POST | `CompanyController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/companies/health` | GET | `CompanyController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/email/send` | POST | `EmailController` | Spring Boot | No | SendEmailRequest | DTO/JSON |
| `/api/v1/email/send/templated` | POST | `EmailController` | Spring Boot | No | SendTemplatedEmailRequest | DTO/JSON |
| `/api/v1/email/templates/:id` | GET | `EmailController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/email/templates` | POST | `EmailController` | Spring Boot | No | EmailTemplate | DTO/JSON |
| `/api/v1/email/logs` | GET | `EmailController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/email/logs/:id/retry` | POST | `EmailController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/files/upload` | POST | `FileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/files/:id` | GET | `FileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/files/user/:id` | GET | `FileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/files/:id` | DELETE | `FileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/files/:id/download` | GET | `FileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/files/:id/presigned` | GET | `FileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/gamification/badge/award` | POST | `GamificationController` | Spring Boot | No | AwardBadgeRequest | DTO/JSON |
| `/api/v1/gamification/user/:id/badges` | GET | `GamificationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/gamification/user/:id/points` | POST | `GamificationController` | Spring Boot | No | AddPointsRequest | DTO/JSON |
| `/api/v1/gamification/user/:id/points` | GET | `GamificationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/gamification/leaderboard` | GET | `GamificationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/gamification/badges` | GET | `GamificationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/jobs/:id` | PUT | `JobController` | Spring Boot | No | JobListing | DTO/JSON |
| `/api/v1/jobs/:id` | GET | `JobController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/jobs/featured` | GET | `JobController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/jobs/:id/apply` | POST | `JobController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/jobs/:id/applications` | GET | `JobController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/jobs/health` | GET | `JobController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/notifications/unread` | GET | `NotificationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/notifications/:id/read` | PUT | `NotificationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/notifications/read-all` | PUT | `NotificationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/notifications/health` | GET | `NotificationController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/search/health` | GET | `SearchController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/profiles/:id` | GET | `UserProfileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/profiles/:id` | PUT | `UserProfileController` | Spring Boot | No | UserProfile | DTO/JSON |
| `/api/v1/profiles/:id/experience` | POST | `UserProfileController` | Spring Boot | No | WorkExperience | DTO/JSON |
| `/api/v1/profiles/:id/experience/:id` | DELETE | `UserProfileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/profiles/:id/education` | POST | `UserProfileController` | Spring Boot | No | Education | DTO/JSON |
| `/api/v1/profiles/:id/education/:id` | DELETE | `UserProfileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/profiles/search` | GET | `UserProfileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/profiles/:id` | POST | `UserProfileController` | Spring Boot | No | UserProfileDTO | DTO/JSON |
| `/api/v1/profiles/:id` | PUT | `UserProfileController` | Spring Boot | No | UserProfileDTO | DTO/JSON |
| `/api/v1/profiles/:id` | GET | `UserProfileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/profiles/health` | GET | `UserProfileController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/videos/:id` | GET | `VideoController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/videos/user/:id` | GET | `VideoController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/videos/category/:id` | GET | `VideoController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/videos/:id` | DELETE | `VideoController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/videos/:id/view` | POST | `VideoController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/videos/trending` | GET | `VideoController` | Spring Boot | No | None | DTO/JSON |
| `/api/v1/videos/health` | GET | `VideoController` | Spring Boot | No | None | DTO/JSON |

## Backend Module Profiles

### index

**Basic Information:**
- **File**: `backends/shared/tracing/index.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### server

**Basic Information:**
- **File**: `services/video-service/server.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### auth-middleware

**Basic Information:**
- **File**: `backends/shared/auth-middleware.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### database-connection

**Basic Information:**
- **File**: `backends/shared/database-connection.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### database-schema

**Basic Information:**
- **File**: `backends/shared/database-schema.js`
- **Framework**: Node.js / Express
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### enhanced-security-manager

**Basic Information:**
- **File**: `backends/shared/enhanced-security-manager.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### enhanced-service-template

**Basic Information:**
- **File**: `backends/shared/enhanced-service-template.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### enhanced-service-with-tracing

**Basic Information:**
- **File**: `backends/backend-enhanced/shared/enhanced-service-with-tracing.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### error-handler

**Basic Information:**
- **File**: `services/shared/error-handler.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### performance-optimizer

**Basic Information:**
- **File**: `backends/shared/performance-optimizer.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### refresh-token-service

**Basic Information:**
- **File**: `backends/shared/refresh-token-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### secure-database-connection

**Basic Information:**
- **File**: `backends/shared/secure-database-connection.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### secure-query-builder

**Basic Information:**
- **File**: `backends/shared/secure-query-builder.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### security-middleware

**Basic Information:**
- **File**: `services/shared/security-middleware.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### security

**Basic Information:**
- **File**: `backends/shared/security.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### service-registry

**Basic Information:**
- **File**: `services/shared/service-registry.ts`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### service-template

**Basic Information:**
- **File**: `backends/shared/templates/service-template.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: `/api`, `/health`, `/api/info`, `/api/v1`, `*`
- **Methods**: USE, GET
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### test-jwt-middleware

**Basic Information:**
- **File**: `backends/shared/test-jwt-middleware.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### analytics-service

**Basic Information:**
- **File**: `services/analytics-service/analytics-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### api

**Basic Information:**
- **File**: `services/video-service/api.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### resume-processing-service

**Basic Information:**
- **File**: `services/file-service/resume-processing-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### db

**Basic Information:**
- **File**: `services/messaging-service/db.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### messaging-service

**Basic Information:**
- **File**: `services/messaging-service/messaging-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### bundle-analyzer

**Basic Information:**
- **File**: `services/performance-monitoring/bundle-analyzer.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### cache-warmer

**Basic Information:**
- **File**: `services/performance-monitoring/cache-warmer.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### caching-middleware

**Basic Information:**
- **File**: `services/performance-monitoring/caching-middleware.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### caching-service

**Basic Information:**
- **File**: `services/performance-monitoring/caching-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### cdn-config

**Basic Information:**
- **File**: `services/performance-monitoring/cdn-config.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### cdn-deployer

**Basic Information:**
- **File**: `services/performance-monitoring/cdn-deployer.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### connection-pool

**Basic Information:**
- **File**: `services/performance-monitoring/connection-pool.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### database-optimizer

**Basic Information:**
- **File**: `services/performance-monitoring/database-optimizer.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### db-optimize

**Basic Information:**
- **File**: `services/performance-monitoring/db-optimize.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### frontend-monitor

**Basic Information:**
- **File**: `services/performance-monitoring/frontend-monitor.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### load-tester

**Basic Information:**
- **File**: `services/performance-monitoring/load-tester.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### middleware

**Basic Information:**
- **File**: `services/performance-monitoring/middleware.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### performance-monitoring-service

**Basic Information:**
- **File**: `services/performance-monitoring/performance-monitoring-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### PerformanceDashboard

**Basic Information:**
- **File**: `services/performance-monitoring/PerformanceDashboard.jsx`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### pool-configurator

**Basic Information:**
- **File**: `services/performance-monitoring/pool-configurator.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### stress-test

**Basic Information:**
- **File**: `services/performance-monitoring/stress-test.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### webpack-optimizer

**Basic Information:**
- **File**: `services/performance-monitoring/webpack-optimizer.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ai-matching-service

**Basic Information:**
- **File**: `services/recruitment-service/ai-matching-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### optimized-recruitment-service

**Basic Information:**
- **File**: `services/recruitment-service/optimized-recruitment-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### elasticsearch-service

**Basic Information:**
- **File**: `services/search-service/elasticsearch-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### base-repository

**Basic Information:**
- **File**: `services/shared/base-repository.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### base-service

**Basic Information:**
- **File**: `backends/backend-enhanced/shared/base-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### config-validator

**Basic Information:**
- **File**: `services/shared/config-validator.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### database-connection-pool

**Basic Information:**
- **File**: `services/shared/database-connection-pool.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### database-manager

**Basic Information:**
- **File**: `services/shared/database-manager.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### enhanced-base-repository

**Basic Information:**
- **File**: `services/shared/enhanced-base-repository.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### enhanced-logger

**Basic Information:**
- **File**: `services/shared/enhanced-logger.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### health-check-framework

**Basic Information:**
- **File**: `services/shared/health-check-framework.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### http-client-utils

**Basic Information:**
- **File**: `services/shared/http-client-utils.ts`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### inter-service-auth

**Basic Information:**
- **File**: `services/shared/inter-service-auth.ts`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### log-aggregator

**Basic Information:**
- **File**: `services/shared/log-aggregator.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### logger

**Basic Information:**
- **File**: `services/shared/logger.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### production-service-client

**Basic Information:**
- **File**: `services/shared/production-service-client.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### redis-cache-manager

**Basic Information:**
- **File**: `services/shared/redis-cache-manager.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### secure-base-repository

**Basic Information:**
- **File**: `services/shared/secure-base-repository.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### security-middleware-config

**Basic Information:**
- **File**: `services/shared/security-middleware-config.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### service-client-factory

**Basic Information:**
- **File**: `services/shared/service-client-factory.ts`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### service-client

**Basic Information:**
- **File**: `services/shared/service-client.ts`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### service-discovery

**Basic Information:**
- **File**: `services/shared/service-discovery.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### talentsphere-cache

**Basic Information:**
- **File**: `services/shared/talentsphere-cache.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### test-framework

**Basic Information:**
- **File**: `services/shared/test-framework.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### test-setup

**Basic Information:**
- **File**: `services/shared/test-setup.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### service-communication-integration-test

**Basic Information:**
- **File**: `services/test/service-communication-integration-test.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### video-interview-service

**Basic Information:**
- **File**: `services/video-service/video-interview-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### central-auth-service

**Basic Information:**
- **File**: `backends/backend-enhanced/auth-service/central-auth-service.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### company-repository

**Basic Information:**
- **File**: `backends/backend-enhanced/company-service/company-repository.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### index-database

**Basic Information:**
- **File**: `backends/backend-enhanced/user-service/index-database.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### validation-middleware

**Basic Information:**
- **File**: `backends/backend-enhanced/job-service/validation-middleware.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### validation

**Basic Information:**
- **File**: `backends/backend-enhanced/shared/validation.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### database-pool

**Basic Information:**
- **File**: `backends/backend-enhanced/notification-service/database-pool.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### comprehensive-security-middleware

**Basic Information:**
- **File**: `backends/backend-enhanced/shared/comprehensive-security-middleware.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: `/api`
- **Methods**: USE
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### contracts

**Basic Information:**
- **File**: `backends/backend-enhanced/shared/contracts.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### redis-client

**Basic Information:**
- **File**: `backends/backend-enhanced/shared/redis-client.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### index-clean

**Basic Information:**
- **File**: `backends/backend-enhanced/user-service/index-clean.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### index-updated

**Basic Information:**
- **File**: `backends/backend-enhanced/user-service/index-updated.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### auth

**Basic Information:**
- **File**: `backends/shared/middleware/auth.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### cors

**Basic Information:**
- **File**: `backends/shared/middleware/cors.js`
- **Framework**: Node.js / Express
- **Module Type**: Module
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### generate-coverage-report

**Basic Information:**
- **File**: `services/analytics-service/scripts/generate-coverage-report.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### test-helpers

**Basic Information:**
- **File**: `services/analytics-service/tests/test-helpers.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### matchLogic.test

**Basic Information:**
- **File**: `backends/backend-enhanced/search-service/test/matchLogic.test.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### interview

**Basic Information:**
- **File**: `backends/backend-enhanced/video-service/routes/interview.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: `/rooms`, `/rooms/:roomId`, `/rooms/:roomId/end`
- **Methods**: POST, GET
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: interviewerId, candidateId, scheduledAt, roomId
- **CRUD / DB Operations**: None detected

### vod

**Basic Information:**
- **File**: `backends/backend-enhanced/video-service/routes/vod.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: `/upload`
- **Methods**: POST
- **Middleware**: `upload.single('video')`
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### integration-test-framework

**Basic Information:**
- **File**: `services/analytics-service/tests/integration/integration-test-framework.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### simple.integration.test

**Basic Information:**
- **File**: `services/analytics-service/tests/integration/simple.integration.test.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### jest.setup

**Basic Information:**
- **File**: `services/analytics-service/tests/setup/jest.setup.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### analytics-service.test

**Basic Information:**
- **File**: `services/analytics-service/tests/unit/analytics-service.test.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### simple-analytics.test

**Basic Information:**
- **File**: `services/analytics-service/tests/unit/simple-analytics.test.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### api.test

**Basic Information:**
- **File**: `services/messaging-service/tests/unit/api.test.js`
- **Framework**: Node.js / Express
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserRepository

**Basic Information:**
- **File**: `spring-boot/auth-service/src/main/java/com/talentsphere/auth/repository/UserRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### conftest

**Basic Information:**
- **File**: `backends/conftest.py`
- **Framework**: Flask
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### validate-api-contracts-enhanced

**Basic Information:**
- **File**: `scripts/validate-api-contracts-enhanced.py`
- **Framework**: Flask
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### validate-api-contracts

**Basic Information:**
- **File**: `scripts/validate-api-contracts.py`
- **Framework**: Flask
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### AnalyticsController

**Basic Information:**
- **File**: `spring-boot/analytics-service/src/main/java/com/talentsphere/analytics/controller/AnalyticsController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/analytics/events`, `/api/v1/analytics/user/:id`, `/api/v1/analytics/daily`
- **Methods**: POST, GET
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: AnalyticsEvent
- **CRUD / DB Operations**: None detected

### AnalyticsEvent

**Basic Information:**
- **File**: `spring-boot/analytics-service/src/main/java/com/talentsphere/analytics/entity/AnalyticsEvent.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### DailyMetrics

**Basic Information:**
- **File**: `spring-boot/analytics-service/src/main/java/com/talentsphere/analytics/entity/DailyMetrics.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### GlobalExceptionHandler

**Basic Information:**
- **File**: `spring-boot/video-service/src/main/java/com/talentsphere/video/exception/GlobalExceptionHandler.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### AnalyticsEventRepository

**Basic Information:**
- **File**: `spring-boot/analytics-service/src/main/java/com/talentsphere/analytics/repository/AnalyticsEventRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### DailyMetricsRepository

**Basic Information:**
- **File**: `spring-boot/analytics-service/src/main/java/com/talentsphere/analytics/repository/DailyMetricsRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### AnalyticsService

**Basic Information:**
- **File**: `spring-boot/analytics-service/src/main/java/com/talentsphere/analytics/service/AnalyticsService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ApplicationController

**Basic Information:**
- **File**: `spring-boot/application-service/src/main/java/com/talentsphere/application/controller/ApplicationController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/applications/:id`, `/api/v1/applications/candidate/:id`, `/api/v1/applications/job/:id`, `/api/v1/applications/:id/status`, `/api/v1/applications/:id/timeline`, `/api/v1/applications/:id/withdraw`
- **Methods**: GET, PUT, DELETE, POST
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ApplicationTimeline

**Basic Information:**
- **File**: `spring-boot/application-service/src/main/java/com/talentsphere/application/entity/ApplicationTimeline.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### JobApplication

**Basic Information:**
- **File**: `spring-boot/application-service/src/main/java/com/talentsphere/application/entity/JobApplication.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ApplicationTimelineRepository

**Basic Information:**
- **File**: `spring-boot/application-service/src/main/java/com/talentsphere/application/repository/ApplicationTimelineRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### JobApplicationRepository

**Basic Information:**
- **File**: `spring-boot/application-service/src/main/java/com/talentsphere/application/repository/JobApplicationRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ApplicationService

**Basic Information:**
- **File**: `spring-boot/job-service/src/main/java/com/talentsphere/job/service/ApplicationService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### AuthServiceApplication

**Basic Information:**
- **File**: `spring-boot/auth-service/src/main/java/com/talentsphere/auth/AuthServiceApplication.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### AuthController

**Basic Information:**
- **File**: `spring-boot/auth-service/src/main/java/com/talentsphere/auth/controller/AuthController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`
- **Methods**: POST
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: RegisterRequest, LoginRequest, Map
- **CRUD / DB Operations**: None detected

### User

**Basic Information:**
- **File**: `spring-boot/auth-service/src/main/java/com/talentsphere/auth/entity/User.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### AuthService

**Basic Information:**
- **File**: `spring-boot/auth-service/src/main/java/com/talentsphere/auth/service/AuthService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ChallengeController

**Basic Information:**
- **File**: `spring-boot/challenge-service/src/main/java/com/talentsphere/challenge/controller/ChallengeController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/challenges/:id`, `/api/v1/challenges/active`, `/api/v1/challenges/:id/submit`, `/api/v1/challenges/user/:id/submissions`, `/api/v1/challenges/:id/submissions/:id/score`, `/api/v1/challenges/health`
- **Methods**: GET, POST, PUT
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### Challenge

**Basic Information:**
- **File**: `spring-boot/challenge-service/src/main/java/com/talentsphere/challenge/entity/Challenge.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ChallengeSubmission

**Basic Information:**
- **File**: `spring-boot/challenge-service/src/main/java/com/talentsphere/challenge/entity/ChallengeSubmission.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ChallengeRepository

**Basic Information:**
- **File**: `spring-boot/challenge-service/src/main/java/com/talentsphere/challenge/repository/ChallengeRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ChallengeSubmissionRepository

**Basic Information:**
- **File**: `spring-boot/challenge-service/src/main/java/com/talentsphere/challenge/repository/ChallengeSubmissionRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ChallengeService

**Basic Information:**
- **File**: `spring-boot/challenge-service/src/main/java/com/talentsphere/challenge/service/ChallengeService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### BaseEntity

**Basic Information:**
- **File**: `spring-boot/common/src/main/java/com/talentsphere/common/model/BaseEntity.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### WebhookService

**Basic Information:**
- **File**: `spring-boot/common/src/main/java/com/talentsphere/common/webhook/WebhookService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### CompanyController

**Basic Information:**
- **File**: `spring-boot/company-service/src/main/java/com/talentsphere/company/controller/CompanyController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/companies/:id`, `/api/v1/companies/verified`, `/api/v1/companies/search`, `/api/v1/companies/:id/verify`, `/api/v1/companies/health`
- **Methods**: PUT, GET, POST
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: CompanyRequest
- **CRUD / DB Operations**: None detected

### Company

**Basic Information:**
- **File**: `spring-boot/company-service/src/main/java/com/talentsphere/company/entity/Company.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### CompanyRepository

**Basic Information:**
- **File**: `spring-boot/company-service/src/main/java/com/talentsphere/company/repository/CompanyRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### CompanyService

**Basic Information:**
- **File**: `spring-boot/company-service/src/main/java/com/talentsphere/company/service/CompanyService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### EmailController

**Basic Information:**
- **File**: `spring-boot/email-service/src/main/java/com/talentsphere/email/controller/EmailController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/email/send`, `/api/v1/email/send/templated`, `/api/v1/email/templates/:id`, `/api/v1/email/templates`, `/api/v1/email/logs`, `/api/v1/email/logs/:id/retry`
- **Methods**: POST, GET
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: SendEmailRequest, SendTemplatedEmailRequest, EmailTemplate
- **CRUD / DB Operations**: None detected

### EmailLog

**Basic Information:**
- **File**: `spring-boot/email-service/src/main/java/com/talentsphere/email/entity/EmailLog.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### EmailTemplate

**Basic Information:**
- **File**: `spring-boot/email-service/src/main/java/com/talentsphere/email/entity/EmailTemplate.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### EmailLogRepository

**Basic Information:**
- **File**: `spring-boot/email-service/src/main/java/com/talentsphere/email/repository/EmailLogRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### EmailTemplateRepository

**Basic Information:**
- **File**: `spring-boot/email-service/src/main/java/com/talentsphere/email/repository/EmailTemplateRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### EmailService

**Basic Information:**
- **File**: `spring-boot/email-service/src/main/java/com/talentsphere/email/service/EmailService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### FileController

**Basic Information:**
- **File**: `spring-boot/file-service/src/main/java/com/talentsphere/file/controller/FileController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/files/upload`, `/api/v1/files/:id`, `/api/v1/files/user/:id`, `/api/v1/files/:id/download`, `/api/v1/files/:id/presigned`
- **Methods**: POST, GET, DELETE
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### FileMetadata

**Basic Information:**
- **File**: `spring-boot/file-service/src/main/java/com/talentsphere/file/entity/FileMetadata.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### FileMetadataRepository

**Basic Information:**
- **File**: `spring-boot/file-service/src/main/java/com/talentsphere/file/repository/FileMetadataRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### FileService

**Basic Information:**
- **File**: `spring-boot/file-service/src/main/java/com/talentsphere/file/service/FileService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### GamificationController

**Basic Information:**
- **File**: `spring-boot/gamification-service/src/main/java/com/talentsphere/gamification/controller/GamificationController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/gamification/badge/award`, `/api/v1/gamification/user/:id/badges`, `/api/v1/gamification/user/:id/points`, `/api/v1/gamification/leaderboard`, `/api/v1/gamification/badges`
- **Methods**: POST, GET
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: AwardBadgeRequest, AddPointsRequest
- **CRUD / DB Operations**: None detected

### Badge

**Basic Information:**
- **File**: `spring-boot/gamification-service/src/main/java/com/talentsphere/gamification/entity/Badge.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserBadge

**Basic Information:**
- **File**: `spring-boot/gamification-service/src/main/java/com/talentsphere/gamification/entity/UserBadge.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserPoints

**Basic Information:**
- **File**: `spring-boot/gamification-service/src/main/java/com/talentsphere/gamification/entity/UserPoints.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### BadgeRepository

**Basic Information:**
- **File**: `spring-boot/gamification-service/src/main/java/com/talentsphere/gamification/repository/BadgeRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserBadgeRepository

**Basic Information:**
- **File**: `spring-boot/gamification-service/src/main/java/com/talentsphere/gamification/repository/UserBadgeRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserPointsRepository

**Basic Information:**
- **File**: `spring-boot/gamification-service/src/main/java/com/talentsphere/gamification/repository/UserPointsRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### GamificationService

**Basic Information:**
- **File**: `spring-boot/gamification-service/src/main/java/com/talentsphere/gamification/service/GamificationService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### JobController

**Basic Information:**
- **File**: `spring-boot/job-service/src/main/java/com/talentsphere/job/controller/JobController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/jobs/:id`, `/api/v1/jobs/featured`, `/api/v1/jobs/:id/apply`, `/api/v1/jobs/:id/applications`, `/api/v1/jobs/health`
- **Methods**: PUT, GET, POST
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: JobListing
- **CRUD / DB Operations**: None detected

### Application

**Basic Information:**
- **File**: `spring-boot/job-service/src/main/java/com/talentsphere/job/entity/Application.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### JobListing

**Basic Information:**
- **File**: `spring-boot/job-service/src/main/java/com/talentsphere/job/entity/JobListing.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### ApplicationRepository

**Basic Information:**
- **File**: `spring-boot/job-service/src/main/java/com/talentsphere/job/repository/ApplicationRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### JobListingRepository

**Basic Information:**
- **File**: `spring-boot/job-service/src/main/java/com/talentsphere/job/repository/JobListingRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### JobListingService

**Basic Information:**
- **File**: `spring-boot/job-service/src/main/java/com/talentsphere/job/service/JobListingService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### NotificationController

**Basic Information:**
- **File**: `spring-boot/notification-service/src/main/java/com/talentsphere/notification/controller/NotificationController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/notifications/unread`, `/api/v1/notifications/:id/read`, `/api/v1/notifications/read-all`, `/api/v1/notifications/health`
- **Methods**: GET, PUT
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### Notification

**Basic Information:**
- **File**: `spring-boot/notification-service/src/main/java/com/talentsphere/notification/entity/Notification.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### NotificationRepository

**Basic Information:**
- **File**: `spring-boot/notification-service/src/main/java/com/talentsphere/notification/repository/NotificationRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### NotificationService

**Basic Information:**
- **File**: `spring-boot/notification-service/src/main/java/com/talentsphere/notification/service/NotificationService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### SearchController

**Basic Information:**
- **File**: `spring-boot/search-service/src/main/java/com/talentsphere/search/controller/SearchController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/search/health`
- **Methods**: GET
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### SearchService

**Basic Information:**
- **File**: `spring-boot/search-service/src/main/java/com/talentsphere/search/service/SearchService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserProfileController

**Basic Information:**
- **File**: `spring-boot/user-service/src/main/java/com/talentsphere/user/controller/UserProfileController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/profiles/:id`, `/api/v1/profiles/health`
- **Methods**: POST, PUT, GET
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: UserProfileDTO
- **CRUD / DB Operations**: None detected

### Education

**Basic Information:**
- **File**: `spring-boot/user-profile-service/src/main/java/com/talentsphere/userprofile/entity/Education.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserProfile

**Basic Information:**
- **File**: `spring-boot/user-service/src/main/java/com/talentsphere/user/entity/UserProfile.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### WorkExperience

**Basic Information:**
- **File**: `spring-boot/user-profile-service/src/main/java/com/talentsphere/userprofile/entity/WorkExperience.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### EducationRepository

**Basic Information:**
- **File**: `spring-boot/user-profile-service/src/main/java/com/talentsphere/userprofile/repository/EducationRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserProfileRepository

**Basic Information:**
- **File**: `spring-boot/user-service/src/main/java/com/talentsphere/user/repository/UserProfileRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### WorkExperienceRepository

**Basic Information:**
- **File**: `spring-boot/user-profile-service/src/main/java/com/talentsphere/userprofile/repository/WorkExperienceRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### UserProfileService

**Basic Information:**
- **File**: `spring-boot/user-service/src/main/java/com/talentsphere/user/service/UserProfileService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### VideoController

**Basic Information:**
- **File**: `spring-boot/video-service/src/main/java/com/talentsphere/video/controller/VideoController.java`
- **Framework**: Spring Boot
- **Module Type**: Controller
**Endpoint Coverage:**
- **Endpoints**: `/api/v1/videos/:id`, `/api/v1/videos/user/:id`, `/api/v1/videos/category/:id`, `/api/v1/videos/:id/view`, `/api/v1/videos/trending`, `/api/v1/videos/health`
- **Methods**: GET, DELETE, POST
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### VideoMetadata

**Basic Information:**
- **File**: `spring-boot/video-service/src/main/java/com/talentsphere/video/entity/VideoMetadata.java`
- **Framework**: Spring Boot
- **Module Type**: Model
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### VideoMetadataRepository

**Basic Information:**
- **File**: `spring-boot/video-service/src/main/java/com/talentsphere/video/repository/VideoMetadataRepository.java`
- **Framework**: Spring Boot
- **Module Type**: Repository
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

### VideoService

**Basic Information:**
- **File**: `spring-boot/video-service/src/main/java/com/talentsphere/video/service/VideoService.java`
- **Framework**: Spring Boot
- **Module Type**: Service
**Endpoint Coverage:**
- **Endpoints**: None defined
- **Methods**: None
- **Middleware**: None
**Data & Security Coverage:**
- **Request Signatures (Params)**: None destructured
- **CRUD / DB Operations**: None detected

## Data Flow Map

```mermaid
flowchart TD;
  User((User)) --> FE_Comp[Frontend Component];
  FE_Comp -- Axios / Fetch --> API_Gw[API Gateway / Router];
  API_Gw -- Routes to --> Controller[Backend Controller];
  Controller --> Service[Backend Service Logic];
  Service --> DB[(Database ORM)];
  DB -- Data Array / Obj --> Service;
  Service -- JSON --> FE_Comp;
  FE_Comp -- Re-Renders --> User;
  FE_AuthProvider["AuthProvider"] -- HTTP POST --> BE__________["() => { }"];
  FE_AuthProvider["AuthProvider"] -- HTTP POST --> BE__api_v1_auth_logout["/api/v1/auth/logout"];
  FE_NotificationDropdown["NotificationDropdown"] -- HTTP GET --> BE__api_v1_notifications["/api/v1/notifications"];
  FE_NotificationDropdown["NotificationDropdown"] -- HTTP PUT --> BE__api_v1_notifications_read_all["/api/v1/notifications/read-all"];
  FE_NotificationDropdown["NotificationDropdown"] -- HTTP PUT --> BE__api_v1_notifications__id_read["/api/v1/notifications/:id/read"];
  FE_GlobalSearch["GlobalSearch"] -- HTTP GET --> BE__api_v1_search_q__id["/api/v1/search?q=:id"];
  FE_AIAssistantPage["AIAssistantPage"] -- HTTP POST --> BE__api_v1_ai_chat["/api/v1/ai/chat"];
  FE_ForgotPasswordPage["ForgotPasswordPage"] -- HTTP POST --> BE__api_v1_auth_forgot_password["/api/v1/auth/forgot-password"];
  FE_ForgotPasswordPage["ForgotPasswordPage"] -- HTTP POST --> BE__api_v1_auth_verify_otp["/api/v1/auth/verify-otp"];
  FE_ForgotPasswordPage["ForgotPasswordPage"] -- HTTP POST --> BE__api_v1_auth_reset_password["/api/v1/auth/reset-password"];
  FE_LoginPage["LoginPage"] -- HTTP POST --> BE__api_v1_auth_login["/api/v1/auth/login"];
  FE_RegistrationPage["RegistrationPage"] -- HTTP POST --> BE__api_v1_auth_register["/api/v1/auth/register"];
  FE_ChallengeHubPage["ChallengeHubPage"] -- HTTP GET --> BE__api_v1_challenges["/api/v1/challenges"];
  FE_CodeEditorPage["CodeEditorPage"] -- HTTP GET --> BE__api_v1_challenges__id["/api/v1/challenges/:id"];
  FE_CodeEditorPage["CodeEditorPage"] -- HTTP POST --> BE__api_v1_challenges_execute["/api/v1/challenges/execute"];
  FE_CodeEditorPage["CodeEditorPage"] -- HTTP POST --> BE__api_v1_challenges__id_submit["/api/v1/challenges/:id/submit"];
  FE_CompanyProfilePage["CompanyProfilePage"] -- HTTP GET --> BE__api_v1_companies__id["/api/v1/companies/:id"];
  FE_CompanyProfilePage["CompanyProfilePage"] -- HTTP GET --> BE__api_v1_jobs["/api/v1/jobs"];
  FE_DeveloperDashboard["DeveloperDashboard"] -- HTTP GET --> BE__api_v1_jobs_active_limit_3["/api/v1/jobs/active?limit=3"];
  FE_DeveloperDashboard["DeveloperDashboard"] -- HTTP GET --> BE__api_v1_achievements["/api/v1/achievements"];
  FE_RecruiterDashboard["RecruiterDashboard"] -- HTTP GET --> BE__api_v1_jobs_active_limit_100["/api/v1/jobs/active?limit=100"];
  FE_ApplicationsPage["ApplicationsPage"] -- HTTP GET --> BE__api_v1_applications["/api/v1/applications"];
  FE_JobDetailsPage["JobDetailsPage"] -- HTTP GET --> BE__api_v1_jobs__id["/api/v1/jobs/:id"];
  FE_JobDetailsPage["JobDetailsPage"] -- HTTP POST --> BE__api_v1_jobs__id_apply["/api/v1/jobs/:id/apply"];
  FE_JobPostingFlowPage["JobPostingFlowPage"] -- HTTP POST --> BE__api_v1_jobs["/api/v1/jobs"];
  FE_JobsPage["JobsPage"] -- HTTP GET --> BE__api_v1_jobs__id["/api/v1/jobs?:id"];
  FE_CourseCatalogPage["CourseCatalogPage"] -- HTTP GET --> BE__api_v1_courses["/api/v1/courses"];
  FE_CourseDetailPage["CourseDetailPage"] -- HTTP GET --> BE__api_v1_courses__id["/api/v1/courses/:id"];
  FE_CourseDetailPage["CourseDetailPage"] -- HTTP POST --> BE__api_v1_courses__id_enroll["/api/v1/courses/:id/enroll"];
  FE_VideoPlayerPage["VideoPlayerPage"] -- HTTP GET --> BE__api_v1_courses__id["/api/v1/courses/:id"];
  FE_VideoPlayerPage["VideoPlayerPage"] -- HTTP PUT --> BE__api_v1_lms_progress["/api/v1/lms/progress"];
  FE_NetworkingPage["NetworkingPage"] -- HTTP GET --> BE__api_v1_users_profiles_discover["/api/v1/users/profiles/discover"];
  FE_NetworkingPage["NetworkingPage"] -- HTTP POST --> BE__api_v1_users_profiles__id_connect["/api/v1/users/profiles/:id/connect"];
  FE_ProfilePage["ProfilePage"] -- HTTP GET --> BE__api_v1_users_profile["/api/v1/users/profile"];
  FE_ProfilePage["ProfilePage"] -- HTTP PUT --> BE__api_v1_users_profile["/api/v1/users/profile"];
  FE_SettingsPage["SettingsPage"] -- HTTP PUT --> BE__api_v1_settings_preferences["/api/v1/settings/preferences"];
  BE__api_["/api/"] --> CTRL_index["index"];
  BE__health["/health"] --> CTRL_index["index"];
  BE__collaboration["/collaboration"] --> CTRL_index["index"];
  BE__uploads["/uploads"] --> CTRL_index["index"];
  BE__api_docs["/api/docs"] --> CTRL_index["index"];
  BE__["*"] --> CTRL_index["index"];
  BE__dashboard["/dashboard"] --> CTRL_api["api"];
  BE__metrics["/metrics"] --> CTRL_api["api"];
  BE__alerts["/alerts"] --> CTRL_api["api"];
  BE__services["/services"] --> CTRL_api["api"];
  BE__system["/system"] --> CTRL_api["api"];
  BE__api_v1_auth["/api/v1/auth"] --> CTRL_index["index"];
  BE__api_v1_upload["/api/v1/upload"] --> CTRL_index["index"];
  BE__api["/api"] --> CTRL_index["index"];
  BE__health["/health"] --> CTRL_index["index"];
  BE__admin_services["/admin/services"] --> CTRL_index["index"];
  BE__admin_metrics["/admin/metrics"] --> CTRL_index["index"];
  BE__admin_refresh_cache["/admin/refresh-cache"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__["/"] --> CTRL_index["index"];
  BE__["*"] --> CTRL_index["index"];
  BE__api_v1_challenges["/api/v1/challenges"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__api_v1_challenges__slug["/api/v1/challenges/:slug"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__api_v1_challenges__id_test_run["/api/v1/challenges/:id/test-run"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__api_v1_challenges__id_submit["/api/v1/challenges/:id/submit"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__health["/health"] --> CTRL_index["index"];
  BE__upload_profile_picture["/upload/profile-picture"] --> CTRL_index["index"];
  BE__upload_resume["/upload/resume"] --> CTRL_index["index"];
  BE__uploads["/uploads"] --> CTRL_index["index"];
  BE__health["/health"] --> CTRL_index["index"];
  BE__metrics["/metrics"] --> CTRL_index["index"];
  BE__users__id_points["/users/:id/points"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__users__id_points["/users/:id/points"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__users__id_points_history["/users/:id/points/history"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__users__id_badges["/users/:id/badges"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__users__id_badges["/users/:id/badges"] --> CTRL_index["index"];
  BE__badges["/badges"] --> CTRL_index["index"];
  BE__users__id_streaks["/users/:id/streaks"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__users__id_streaks_checkin["/users/:id/streaks/checkin"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__leaderboard["/leaderboard"] --> CTRL_index["index"];
  CTRL_index["index"] --> DB_index[(Database)];
  BE__actions["/actions"] --> CTRL_index["index"];
  BE__jobs["/jobs"] --> CTRL_index["index"];
  BE__jobs["/jobs"] --> CTRL_index["index"];
  BE__jobs__id["/jobs/:id"] --> CTRL_index["index"];
  BE__jobs__id["/jobs/:id"] --> CTRL_index["index"];
  BE__jobs__id["/jobs/:id"] --> CTRL_index["index"];
  BE__jobs__id_apply["/jobs/:id/apply"] --> CTRL_index["index"];
  BE__jobs__id_applications["/jobs/:id/applications"] --> CTRL_index["index"];
  BE__api_v1_courses["/api/v1/courses"] --> CTRL_index["index"];
  BE__api_v1_courses["/api/v1/courses"] --> CTRL_index["index"];
  BE__api_v1_courses__id["/api/v1/courses/:id"] --> CTRL_index["index"];
  BE__api_v1_courses__id_enroll["/api/v1/courses/:id/enroll"] --> CTRL_index["index"];
  BE__health["/health"] --> CTRL_index["index"];
  BE__api_v1_payments_webhook["/api/v1/payments/webhook"] --> CTRL_index["index"];
  BE__api_v1_payments_checkout["/api/v1/payments/checkout"] --> CTRL_index["index"];
  BE__health["/health"] --> CTRL_index["index"];
  BE__api["/api"] --> CTRL_comprehensive-security-middleware["comprehensive-security-middleware"];
  BE__api["/api"] --> CTRL_comprehensive-security-middleware["comprehensive-security-middleware"];
  BE__api["/api"] --> CTRL_comprehensive-security-middleware["comprehensive-security-middleware"];
  BE__profiles["/profiles"] --> CTRL_index["index"];
  BE__profiles__id["/profiles/:id"] --> CTRL_index["index"];
  BE__profiles__id["/profiles/:id"] --> CTRL_index["index"];
  BE__profiles__id["/profiles/:id"] --> CTRL_index["index"];
  BE__profiles_user__userId["/profiles/user/:userId"] --> CTRL_index["index"];
  BE__profiles__id_skills["/profiles/:id/skills"] --> CTRL_index["index"];
  BE__profiles__id_skills["/profiles/:id/skills"] --> CTRL_index["index"];
  BE__skills__skillId["/skills/:skillId"] --> CTRL_index["index"];
  BE__skills__skillId["/skills/:skillId"] --> CTRL_index["index"];
  BE__profiles__id_experiences["/profiles/:id/experiences"] --> CTRL_index["index"];
  BE__profiles__id_experiences["/profiles/:id/experiences"] --> CTRL_index["index"];
  BE__experiences__experienceId["/experiences/:experienceId"] --> CTRL_index["index"];
  BE__experiences__experienceId["/experiences/:experienceId"] --> CTRL_index["index"];
  BE__profiles__id_educations["/profiles/:id/educations"] --> CTRL_index["index"];
  BE__profiles__id_educations["/profiles/:id/educations"] --> CTRL_index["index"];
  BE__educations__educationId["/educations/:educationId"] --> CTRL_index["index"];
  BE__educations__educationId["/educations/:educationId"] --> CTRL_index["index"];
  BE__stream["/stream"] --> CTRL_index["index"];
  BE__health["/health"] --> CTRL_index["index"];
  BE__vod["/vod"] --> CTRL_index["index"];
  BE__interview["/interview"] --> CTRL_index["index"];
  BE__api["/api"] --> CTRL_service-template["service-template"];
  BE__health["/health"] --> CTRL_service-template["service-template"];
  BE__api_info["/api/info"] --> CTRL_service-template["service-template"];
  BE__api_v1["/api/v1"] --> CTRL_service-template["service-template"];
  BE__["*"] --> CTRL_service-template["service-template"];
  BE__rooms["/rooms"] --> CTRL_interview["interview"];
  BE__rooms__roomId["/rooms/:roomId"] --> CTRL_interview["interview"];
  BE__rooms__roomId_end["/rooms/:roomId/end"] --> CTRL_interview["interview"];
  BE__upload["/upload"] --> CTRL_vod["vod"];
  BE__api_v1_analytics_events["/api/v1/analytics/events"] --> CTRL_AnalyticsController["AnalyticsController"];
  BE__api_v1_analytics_user__id["/api/v1/analytics/user/:id"] --> CTRL_AnalyticsController["AnalyticsController"];
  BE__api_v1_analytics_daily["/api/v1/analytics/daily"] --> CTRL_AnalyticsController["AnalyticsController"];
  BE__api_v1_applications__id["/api/v1/applications/:id"] --> CTRL_ApplicationController["ApplicationController"];
  BE__api_v1_applications_candidate__id["/api/v1/applications/candidate/:id"] --> CTRL_ApplicationController["ApplicationController"];
  BE__api_v1_applications_job__id["/api/v1/applications/job/:id"] --> CTRL_ApplicationController["ApplicationController"];
  BE__api_v1_applications__id_status["/api/v1/applications/:id/status"] --> CTRL_ApplicationController["ApplicationController"];
  BE__api_v1_applications__id_timeline["/api/v1/applications/:id/timeline"] --> CTRL_ApplicationController["ApplicationController"];
  BE__api_v1_applications__id["/api/v1/applications/:id"] --> CTRL_ApplicationController["ApplicationController"];
  BE__api_v1_applications__id_withdraw["/api/v1/applications/:id/withdraw"] --> CTRL_ApplicationController["ApplicationController"];
  BE__api_v1_auth_register["/api/v1/auth/register"] --> CTRL_AuthController["AuthController"];
  BE__api_v1_auth_login["/api/v1/auth/login"] --> CTRL_AuthController["AuthController"];
  BE__api_v1_auth_refresh["/api/v1/auth/refresh"] --> CTRL_AuthController["AuthController"];
  BE__api_v1_auth_logout["/api/v1/auth/logout"] --> CTRL_AuthController["AuthController"];
  BE__api_v1_challenges__id["/api/v1/challenges/:id"] --> CTRL_ChallengeController["ChallengeController"];
  BE__api_v1_challenges_active["/api/v1/challenges/active"] --> CTRL_ChallengeController["ChallengeController"];
  BE__api_v1_challenges__id_submit["/api/v1/challenges/:id/submit"] --> CTRL_ChallengeController["ChallengeController"];
  BE__api_v1_challenges_user__id_submissions["/api/v1/challenges/user/:id/submissions"] --> CTRL_ChallengeController["ChallengeController"];
  BE__api_v1_challenges__id_submissions__id_score["/api/v1/challenges/:id/submissions/:id/score"] --> CTRL_ChallengeController["ChallengeController"];
  BE__api_v1_challenges_health["/api/v1/challenges/health"] --> CTRL_ChallengeController["ChallengeController"];
  BE__api_v1_companies__id["/api/v1/companies/:id"] --> CTRL_CompanyController["CompanyController"];
  BE__api_v1_companies__id["/api/v1/companies/:id"] --> CTRL_CompanyController["CompanyController"];
  BE__api_v1_companies_verified["/api/v1/companies/verified"] --> CTRL_CompanyController["CompanyController"];
  BE__api_v1_companies_search["/api/v1/companies/search"] --> CTRL_CompanyController["CompanyController"];
  BE__api_v1_companies__id_verify["/api/v1/companies/:id/verify"] --> CTRL_CompanyController["CompanyController"];
  BE__api_v1_companies_health["/api/v1/companies/health"] --> CTRL_CompanyController["CompanyController"];
  BE__api_v1_email_send["/api/v1/email/send"] --> CTRL_EmailController["EmailController"];
  BE__api_v1_email_send_templated["/api/v1/email/send/templated"] --> CTRL_EmailController["EmailController"];
  BE__api_v1_email_templates__id["/api/v1/email/templates/:id"] --> CTRL_EmailController["EmailController"];
  BE__api_v1_email_templates["/api/v1/email/templates"] --> CTRL_EmailController["EmailController"];
  BE__api_v1_email_logs["/api/v1/email/logs"] --> CTRL_EmailController["EmailController"];
  BE__api_v1_email_logs__id_retry["/api/v1/email/logs/:id/retry"] --> CTRL_EmailController["EmailController"];
  BE__api_v1_files_upload["/api/v1/files/upload"] --> CTRL_FileController["FileController"];
  BE__api_v1_files__id["/api/v1/files/:id"] --> CTRL_FileController["FileController"];
  BE__api_v1_files_user__id["/api/v1/files/user/:id"] --> CTRL_FileController["FileController"];
  BE__api_v1_files__id["/api/v1/files/:id"] --> CTRL_FileController["FileController"];
  BE__api_v1_files__id_download["/api/v1/files/:id/download"] --> CTRL_FileController["FileController"];
  BE__api_v1_files__id_presigned["/api/v1/files/:id/presigned"] --> CTRL_FileController["FileController"];
  BE__api_v1_gamification_badge_award["/api/v1/gamification/badge/award"] --> CTRL_GamificationController["GamificationController"];
  BE__api_v1_gamification_user__id_badges["/api/v1/gamification/user/:id/badges"] --> CTRL_GamificationController["GamificationController"];
  BE__api_v1_gamification_user__id_points["/api/v1/gamification/user/:id/points"] --> CTRL_GamificationController["GamificationController"];
  BE__api_v1_gamification_user__id_points["/api/v1/gamification/user/:id/points"] --> CTRL_GamificationController["GamificationController"];
  BE__api_v1_gamification_leaderboard["/api/v1/gamification/leaderboard"] --> CTRL_GamificationController["GamificationController"];
  BE__api_v1_gamification_badges["/api/v1/gamification/badges"] --> CTRL_GamificationController["GamificationController"];
  BE__api_v1_jobs__id["/api/v1/jobs/:id"] --> CTRL_JobController["JobController"];
  BE__api_v1_jobs__id["/api/v1/jobs/:id"] --> CTRL_JobController["JobController"];
  BE__api_v1_jobs_featured["/api/v1/jobs/featured"] --> CTRL_JobController["JobController"];
  BE__api_v1_jobs__id_apply["/api/v1/jobs/:id/apply"] --> CTRL_JobController["JobController"];
  BE__api_v1_jobs__id_applications["/api/v1/jobs/:id/applications"] --> CTRL_JobController["JobController"];
  BE__api_v1_jobs_health["/api/v1/jobs/health"] --> CTRL_JobController["JobController"];
  BE__api_v1_notifications_unread["/api/v1/notifications/unread"] --> CTRL_NotificationController["NotificationController"];
  BE__api_v1_notifications__id_read["/api/v1/notifications/:id/read"] --> CTRL_NotificationController["NotificationController"];
  BE__api_v1_notifications_read_all["/api/v1/notifications/read-all"] --> CTRL_NotificationController["NotificationController"];
  BE__api_v1_notifications_health["/api/v1/notifications/health"] --> CTRL_NotificationController["NotificationController"];
  BE__api_v1_search_health["/api/v1/search/health"] --> CTRL_SearchController["SearchController"];
  BE__api_v1_profiles__id["/api/v1/profiles/:id"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles__id["/api/v1/profiles/:id"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles__id_experience["/api/v1/profiles/:id/experience"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles__id_experience__id["/api/v1/profiles/:id/experience/:id"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles__id_education["/api/v1/profiles/:id/education"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles__id_education__id["/api/v1/profiles/:id/education/:id"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles_search["/api/v1/profiles/search"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles__id["/api/v1/profiles/:id"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles__id["/api/v1/profiles/:id"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles__id["/api/v1/profiles/:id"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_profiles_health["/api/v1/profiles/health"] --> CTRL_UserProfileController["UserProfileController"];
  BE__api_v1_videos__id["/api/v1/videos/:id"] --> CTRL_VideoController["VideoController"];
  BE__api_v1_videos_user__id["/api/v1/videos/user/:id"] --> CTRL_VideoController["VideoController"];
  BE__api_v1_videos_category__id["/api/v1/videos/category/:id"] --> CTRL_VideoController["VideoController"];
  BE__api_v1_videos__id["/api/v1/videos/:id"] --> CTRL_VideoController["VideoController"];
  BE__api_v1_videos__id_view["/api/v1/videos/:id/view"] --> CTRL_VideoController["VideoController"];
  BE__api_v1_videos_trending["/api/v1/videos/trending"] --> CTRL_VideoController["VideoController"];
  BE__api_v1_videos_health["/api/v1/videos/health"] --> CTRL_VideoController["VideoController"];
```

