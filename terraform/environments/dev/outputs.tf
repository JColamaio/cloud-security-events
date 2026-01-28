# URLs de los servicios desplegados
output "ingest_url" {
  description = "URL pública para enviar eventos"
  value       = module.cloud_run.ingest_url
}

output "normalizer_url" {
  description = "URL del normalizer (interna)"
  value       = module.cloud_run.normalizer_url
}

output "alerting_url" {
  description = "URL del alerting (interna)"
  value       = module.cloud_run.alerting_url
}

# Info de BigQuery para queries manuales
output "bigquery_dataset" {
  description = "Dataset de BigQuery"
  value       = module.bigquery.dataset_id
}

# Artifact Registry
output "container_registry" {
  description = "URL del registry para push de imágenes"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/cse-containers"
}

# Pub/Sub topics para debugging
output "raw_events_topic" {
  value = module.pubsub.raw_events_topic_name
}

output "processed_events_topic" {
  value = module.pubsub.processed_events_topic_name
}
