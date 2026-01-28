# Topics y subscriptions para el pipeline de eventos
# Flujo: ingest -> raw-events -> normalizer -> processed-events -> alerting
#
# TODO: para producción considerar:
# - Push subscriptions en vez de pull (menos latencia)
# - Message ordering si el orden importa
# - Schema validation en los topics

# Topic para eventos crudos (output de ingest)
resource "google_pubsub_topic" "raw_events" {
  name = "raw-events-${var.environment}"

  # Retención de mensajes por si necesitamos replay
  message_retention_duration = "86400s" # 24 horas
}

# Subscription para normalizer (consume raw-events)
# Usa push hacia Cloud Run para evitar polling
resource "google_pubsub_subscription" "raw_events" {
  name  = "raw-events-sub-${var.environment}"
  topic = google_pubsub_topic.raw_events.id

  # Ack deadline: tiempo que tiene el servicio para procesar
  ack_deadline_seconds = 30

  # Retry policy para mensajes fallidos
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  # Dead letter para mensajes que fallan repetidamente
  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }

  # Push config se agrega después cuando Cloud Run existe
  # Por ahora queda como pull subscription
}

# Topic para eventos procesados (output de normalizer)
resource "google_pubsub_topic" "processed_events" {
  name = "processed-events-${var.environment}"

  message_retention_duration = "86400s"
}

# Subscription para alerting (consume processed-events)
resource "google_pubsub_subscription" "processed_events" {
  name  = "processed-events-sub-${var.environment}"
  topic = google_pubsub_topic.processed_events.id

  ack_deadline_seconds = 30

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dead_letter.id
    max_delivery_attempts = 5
  }
}

# Topic para dead letters (mensajes que fallaron múltiples veces)
# Útil para debugging y re-procesamiento manual
resource "google_pubsub_topic" "dead_letter" {
  name = "dead-letter-${var.environment}"
}

# Pub/Sub necesita permisos para publicar al DLQ
resource "google_pubsub_topic_iam_member" "dead_letter_publisher" {
  topic  = google_pubsub_topic.dead_letter.name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:service-${var.project_number}@gcp-sa-pubsub.iam.gserviceaccount.com"
}

# Subscription para inspeccionar dead letters
resource "google_pubsub_subscription" "dead_letter" {
  name  = "dead-letter-sub-${var.environment}"
  topic = google_pubsub_topic.dead_letter.id

  # Retención larga para análisis
  message_retention_duration = "604800s" # 7 días

  ack_deadline_seconds = 60
}
