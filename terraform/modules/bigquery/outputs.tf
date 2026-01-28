output "dataset_id" {
  description = "ID del dataset"
  value       = google_bigquery_dataset.events.dataset_id
}

output "events_table_id" {
  description = "ID completo de la tabla events"
  value       = google_bigquery_table.events.id
}

output "alerts_table_id" {
  description = "ID completo de la tabla alerts"
  value       = google_bigquery_table.alerts.id
}
