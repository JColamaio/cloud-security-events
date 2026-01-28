# Variables globales del proyecto
# Valores concretos van en environments/dev/terraform.tfvars

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region para Cloud Run y recursos regionales"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Ambiente: dev, staging, prod"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment debe ser dev, staging o prod."
  }
}
