#!/bin/bash
set -e

# Configuration
CLUSTER_NAME="jledger-cluster"
OVERLAY=".k8s/overlays/dev"

echo "🚀 Starting J-Ledger Local Deployment on Kind..."

# 1. Create Cluster
if kind get clusters | grep -q "^$CLUSTER_NAME$"; then
    echo "⚠️ Cluster '$CLUSTER_NAME' already exists. Skipping creation."
else
    echo "🏗️ Creating Kind cluster: $CLUSTER_NAME..."
    kind create cluster --name $CLUSTER_NAME --config kind-config.yaml
fi

# 2. Load Local Images
echo "📦 Loading custom images into Kind nodes..."
kind load docker-image \
    j-ledger/eureka-server:latest \
    j-ledger/api-gateway:latest \
    j-ledger/core-service:latest \
    j-ledger/notification-service:latest \
    j-ledger/admin-web:latest \
    --name $CLUSTER_NAME

# 3. Install Ingress Controller
echo "📥 Installing Nginx Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# 4. Wait for Ingress
echo "⏳ Waiting for Ingress Controller to be ready (this may take a minute)..."
kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=120s

# 5. Apply Kustomize
echo "🛠️ Applying Kustomize configuration from $OVERLAY..."
kubectl apply -k $OVERLAY

echo "---"
echo "✅ J-Ledger Deployment Successful!"
echo "🌐 Dashboard ready at: http://localhost"
echo "🔗 API Gateway ready at: http://localhost/api/v1/..."
echo "---"
echo "Note: If using 'admin.jledger.local', ensure your /etc/hosts is updated."
