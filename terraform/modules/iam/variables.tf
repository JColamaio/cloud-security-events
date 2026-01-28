variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Ambiente: dev, staging, prod"
  type        = string
}

# Referencias a recursos de Pub/Sub (creados en módulo pubsub)
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

# Referencia a BigQuery dataset
variable "bigquery_dataset_id" {
  description = "ID del dataset de BigQuery"
  type        = string
}
