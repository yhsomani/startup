FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY common common
COPY auth-service auth-service
COPY user-service user-service
COPY job-service job-service
COPY notification-service notification-service
COPY search-service search-service
COPY analytics-service analytics-service
COPY application-service application-service
COPY user-profile-service user-profile-service
COPY file-service file-service
COPY video-service video-service
COPY company-service company-service
COPY email-service email-service
COPY challenge-service challenge-service
COPY gamification-service gamification-service
COPY api-gateway api-gateway

RUN apk add --no-cache maven && \
    mvn clean package -DskipTests -pl common,api-gateway -am

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY --from=build /app/api-gateway/target/*.jar app.jar

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8000/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
