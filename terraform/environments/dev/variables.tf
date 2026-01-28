variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Ambiente"
  type        = string
  default     = "dev"
}

variable "image_tag" {
  description = "Tag de las imágenes Docker (latest, commit sha, etc)"
  type        = string
  default     = "latest"
}
