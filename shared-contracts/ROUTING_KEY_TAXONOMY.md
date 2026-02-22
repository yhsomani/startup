# TalentSphere Event Routing Key Taxonomy

## Format

All routing keys follow the pattern: `<domain>.<entity>.<action>`

## Domain: Auth (`auth`)

| Routing Key                  | Publisher            | Subscribers                           | Description           |
| ---------------------------- | -------------------- | ------------------------------------- | --------------------- |
| `auth.user.registered`       | Node.js Auth Service | Gamification, Notification, Analytics | New user registration |
| `auth.user.login`            | Node.js Auth Service | Analytics, Security                   | User login event      |
| `auth.user.logout`           | Node.js Auth Service | Analytics                             | User logout event     |
| `auth.user.password.changed` | Node.js Auth Service | Notification                          | Password updated      |
| `auth.user.deleted`          | Node.js Auth Service | All services                          | Account deletion      |

## Domain: LMS (`lms`)

| Routing Key                | Publisher   | Subscribers                           | Description              |
| -------------------------- | ----------- | ------------------------------------- | ------------------------ |
| `lms.course.completed`     | Spring Boot | Gamification, Notification, Analytics | Course completion        |
| `lms.lesson.completed`     | Spring Boot | Gamification, Analytics               | Lesson completion        |
| `lms.enrollment.created`   | Spring Boot | Notification, Analytics               | New enrollment           |
| `lms.enrollment.cancelled` | Spring Boot | Notification, Analytics               | Enrollment cancellation  |
| `lms.certificate.issued`   | Spring Boot | Notification                          | Certificate earned       |
| `lms.progress.updated`     | Spring Boot | Analytics                             | Learning progress update |

## Domain: Challenges (`challenges`)

| Routing Key                  | Publisher | Subscribers             | Description          |
| ---------------------------- | --------- | ----------------------- | -------------------- |
| `challenges.submitted`       | .NET      | Gamification, Analytics | Challenge submission |
| `challenges.approved`        | .NET      | Notification, Analytics | Challenge approved   |
| `challenges.rejected`        | .NET      | Notification            | Challenge rejected   |
| `challenges.testcase.passed` | .NET      | Analytics               | Test case passed     |
| `challenges.testcase.failed` | .NET      | Analytics               | Test case failed     |

## Domain: Jobs (`jobs`)

| Routing Key                  | Publisher                   | Subscribers             | Description        |
| ---------------------------- | --------------------------- | ----------------------- | ------------------ |
| `jobs.post.created`          | Node.js Job Service         | Analytics, Notification | New job posted     |
| `jobs.post.updated`          | Node.js Job Service         | Analytics               | Job updated        |
| `jobs.post.closed`           | Node.js Job Service         | Analytics               | Job closed         |
| `jobs.application.submitted` | Node.js Application Service | Notification, Analytics | Job application    |
| `jobs.application.viewed`    | Node.js Application Service | Analytics               | Application viewed |

## Domain: Network (`network`)

| Routing Key                    | Publisher               | Subscribers  | Description         |
| ------------------------------ | ----------------------- | ------------ | ------------------- |
| `network.connection.requested` | Node.js Network Service | Notification | Connection request  |
| `network.connection.accepted`  | Node.js Network Service | Analytics    | Connection accepted |
| `network.message.sent`         | Node.js Network Service | Notification | Direct message sent |

## Domain: Payments (`payments`)

| Routing Key                       | Publisher | Subscribers             | Description            |
| --------------------------------- | --------- | ----------------------- | ---------------------- |
| `payments.subscription.created`   | .NET      | Notification, Analytics | New subscription       |
| `payments.subscription.cancelled` | .NET      | Notification, Analytics | Subscription cancelled |
| `payments.invoice.paid`           | .NET      | Notification, Analytics | Invoice paid           |
| `payments.payment.failed`         | .NET      | Notification            | Payment failed         |

## Domain: Gamification (`gamification`)

| Routing Key                   | Publisher | Subscribers             | Description     |
| ----------------------------- | --------- | ----------------------- | --------------- |
| `gamification.points.awarded` | Python    | Analytics, Notification | Points awarded  |
| `gamification.badge.earned`   | Python    | Notification, Analytics | Badge earned    |
| `gamification.level.up`       | Python    | Notification            | User leveled up |

## Domain: Notification (`notification`)

| Routing Key         | Publisher         | Subscribers | Description       |
| ------------------- | ----------------- | ----------- | ----------------- |
| `notification.sent` | Node.js           | Analytics   | Notification sent |
| `notification.read` | Node.js Analytics | Analytics   | Notification read |

---

## Wildcard Bindings

Services can use wildcards to listen to multiple events:

| Binding Key    | Matches                |
| -------------- | ---------------------- |
| `auth.*`       | All auth events        |
| `lms.*`        | All LMS events         |
| `lms.course.*` | All course events      |
| `#`            | All events (catch-all) |

---

## Event Contract Schemas

See `shared-contracts/events/` for JSON Schema definitions.

## Implementation Status

| Domain       | Events Defined | Publisher Implemented |
| ------------ | -------------- | --------------------- |
| Auth         | 5              | ✅ Node.js            |
| LMS          | 6              | ✅ Spring Boot        |
| Challenges   | 5              | ✅ .NET               |
| Jobs         | 5              | ⏳ Pending            |
| Network      | 3              | ⏳ Pending            |
| Payments     | 4              | ✅ .NET               |
| Gamification | 3              | ✅ Python             |
