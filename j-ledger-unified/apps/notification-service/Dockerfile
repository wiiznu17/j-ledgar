FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY apps/notification-service/pom.xml .
RUN mvn dependency:go-offline -B
COPY apps/notification-service/src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
