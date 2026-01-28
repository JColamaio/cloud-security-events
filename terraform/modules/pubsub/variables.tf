variable "environment" {
  description = "Ambiente: dev, staging, prod"
  type        = string
}

variable "project_number" {
  description = "GCP project number (para permisos de DLQ)"
  type        = string
}
