# E-Commerce Production Deployment Toolkit

Organized deployment automation separated by architectural tiers for easy management, independent scaling, and zero-downtime rolling updates.

---

## 🗂️ Deployment Directory Structure

```
deploy/
├── backend/
│   ├── docker-compose.backend.yml   # 16 Microservices + PostgreSQL, Redis, Kafka, OpenSearch
│   ├── deploy.sh                    # Deploy all or single backend service (e.g. ./deploy.sh order-service)
│   ├── rollback.sh                  # Instant rollback to prior backend release manifest
│   ├── health-check.sh              # Probes all 16 microservice HTTP endpoints
│   ├── backup.sh                    # PostgreSQL database snapshot
│   ├── restart-service.sh           # Gracefully bounce a single service
│   ├── status.sh                    # Container & resource telemetry
│   ├── logs.sh                      # Follow logs for specific backend services
│   └── .env.production.example      # Backend secrets template
│
├── frontend/
│   ├── docker-compose.frontend.yml  # Standalone Next.js container (Port 3000, 1.5 CPUs, 2GB RAM)
│   ├── deploy.sh                    # Rolling deployment of Next.js frontend
│   ├── rollback.sh                  # Instant frontend rollback to prior release manifest
│   ├── health-check.sh              # Probes frontend HTTP 200 on port 3000
│   ├── logs.sh                      # Follow streaming frontend logs
│   └── .env.production.example      # Frontend public URLs template
│
├── deploy-all.sh                    # Unified deployment orchestrator
├── status.sh                        # Full fleet status (Frontend + Backend + Infra)
└── docker-compose.prod.yml          # Unified full-stack compose definition
```

---

## 🚀 Quick Usage Reference

### 1. Deploy Frontend Only (Zero Backend Interruption)
```bash
cd deploy/frontend
./deploy.sh
```
*Rollback if needed:*
```bash
./rollback.sh
```

---

### 2. Deploy Backend Only
```bash
cd deploy/backend
# Deploy all backend services
./deploy.sh

# Or deploy only one service (e.g. Order Service) without restarting databases or Kafka
./deploy.sh order-service
```
*Rollback if needed:*
```bash
./rollback.sh order-service
```

---

### 3. Deploy Complete Platform (Both Frontend and Backend)
```bash
cd deploy
./deploy-all.sh
```

---

### 4. Inspect Live Fleet Status
```bash
cd deploy
./status.sh
```
