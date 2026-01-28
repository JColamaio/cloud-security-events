# Emails de las service accounts para usar en Cloud Run
output "ingest_sa_email" {
  description = "Email de la SA para ingest service"
  value       = google_service_account.ingest.email
}

output "normalizer_sa_email" {
  description = "Email de la SA para normalizer service"
  value       = google_service_account.normalizer.email
}

output "alerting_sa_email" {
  description = "Email de la SA para alerting service"
  value       = google_service_account.alerting.email
}
