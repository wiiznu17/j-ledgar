# J-Ledger Phase 6 - Ecosystem Deployment Guide

This guide outlines how to build and deploy the complete J-Ledger Cloud-Native ecosystem locally. You can either use **Docker Compose** for a quick local setup, or **Kubernetes** to mirror production.

## Prerequisites
- Docker
- (For Kubernetes only) Minikube or Docker Desktop (with Kubernetes enabled) & `kubectl`

---

## 🔥 Option A: Docker Compose (Quick Local Setup)

To spin up the entire ecosystem (Databases, Message Brokers, Backend Services, and Frontend Web) using the centralized `docker-compose.yml`, run the following command from the root workspace:

```bash
docker-compose up -d --build
```

### When to use `--build`?
- `docker-compose up -d`: Starts the containers using pre-existing images. Best used when you just want to turn on the system and haven't modified any source code.
- `docker-compose up -d --build`: Forces Docker to re-compile the source code and build fresh images before starting. **Always use this if you have edited any code** (e.g., changed an API endpoint, updated the Next.js UI) so your changes are reflected locally.

**Access Points:**
- **Admin Web Dashboard**: `http://localhost:3000`
- **API Gateway**: `http://localhost:8080`
- **Eureka Dashboard**: `http://localhost:8761`

To tear down the environment:
```bash
docker-compose down
```

### 🗄️ Database Management & Persistence

The `core-service` manages the database schema automatically using **Flyway** migrations.

**Check Schema & Migration History:**
Run these commands to verify the state of your database inside the running container:
```bash
# View all tables
docker exec -it jledger-postgres psql -U ledger_admin -d jledger_db -c "\dt"

# View Flyway migration history
docker exec -it jledger-postgres psql -U ledger_admin -d jledger_db -c "SELECT version, description, installed_on, success FROM flyway_schema_history;"
```

**Data Persistence:**
- `docker-compose down`: Stops and removes containers, but **keeps your data** because `pgdata` and `redisdata` are stored in Docker volumes.
- `docker-compose down -v`: Stops containers and **deletes the volumes**. Use this if you want to completely wipe the database and start fresh with empty accounts.
- `docker volume ls | grep jledger`: Check existing data volumes.

---

## ☸️ Option B: Kubernetes Deployment

## 1. Setup Local Kubernetes Environment
Start your cluster if using minikube:
```bash
minikube start --memory=8192 --cpus=4
```
Ensure your terminal is pointing to minikube's Docker daemon so it can use the locally built images:
```bash
eval $(minikube docker-env)
```

## 2. Build Docker Images
Run the following build commands from the root workspace directory to build the multi-stage Docker images. Wait for each to finish.
*(Ensure `mvn` and `npm` commands are run inside the Docker multistage environments, so no local setup is needed besides Docker!)*

```bash
docker build -t j-ledger/eureka-server:latest ./eureka-server
docker build -t j-ledger/api-gateway:latest ./api-gateway
docker build -t j-ledger/core-service:latest ./core-service
docker build -t j-ledger/notification-service:latest ./notification-service
docker build -t j-ledger/admin-web:latest ./admin-web
```

## 3. Apply Kubernetes Manifests
Navigate to the `k8s` directory and apply all configurations at once:

```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## 4. Verify Deployments
Check the status of your pods and wait until they reach the `Running` state:
```bash
kubectl get pods --watch
```

Check the logs for a specific service if something seems wrong:
```bash
kubectl logs -l app=core-service -f
```

## 5. Access the Applications Locally
Since we are using NodePorts, you can extract the direct URL by running Minikube service commands or accessing localhost directly if on Docker Desktop.

- **Admin Web Dashboard**: `minikube service admin-web` (or `http://localhost:30000`)
- **API Gateway**: `minikube service api-gateway` (or `http://localhost:30080`)
- **Eureka Dashboard**: `minikube service eureka-server` (or `http://localhost:30761`)

To cleanly shut down the environment:
```bash
kubectl delete -f k8s/
minikube stop
```
