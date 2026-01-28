# Cloud Run services para el pipeline
# Cada servicio corre en su propio container con su propia SA

# Ingest service - recibe eventos HTTP y los publica a Pub/Sub
resource "google_cloud_run_v2_service" "ingest" {
  name     = "cse-ingest-${var.environment}"
  location = var.region

  template {
    service_account = var.ingest_sa_email

    containers {
      image = var.ingest_image

      ports {
        container_port = 3000
      }

      env {
        name  = "RAW_EVENTS_TOPIC"
        value = var.raw_events_topic
      }

      env {
        name  = "PUBSUB_PROJECT_ID"
        value = var.project_id
      }

      # Recursos mínimos para dev (scale to zero)
      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
        cpu_idle = true # Permite scale to zero
      }

      # Health check
      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }
    }

    # Scaling config
    scaling {
      min_instance_count = 0 # Scale to zero en dev
      max_instance_count = var.max_instances
    }
  }

  # Permitir tráfico sin autenticación (es un endpoint público)
  # En prod se puede agregar Cloud Armor o API Gateway
  ingress = "INGRESS_TRAFFIC_ALL"

  labels = {
    environment = var.environment
    service     = "ingest"
  }
}

# Permitir invocación pública del ingest service
resource "google_cloud_run_v2_service_iam_member" "ingest_public" {
  name     = google_cloud_run_v2_service.ingest.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Normalizer service - consume raw-events, enriquece, guarda en BigQuery
resource "google_cloud_run_v2_service" "normalizer" {
  name     = "cse-normalizer-${var.environment}"
  location = var.region

  template {
    service_account = var.normalizer_sa_email

    containers {
      image = var.normalizer_image

      ports {
        container_port = 3001
      }

      env {
        name  = "RAW_EVENTS_SUBSCRIPTION"
        value = var.raw_events_subscription
      }

      env {
        name  = "PROCESSED_EVENTS_TOPIC"
        value = var.processed_events_topic
      }

      env {
        name  = "PUBSUB_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "BIGQUERY_DATASET"
        value = var.bigquery_dataset
      }

      env {
        name  = "BIGQUERY_TABLE"
        value = "events"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }
    }

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }
  }

  ingress = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  labels = {
    environment = var.environment
    service     = "normalizer"
  }
}

