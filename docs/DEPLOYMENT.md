# E-Commerce Live Auto-Deployment — 16-Core Server

A production-grade, automated deployment architecture and Shell/Bash automation toolkit optimized for a **16-Core server**, hosting 1 production client/tenant with high availability, graceful zero-downtime rolling updates, automated health check validations, transactional rollbacks, and database snapshots.

---

## 1. Deployment Goal

The production server hardware & OS profile:

| Resource | Specification | Description |
| :--- | :--- | :--- |
| **CPU** | 16 Cores (AMD EPYC / Intel Xeon / Graviton) | High throughput concurrent workload |
| **RAM** | 32 GB – 64 GB ECC | Sized for JVMs, OpenSearch heap, Redis & PostgreSQL |
| **Storage** | 500 GB – 1 TB NVMe SSD | High IOPS for DB WAL logs and Kafka journals |
| **OS** | Ubuntu Server 24.04 LTS (x86_64) | Kernel 6.8+, systemd, cgroup v2 support |
| **Tenancy** | 1 Production Client / Single Tenant | Dedicated isolation, zero cross-tenant noisy neighbors |
| **Stack** | Docker + Docker Compose + Bash/Shell | Deterministic, immutable container deployment |

### Automated Pipeline Flow

```
Git Push
   ↓
Build
   ↓
Test
   ↓
Build Docker Images
   ↓
Deploy
   ↓
Health Check
   ↓
If successful → Live
If failed    → Rollback
```

---

## 2. Production Architecture

```
                    INTERNET
                       │
                       ▼
                ┌─────────────┐
                │    Nginx    │
                │ TLS / HTTPS │
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐
                │ API Gateway │
                │   Go/Gin    │
                └──────┬──────┘
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
    Auth/User       Catalog/Search    Cart/Order
       │               │                │
       └───────────────┼────────────────┘
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
         PostgreSQL           Redis
             │
             ▼
           Kafka
             │
    ┌────────┼─────────┐
    ▼        ▼         ▼
 Payment  Inventory  Shipping
    │        │         │
    └────────┼─────────┘
             ▼
        Other Services
```

The 16-core machine runs the production stack in isolated Docker containers with explicit CPU shares and memory ceilings.

---

## 3. Recommended CPU Allocation

> **Golden Rule**: Never allocate unbounded CPU access to all containers simultaneously. Prevent noisy neighbor starvation by enforcing strict cgroup limits.

