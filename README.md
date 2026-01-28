# Cloud Security Events Pipeline

Pipeline serverless en GCP para ingesta, procesamiento y alerting de eventos de seguridad.

## Qué hace

Recibe eventos de seguridad de múltiples fuentes (aplicaciones, Cloud Audit Logs, Security Command Center), los normaliza a un schema común, los enriquece con datos de contexto (GeoIP), los almacena para análisis y genera alertas en tiempo real basadas en reglas de detección.

## Arquitectura

```
                    ┌─────────────────────────────────────┐
                    │           Event Sources             │
                    │  (Apps, Cloud Audit, SCC, etc.)     │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │         Ingest Service              │
                    │  - Validación de schema (Zod)       │
                    │  - Rate limiting                    │
                    │  - HTTP + Pub/Sub push              │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │       Pub/Sub: raw-events           │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────────┐
                    │       Normalizer Service            │
                    │  - Mapeo a schema ECS               │
                    │  - Enriquecimiento GeoIP            │
                    │  - Clasificación de eventos         │
                    └───────┬─────────────────┬───────────┘
                            │                 │
                ┌───────────┘                 └───────────┐
                ▼                                         ▼
    ┌───────────────────────┐             ┌───────────────────────┐
    │  Pub/Sub: processed   │             │       BigQuery        │
    └───────────┬───────────┘             │  - Particionado/día   │
                │                         │  - Clustering         │
                ▼                         └───────────────────────┘
    ┌───────────────────────┐
    │    Alerting Service   │
    │  - Rule engine YAML   │
    │  - Agregación temporal│
    │  - Multi-notifier     │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │    Notifications      │
    │  (Slack, Webhook)     │
    └───────────────────────┘
```

## Stack técnico

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Compute | Cloud Run | Serverless, scale to zero, pay per use |
| Messaging | Pub/Sub | Desacople, retry nativo, dead letter queue |
| Storage | BigQuery | SQL analytics, schema flexible, particionado |
| IaC | Terraform | Módulos reutilizables, state management |
| CI/CD | Cloud Build + GitHub Actions | Nativo GCP + validación en PRs |
| Language | TypeScript | Type safety, mejor DX |
| Validation | Zod | Runtime validation con inferencia de tipos |

## Estructura del proyecto

```
├── src/
│   ├── shared/          # Tipos, schemas, adapters
│   │   ├── types/       # Event types (ECS-based)
│   │   ├── schemas/     # Zod validation
│   │   ├── interfaces/  # MessageQueue, EventStore
│   │   └── adapters/    # Pub/Sub, SQLite, BigQuery
│   │
│   ├── ingest/          # HTTP ingestion service
│   ├── normalizer/      # Processing + enrichment
│   └── alerting/        # Detection rules engine
│
├── terraform/
│   ├── modules/
│   │   ├── pubsub/      # Topics, subscriptions, DLQ
│   │   ├── bigquery/    # Dataset, tables, schema
│   │   ├── iam/         # Service accounts, least privilege
│   │   └── cloud-run/   # Services config
│   └── environments/
│       └── dev/         # Dev environment
│
├── cloudbuild/          # GCP CI/CD pipelines
├── .github/workflows/   # GitHub Actions
└── local/               # Docker compose para desarrollo
```

## Desarrollo local

El proyecto corre 100% local usando emuladores de GCP.

```bash
# Requisitos: Docker, Node.js 20+, pnpm

# Instalar dependencias
pnpm install

# Levantar infraestructura local
cd local && docker-compose up -d

# Los servicios quedan en:
# - Ingest:     http://localhost:3000
# - Normalizer: http://localhost:3001
# - Alerting:   http://localhost:3002
```

### Enviar evento de prueba

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -d '{
    "source_type": "app",
    "source_name": "auth-service",
    "payload": {
      "action": "login_failure",
      "user": "admin",
      "ip": "190.100.50.25"
    }
  }'
```

### Simular brute force (dispara alerta)

```bash
for i in {1..6}; do
  curl -X POST http://localhost:3000/events \
    -H "Content-Type: application/json" \
    -d '{
      "source_type": "app",
      "source_name": "auth-service",
      "payload": {
        "action": "login_failure",
        "user": "admin",
        "ip": "190.100.50.25"
      }
    }'
done
# El alerting service detecta 5+ login failures desde la misma IP
```

## Reglas de detección

Las reglas se definen en YAML, similar a Sigma/Elastic SIEM:

```yaml
rules:
  - id: brute-force-login
    name: Brute Force Login Attempt
    severity: high
    conditions:
      event_type: authentication
      event_action: login_failure
      aggregation:
        field: actor.ip
        count_threshold: 5
        time_window_seconds: 300
    actions:
      - type: console
      - type: webhook
        config:
          url: https://slack.webhook.url
```

Reglas incluidas:
- **brute-force-login**: 5+ login failures desde misma IP en 5 min
- **privilege-escalation**: Grants de roles admin
- **credential-created**: Creación de API keys o service accounts
- **shadow-file-access**: Acceso a /etc/shadow
- **ssh-key-access**: Acceso a claves SSH privadas

## Schema de eventos

Basado en Elastic Common Schema (ECS) para interoperabilidad:

```typescript
interface SecurityEvent {
  id: string;
  timestamp: string;
  ingested_at: string;
  
  event_type: "authentication" | "network" | "file" | "process" | "audit";
  event_action: string;
  event_severity: "low" | "medium" | "high" | "critical";
  event_category: string[];
  
  source: {
    type: string;
    name: string;
  };
  
  actor?: {
    user?: string;
    email?: string;
    ip?: string;
    geo?: { country?: string; city?: string };
  };
  
  target?: {
    type: string;
    name?: string;
    ip?: string;
    port?: number;
  };
  
  outcome: "success" | "failure" | "unknown";
  metadata: Record<string, unknown>;
}
```

## Deploy a GCP

```bash
cd terraform/environments/dev

# Configurar
cp terraform.tfvars.example terraform.tfvars
# Editar project_id

# Deploy
terraform init
terraform plan
terraform apply
```

El terraform crea:
- 3 Cloud Run services con auto-scaling
- Pub/Sub topics con dead letter queue
- BigQuery dataset con tablas particionadas
- IAM con least privilege por servicio

## Tests

```bash
pnpm test        # Corre todos los tests
pnpm lint        # ESLint
pnpm build       # Type check + build
```

## CI/CD

- **GitHub Actions**: Lint + test en cada PR
- **Cloud Build**: Build de imágenes y deploy a Cloud Run en push a main

## Decisiones técnicas

| Decisión | Alternativas | Por qué esta |
|----------|--------------|--------------|
| Cloud Run vs GKE | GKE tiene más control | Scale to zero, menos ops overhead |
| Pub/Sub vs Kafka | Kafka más features | Managed, integración nativa GCP |
| BigQuery vs Cloud SQL | SQL más familiar | Analytics, schema flexible, serverless |
| TypeScript vs Go | Go más performante | Ecosystem Node, Zod validation |

## Licencia

MIT
