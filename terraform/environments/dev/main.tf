# Environment: dev
# Este archivo orquesta todos los módulos para el ambiente de desarrollo

terraform {
  # Backend config - en dev usamos local, en prod sería GCS
  # backend "gcs" {
  #   bucket = "cse-terraform-state"
  #   prefix = "dev"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Obtenemos el project number (necesario para algunos permisos)
data "google_project" "current" {
  project_id = var.project_id
}

# Habilitar APIs necesarias
# Esto tarda unos segundos la primera vez
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "pubsub.googleapis.com",
    "bigquery.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Artifact Registry para las imágenes Docker
resource "google_artifact_registry_repository" "containers" {
  location      = var.region
  repository_id = "cse-containers"
  format        = "DOCKER"
  description   = "Container images for CSE services"

  depends_on = [google_project_service.apis]
}

# Pub/Sub (topics y subscriptions)
module "pubsub" {
  source = "../../modules/pubsub"

  environment    = var.environment
  project_number = data.google_project.current.number

  depends_on = [google_project_service.apis]
}

# BigQuery (dataset y tablas)
module "bigquery" {
  source = "../../modules/bigquery"

  environment           = var.environment
  location              = "US"
  table_expiration_days = 30 # Corto para dev

  depends_on = [google_project_service.apis]
}

# IAM (service accounts y permisos)
module "iam" {
  source = "../../modules/iam"

  project_id  = var.project_id
  environment = var.environment

  raw_events_topic              = module.pubsub.raw_events_topic_name
  raw_events_subscription       = module.pubsub.raw_events_subscription_name
  processed_events_topic        = module.pubsub.processed_events_topic_name
  processed_events_subscription = module.pubsub.processed_events_subscription_name
  bigquery_dataset_id           = module.bigquery.dataset_id

  depends_on = [module.pubsub, module.bigquery]
}

# Cloud Run services
module "cloud_run" {
  source = "../../modules/cloud-run"

  project_id  = var.project_id
  region      = var.region
  environment = var.environment

  # Imágenes - en CI/CD se actualizan con cada deploy
  ingest_image     = "${var.region}-docker.pkg.dev/${var.project_id}/cse-containers/ingest:${var.image_tag}"
  normalizer_image = "${var.region}-docker.pkg.dev/${var.project_id}/cse-containers/normalizer:${var.image_tag}"
  alerting_image   = "${var.region}-docker.pkg.dev/${var.project_id}/cse-containers/alerting:${var.image_tag}"

  # Service accounts
  ingest_sa_email     = module.iam.ingest_sa_email
  normalizer_sa_email = module.iam.normalizer_sa_email
  alerting_sa_email   = module.iam.alerting_sa_email

  # Pub/Sub references
  raw_events_topic              = module.pubsub.raw_events_topic_name
  raw_events_subscription       = module.pubsub.raw_events_subscription_name
  processed_events_topic        = module.pubsub.processed_events_topic_name
  processed_events_subscription = module.pubsub.processed_events_subscription_name

  # BigQuery
  bigquery_dataset = module.bigquery.dataset_id

  # Scaling conservador para dev
  max_instances = 2

  depends_on = [
    google_artifact_registry_repository.containers,
    module.iam,
    module.pubsub,
    module.bigquery,
  ]
}
