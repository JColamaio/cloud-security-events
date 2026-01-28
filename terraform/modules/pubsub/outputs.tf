# Nombres de topics y subscriptions para otros módulos
output "raw_events_topic_name" {
  description = "Nombre del topic raw-events"
  value       = google_pubsub_topic.raw_events.name
}

output "raw_events_topic_id" {
  description = "ID completo del topic raw-events"
  value       = google_pubsub_topic.raw_events.id
}

output "raw_events_subscription_name" {
  description = "Nombre de la subscription raw-events"
  value       = google_pubsub_subscription.raw_events.name
}

output "processed_events_topic_name" {
  description = "Nombre del topic processed-events"
  value       = google_pubsub_topic.processed_events.name
}

output "processed_events_topic_id" {
  description = "ID completo del topic processed-events"
  value       = google_pubsub_topic.processed_events.id
}

output "processed_events_subscription_name" {
  description = "Nombre de la subscription processed-events"
  value       = google_pubsub_subscription.processed_events.name
}

output "dead_letter_topic_name" {
  description = "Nombre del topic dead-letter"
  value       = google_pubsub_topic.dead_letter.name
}
