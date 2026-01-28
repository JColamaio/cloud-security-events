# Service accounts para cada servicio
# Principio: least privilege - cada SA tiene solo los permisos que necesita
#
# TODO: para producción considerar:
# - Workload Identity en vez de SA keys
# - Audit logging de accesos
# - Rotación de credenciales

# SA para ingest service
# Permisos: publicar a Pub/Sub
resource "google_service_account" "ingest" {
  account_id   = "cse-ingest-${var.environment}"
  display_name = "CSE Ingest Service"
  description  = "Service account for ingest Cloud Run service"
}

# SA para normalizer service
# Permisos: leer de Pub/Sub, escribir a BigQuery, publicar eventos procesados
resource "google_service_account" "normalizer" {
  account_id   = "cse-normalizer-${var.environment}"
  display_name = "CSE Normalizer Service"
  description  = "Service account for normalizer Cloud Run service"
}

# SA para alerting service
# Permisos: leer de Pub/Sub, invocar webhooks externos
resource "google_service_account" "alerting" {
  account_id   = "cse-alerting-${var.environment}"
  display_name = "CSE Alerting Service"
  description  = "Service account for alerting Cloud Run service"
}

# Permisos de Pub/Sub para ingest (publicar a raw-events)
resource "google_pubsub_topic_iam_member" "ingest_publisher" {
  topic  = var.raw_events_topic
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.ingest.email}"
}

# Permisos de Pub/Sub para normalizer
resource "google_pubsub_subscription_iam_member" "normalizer_subscriber" {
  subscription = var.raw_events_subscription
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.normalizer.email}"
}

resource "google_pubsub_topic_iam_member" "normalizer_publisher" {
  topic  = var.processed_events_topic
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:${google_service_account.normalizer.email}"
}

# Permisos de BigQuery para normalizer
resource "google_bigquery_dataset_iam_member" "normalizer_writer" {
  dataset_id = var.bigquery_dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = "serviceAccount:${google_service_account.normalizer.email}"
}

# Necesario para ejecutar queries/inserts
resource "google_project_iam_member" "normalizer_bq_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.normalizer.email}"
}

# Permisos de Pub/Sub para alerting
resource "google_pubsub_subscription_iam_member" "alerting_subscriber" {
  subscription = var.processed_events_subscription
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:${google_service_account.alerting.email}"
}
