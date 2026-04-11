# J-Ledger Phase 6 - Kubernetes Deployment

This guide outlines how to build and deploy the complete J-Ledger Cloud-Native ecosystem locally using `minikube` or `kind`.

## Prerequisites
- Docker
- Minikube or Docker Desktop (with Kubernetes enabled)
- `kubectl`

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
