variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "environment" {
  description = "Ambiente: dev, staging, prod"
  type        = string
}

# Container images (se actualizan via CI/CD)
variable "ingest_image" {
  description = "Docker image para ingest service"
  type        = string
}

variable "normalizer_image" {
  description = "Docker image para normalizer service"
  type        = string
}

variable "alerting_image" {
  description = "Docker image para alerting service"
  type        = string
}

# Service accounts
variable "ingest_sa_email" {
  description = "Email de la SA para ingest"
  type        = string
}

variable "normalizer_sa_email" {
  description = "Email de la SA para normalizer"
  type        = string
}

variable "alerting_sa_email" {
  description = "Email de la SA para alerting"
  type        = string
}

# Referencias a Pub/Sub
variable "raw_events_topic" {
  description = "Nombre del topic raw-events"
  type        = string
}

variable "raw_events_subscription" {
  description = "Nombre de la subscription raw-events"
  type        = string
}

variable "processed_events_topic" {
  description = "Nombre del topic processed-events"
  type        = string
}

variable "processed_events_subscription" {
  description = "Nombre de la subscription processed-events"
  type        = string
}

# BigQuery
variable "bigquery_dataset" {
  description = "ID del dataset de BigQuery"
  type        = string
}

# Scaling
variable "max_instances" {
  description = "Máximo de instancias por servicio"
  type        = number
  default     = 3
}

# Alerting config
variable "alert_webhook_url" {
  description = "URL del webhook para alertas (opcional)"
  type        = string
  default     = ""
}
