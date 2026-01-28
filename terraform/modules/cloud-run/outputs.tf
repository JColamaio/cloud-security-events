# URLs de los servicios
output "ingest_url" {
  description = "URL del ingest service (pública)"
  value       = google_cloud_run_v2_service.ingest.uri
}

output "normalizer_url" {
  description = "URL del normalizer service (interna)"
  value       = google_cloud_run_v2_service.normalizer.uri
}

output "alerting_url" {
  description = "URL del alerting service (interna)"
  value       = google_cloud_run_v2_service.alerting.uri
}

# Nombres para referencia
output "ingest_service_name" {
  value = google_cloud_run_v2_service.ingest.name
}

output "normalizer_service_name" {
  value = google_cloud_run_v2_service.normalizer.name
}

output "alerting_service_name" {
  value = google_cloud_run_v2_service.alerting.name
}
