variable "environment" {
  description = "Ambiente: dev, staging, prod"
  type        = string
}

variable "location" {
  description = "Ubicación del dataset (US, EU, region específica)"
  type        = string
  default     = "US"
}

variable "table_expiration_days" {
  description = "Días antes de que expiren las particiones"
  type        = number
  default     = 90
}