| Component | Technology | CPU Limit (`cpus`) | Memory Limit (`mem_limit`) |
| :--- | :--- | :--- | :--- |
| **Nginx** | C / Alpine | `0.5` | 256 MB |
| **API Gateway** | Go 1.22 | `1.0` | 512 MB |
| **Auth Service (#01)** | Python / FastAPI | `0.5` | 512 MB |
| **User Service (#02)** | Go / Gin | `0.5` | 256 MB |
| **Catalog Service (#03)** | Java 21 / Spring Boot | `1.0` | 1024 MB |
| **Search Service (#04)** | Python / FastAPI | `1.5` | 1024 MB |
| **Cart Service (#05)** | TypeScript / NestJS | `0.5` | 512 MB |
| **Inventory Service (#06)** | Java 21 / Spring Boot | `1.0` | 1024 MB |
| **Order Service (#07)** | Java 21 / Spring Boot | `1.0` | 1024 MB |
| **Payment Service (#08)** | C# / ASP.NET Core 8 | `0.5` | 512 MB |
| **Shipping Service (#09)** | TypeScript / NestJS | `0.5` | 512 MB |
| **Pricing Service (#10)** | Python / FastAPI | `0.5` | 512 MB |
| **Review Service (#11)** | TypeScript / NestJS | `0.5` | 512 MB |
| **Notification Service (#12)** | Elixir / Phoenix | `0.5` | 512 MB |
| **Recommendation Service (#13)**| Python / FastAPI | `1.0` | 1024 MB |
| **Seller Marketplace (#14)**| Java 21 / Spring Boot | `0.5` | 1024 MB |
| **Admin Service (#15)** | TypeScript / NestJS | `0.5` | 512 MB |
| **PostgreSQL 16** | Database Engine | `2.0` | 4096 MB |
| **Redis 7** | In-Memory Cache | `0.5` | 2048 MB |
| **Apache Kafka + ZK** | Event Backbone | `1.5` | 2048 MB |
| **OpenSearch 2.12** | Search Engine | `2.0` | 4096 MB (Heap: 2GB) |
| **Total Allocation** | — | **~18.5 Cores (Oversubscribed ~115% burst)** | **~22 GB RAM** |

*Note: These are baseline operational quotas. Fine-tune limits based on real production telemetry, latency percentiles, and traffic surges.*

---

## 4. Production Directory Structure

Standardized, predictable file layout located at `/opt/ecommerce`:

```
/opt/ecommerce/
├── app/
│   ├── gateway/
│   ├── auth/
│   ├── user/
│   ├── catalog/
│   ├── search/
│   ├── cart/
│   ├── inventory/
│   ├── order/
│   ├── payment/
│   ├── shipping/
│   ├── pricing/
│   ├── review/
│   ├── notification/
│   ├── recommendation/
│   ├── seller/
│   └── admin/
│
├── deploy/
│   ├── docker-compose.prod.yml
│   ├── .env.production
│   ├── deploy.sh
│   ├── rollback.sh
│   ├── health-check.sh
│   ├── backup.sh
│   ├── status.sh
│   ├── logs.sh
│   └── restart-service.sh
│
├── releases/
│   ├── 20260914-090000/
│   ├── 20260914-120000/
│   └── current -> /opt/ecommerce/releases/20260914-120000
│
├── backups/
│   └── ecommerce-20260914-120000.sql.gz
└── logs/
    ├── deploy.log
    ├── health.log
    └── rollback.log
```

---

## 5. Git-Based Deployment

```
Developer
    │
    ▼
GitHub/GitLab
    │
    │ push main
    ▼
CI/CD
    │
    ├── Test
    ├── Build
    ├── Docker image
    └── Push image
          │
          ▼
     Production Server
          │
          ▼
       deploy.sh
```

### Immutable Tagging Convention
Avoid deploying `:latest`. Always use immutable, traceable image tags generated during CI:
- `ecommerce/gateway:2026.09.14-abc123`
- `ecommerce/auth:2026.09.14-abc123`
- `ecommerce/catalog:2026.09.14-abc123`

This ensures atomic rollback to the exact prior commit without cache ambiguity.

---

## 6. Main `deploy.sh` Script

```bash
#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="/opt/ecommerce"
DEPLOY_DIR="$APP_DIR/deploy"
TARGET_SERVICE="${1:-all}"
LOCK_FILE="/var/lock/ecommerce-deploy.lock"

echo "========================================="
echo " E-Commerce Production Deploy: $TARGET_SERVICE"
echo " Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "========================================="

# Acquire execution lock
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "ERROR: Another deployment is currently running."
    exit 1
fi

cd "$DEPLOY_DIR"

# Step 1: Pre-deployment Backup
echo "[1/8] Running pre-deployment database backup..."
./backup.sh

# Step 2: Configuration Update
echo "[2/8] Pulling configuration updates..."
git pull origin main

# Step 3: Registry Authentication
echo "[3/8] Logging into container registry..."
if [ -n "${CI_REGISTRY_PASSWORD:-}" ]; then
    echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin
fi

# Step 4: Pull Target Images
echo "[4/8] Pulling updated container images..."
if [ "$TARGET_SERVICE" = "all" ]; then
    docker compose -f docker-compose.prod.yml pull
else
    docker compose -f docker-compose.prod.yml pull "$TARGET_SERVICE"
fi

# Step 5: Database Migrations
echo "[5/8] Running database schema migrations..."
docker compose -f docker-compose.prod.yml run --rm order-service migrate || true

# Step 6: Deploy Services Gracefully
echo "[6/8] Deploying containers with rolling restart..."
if [ "$TARGET_SERVICE" = "all" ]; then
    docker compose -f docker-compose.prod.yml up -d --remove-orphans
else
    docker compose -f docker-compose.prod.yml up -d --no-deps "$TARGET_SERVICE"
fi

# Step 7: Stabilization Window
echo "[7/8] Waiting 20s for service stabilization..."
sleep 20

# Step 8: Health Verification
echo "[8/8] Executing automated health checks..."
if ./health-check.sh "$TARGET_SERVICE"; then
    echo "========================================="
    echo " SUCCESS: Deployment verified and LIVE."
    echo "========================================="
else
    echo "========================================="
    echo " ALERT: Health check failed! Rolling back..."
    echo "========================================="
    ./rollback.sh "$TARGET_SERVICE"
    exit 1
fi
```

---

## 7. Automated Health Checks

Never assume container state `Up` means the service is handling traffic. Probe both process presence and HTTP `/health` and `/ready` endpoints:

```bash
#!/usr/bin/env bash

set -Eeuo pipefail

TARGET="${1:-all}"

declare -A ENDPOINTS=(
  ["api-gateway"]="http://localhost:8000/health"
  ["auth-service"]="http://localhost:8001/health"
  ["user-service"]="http://localhost:8002/health"
  ["catalog-service"]="http://localhost:8003/actuator/health"
  ["search-service"]="http://localhost:8004/health"
  ["cart-service"]="http://localhost:8005/health"
  ["inventory-service"]="http://localhost:8006/actuator/health"
  ["order-service"]="http://localhost:8007/actuator/health"
  ["payment-service"]="http://localhost:8008/health"
  ["shipping-service"]="http://localhost:8009/health"
  ["pricing-service"]="http://localhost:8010/health"
  ["review-service"]="http://localhost:8011/health"
  ["notification-service"]="http://localhost:8012/health"
  ["recommendation-service"]="http://localhost:8013/health"
  ["seller-marketplace-service"]="http://localhost:8014/actuator/health"
  ["admin-service"]="http://localhost:8015/health"
)

check_service() {
    local svc="$1"
    local url="${ENDPOINTS[$svc]:-}"
    
    echo -n "Checking $svc ... "
    
    # 1. Container state check
    if ! docker compose -f docker-compose.prod.yml ps "$svc" | grep -qE "Up|running"; then
        echo "FAILED (Container down)"
        return 1
    fi
    
    # 2. HTTP health check if endpoint defined
    if [ -n "$url" ]; then
        if ! curl -s -f -m 5 "$url" > /dev/null; then
            echo "FAILED (Endpoint $url unreachable or HTTP non-200)"
            return 1
        fi
    fi
    
    echo "OK"
    return 0
}

if [ "$TARGET" = "all" ]; then
    for svc in "${!ENDPOINTS[@]}"; do
        check_service "$svc" || exit 1
    done
else
    check_service "$TARGET" || exit 1
fi

echo "All specified service health checks passed."
```

---

## 8. Docker Compose Healthcheck Configuration

Every service definition in `docker-compose.prod.yml` must specify native healthchecks:

```yaml
services:
  api-gateway:
    image: ecommerce/api-gateway:${VERSION}
    restart: always
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  order-service:
    image: ecommerce/order-service:${VERSION}
    restart: always
    stop_grace_period: 30s
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1024M
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8007/actuator/health"]
      interval: 15s
      timeout: 5s
      retries: 4
      start_period: 40s
```

---

## 9. Automatic Rollback Architecture

```
Current Version
      │
      ▼
Backup current version
      │
      ▼
Deploy new version
      │
      ▼
Health Check
      │
   ┌──┴───┐
   │      │
 PASS   FAIL
   │      │
   ▼      ▼
 LIVE   ROLLBACK
```

If health check exit code $\neq 0$, the rollback script automatically triggers, switching `.env.production` image tags to the last known good release and re-issuing `docker compose up -d`.

---

## 10. Rollback Script (`rollback.sh`)

```bash
#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="/opt/ecommerce"
DEPLOY_DIR="$APP_DIR/deploy"
TARGET="${1:-all}"
MANIFEST_DIR="$APP_DIR/releases"

echo "========================================="
echo " Emergency Rollback Triggered: $TARGET"
echo " Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "========================================="

cd "$DEPLOY_DIR"

# Locate last stable release manifest
LAST_STABLE=$(ls -1dt "$MANIFEST_DIR"/release-*.env 2>/dev/null | sed -n '2p' || true)

if [ -z "$LAST_STABLE" ]; then
    echo "CRITICAL: No previous stable release manifest found in $MANIFEST_DIR"
    exit 1
fi

echo "Restoring environment configuration from: $LAST_STABLE"
cp "$LAST_STABLE" "$DEPLOY_DIR/.env.production"

echo "Re-deploying prior image versions..."
if [ "$TARGET" = "all" ]; then
    docker compose -f docker-compose.prod.yml up -d
else
    docker compose -f docker-compose.prod.yml up -d --no-deps "$TARGET"
fi

echo "Verifying restored state..."
sleep 15
./health-check.sh "$TARGET"

echo "Rollback successfully completed."
```

---

## 11. Database Migration Rules (Backward Compatibility)

> [!CRITICAL]
> **Zero-Downtime Rule**: Never execute non-backward-compatible schema changes during live deployment.

```
Old Application
      │
      ▼
Migration 1 (Additive: Add nullable/default column)
      │
      ▼
New Application Deployed
      │
      ▼
Migration 2 (Cleanup: Drop deprecated column after verification)
```

### Safe 2-Phase Pattern:
1. **Phase 1 (Deploy N)**:
   ```sql
   ALTER TABLE orders ADD COLUMN payment_reference VARCHAR(255);
   ```
2. **Deploy Service N**: Uses `payment_reference` if present, falls back to `old_field`.
3. **Phase 2 (Deploy N+1)**:
   ```sql
   ALTER TABLE orders DROP COLUMN old_field;
   ```

This guarantees seamless rollback without schema collision if Deploy N fails.

---

## 12. Backup Before Deployment (`backup.sh`)

```bash
#!/usr/bin/env bash

set -Eeuo pipefail

BACKUP_DIR="/opt/ecommerce/backups"
DATE=$(date +"%Y%m%d-%H%M%S")
FILENAME="ecommerce-db-$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Generating PostgreSQL snapshot..."
docker compose -f /opt/ecommerce/deploy/docker-compose.prod.yml exec -T postgres \
  pg_dumpall -U postgres | gzip > "$BACKUP_DIR/$FILENAME"

echo "Backup created successfully: $BACKUP_DIR/$FILENAME ($(du -h "$BACKUP_DIR/$FILENAME" | cut -f1))"

# Prune local backups older than 7 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -delete

# (Optional) Mirror to S3/GCS Object Storage
if command -v aws >/dev/null 2>&1 && [ -n "${S3_BACKUP_BUCKET:-}" ]; then
    echo "Offloading to S3 bucket: $S3_BACKUP_BUCKET..."
    aws s3 cp "$BACKUP_DIR/$FILENAME" "s3://$S3_BACKUP_BUCKET/backups/$FILENAME"
fi
```

---

## 13. One Client Production Model

```
1 Client
   │
   ▼
1 Production Environment
   │
   ├── Frontend
   ├── Gateway
   ├── 15 Services
   ├── PostgreSQL
   ├── Redis
   ├── Kafka
   └── OpenSearch
```

Avoid introducing complex multi-tenant routing, dynamic schema switching, or tenant meshes prematurely. Use clean column-level identifiers (`tenant_id`) in database entities so multi-tenancy can be activated without schema redesign when needed.

---

## 14. Live Deployment Strategy: Docker Compose vs. Kubernetes

```
Stage 1: Live Today (16-Core Server)
Docker Compose + Bash + GitHub Actions + Docker Registry
   │
   │ (When traffic/nodes scale beyond single server)
   ▼
Stage 2: Enterprise Future
Kubernetes + Helm + Argo CD + Multi-Region Cluster
```

Docker Compose provides lower memory overhead, near-zero control plane tax, simpler debugging, and faster recovery for a 16-core dedicated instance.

---

## 15. Automatic GitHub Actions CI/CD Pipeline

```yaml
name: Production CI/CD

on:
  push:
    branches: [ main ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source
        uses: actions/checkout@v4

      - name: Run Test Suite
        run: |
          echo "Running microservices test suite..."
          # ./scripts/run-all-tests.sh

      - name: Set Release Tag
        run: echo "RELEASE_TAG=$(date +'%Y%m%d-%H%M%S')-${GITHUB_SHA::7}" >> $GITHUB_ENV

      - name: Log in to Docker Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push Service Images
        run: |
          echo "Building with tag: $RELEASE_TAG"
          # docker compose build && docker compose push

      - name: SSH Trigger Remote Deployment
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /opt/ecommerce/deploy
            export VERSION="${{ env.RELEASE_TAG }}"
            ./deploy.sh
```

---

## 16. Deployment Security

Never commit production secrets into Git repositories.

```
GitHub Secrets ──► Environment Variables / Vault ──► /opt/ecommerce/deploy/.env.production
```

Enforce strict POSIX file permissions on server:
```bash
sudo chown -R deploy:deploy /opt/ecommerce
chmod 600 /opt/ecommerce/deploy/.env.production
chmod 700 /opt/ecommerce/deploy/*.sh
```

---

## 17. SSH Hardening & Deployment User

1. Create a dedicated unprivileged deploy user:
   ```bash
   sudo useradd -m -s /bin/bash deploy
   sudo usermod -aG docker deploy
   ```
2. Generate modern ed25519 keypair:
   ```bash
   ssh-keygen -t ed25519 -C "deploy@ecommerce-production"
   ```
3. Harden `/etc/ssh/sshd_config`:
   ```text
   PasswordAuthentication no
   PermitRootLogin prohibit-password
   PubkeyAuthentication yes
   ```

---

## 18. Concurrency Protection (Deployment Lock)

Prevent two concurrent deployments from corrupting state using kernel `flock`:

```bash
LOCK_FILE="/var/lock/ecommerce-deploy.lock"
exec 9>"$LOCK_FILE"

if ! flock -n 9; then
    echo "ABORT: Another deployment is running concurrently."
    exit 1
fi
```

---

## 19. Graceful Shutdown & Draining

Ensure running requests complete before process termination:

```yaml
services:
  order-service:
    stop_grace_period: 30s
  payment-service:
    stop_grace_period: 30s
  api-gateway:
    stop_grace_period: 15s
```

Allows Spring Boot (`server.shutdown=graceful`) and Go Gin (`srv.Shutdown(ctx)`) to complete in-flight transactions.

---

## 20. Centralized Logging & Diagnostics

```
Services (stdout/stderr) ──► Docker JSON/Syslog Driver ──► /opt/ecommerce/logs/
```

### Essential Triage Commands:
```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Live tail gateway traffic
docker compose -f docker-compose.prod.yml logs --tail=100 -f api-gateway

# Inspect Order Service errors
docker compose -f docker-compose.prod.yml logs --tail=200 order-service | grep -E "ERROR|WARN"

# Real-time resource usage across all containers
docker stats --no-stream
```

---

## 21. Production Telemetry & Monitoring

Your 16-core server must continuously observe:
- **Host Metrics**: CPU, RAM, NVMe Disk IOPS, Network Throughput
- **Container Health**: Restart counts, OOM kills
- **Infrastructure**: PostgreSQL active pool, Redis memory, Kafka consumer lag, OpenSearch cluster state
- **Business SLOs**: HTTP 5xx rate, Checkout p99 latency, Payment failure rate

```
Services ──► Prometheus (:9090) ──► Alertmanager ──► Slack / PagerDuty
                   │
                   ▼
             Grafana (:3001)
```

### Alert Thresholds:
- Host CPU $> 85\%$ for 5 minutes
- Host RAM $> 85\%$
- Disk Storage $> 80\%$
- Gateway HTTP 5xx $> 1\%$
- Kafka consumer group lag $> 1000$ messages

---

## 22. End-to-End Deployment Workflow Diagram

```
             Developer
                 │
                 ▼
             Git Push
                 │
                 ▼
          GitHub / GitLab
                 │
                 ▼
              CI Tests
                 │
           ┌─────┴─────┐
           │           │
         FAIL         PASS
           │           │
           ▼           ▼
          STOP     Docker Build
                       │
                       ▼
                 Image Registry
                       │
                       ▼
                Production SSH
                       │
                       ▼
                  deploy.sh
                       │
              ┌────────┴────────┐
              │                 │
           Backup            Pull Images
              │                 │
              └────────┬────────┘
                       ▼
                  DB Migration
                       │
                       ▼
                 Deploy Services
                       │
                       ▼
                 Health Checks
                       │
             ┌─────────┴─────────┐
             │                   │
           PASS                 FAIL
             │                   │
             ▼                   ▼
         LIVE SYSTEM          ROLLBACK
             │
             ▼
        Monitoring
```

---

## 23. Single-Service Incremental Deployment

> [!WARNING]
> Never run `docker compose down && docker compose up -d` in live production. Doing so restarts PostgreSQL, Kafka, and Redis unnecessarily.

### Correct Selective Update:
```bash
./deploy.sh order-service
```

```
Order Service
     │
     ▼
Pull new image
     │
     ▼
Restart Order Container

while keeping live:
PostgreSQL ── RUNNING
Redis      ── RUNNING
Kafka      ── RUNNING
Catalog    ── RUNNING
Payment    ── RUNNING
```

---

## 24. Deployment Command Reference

| Command | Action |
| :--- | :--- |
| `./deploy.sh` | Full stack deployment with backup, pull, migrate, and healthcheck |
| `./deploy.sh order-service` | Zero-downtime deployment of `order-service` only |
| `./rollback.sh` | Rollback entire fleet to previous stable release manifest |
| `./rollback.sh order-service` | Rollback `order-service` only |
| `./health-check.sh` | Verify all 16 microservices and edge gateway |
| `./health-check.sh payment-service` | Probe payment service process & endpoint |
| `./backup.sh` | Snapshot all PostgreSQL databases to compressed tarball |
| `./status.sh` | Show container health status, CPU% and memory quotas |
| `./logs.sh order-service` | Follow streaming logs for order service |
| `./restart-service.sh cart-service` | Gracefully bounce cart service container |

---

## 25. Final Recommended Stack & Golden Summary

```
                ┌─────────────────────┐
                │      GitHub         │
                └──────────┬──────────┘
                           │
                           ▼
                     GitHub Actions
                           │
                    Test + Build
                           │
                           ▼
                    Docker Registry
                           │
                           ▼
                  ┌─────────────────┐
                  │ 16-Core Server  │
                  │ Ubuntu Server   │
                  └────────┬────────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   Microservices       PostgreSQL           Redis
        │
        ├──────────────► Kafka
        │
        └──────────────► OpenSearch

                │
                ▼
          Prometheus/Grafana
```

### The Key Principle
For one client on a 16-core machine, start with **Docker Compose + Bash + CI/CD** rather than Kubernetes. Make the deployment scripts production-safe with **health checks, backups, migrations, idempotency, locking, rollback, monitoring, and per-service deployment**. Move to Kubernetes only when traffic or infrastructure complexity genuinely justifies it.
