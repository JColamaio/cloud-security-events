resource "google_cloud_run_v2_service" "alerting" {
  name     = "cse-alerting-${var.environment}"
  location = var.region

  template {
    service_account = var.alerting_sa_email

    containers {
      image = var.alerting_image

      ports {
        container_port = 3002
      }

      env {
        name  = "PROCESSED_EVENTS_SUBSCRIPTION"
        value = var.processed_events_subscription
      }

      env {
        name  = "PUBSUB_PROJECT_ID"
        value = var.project_id
      }

      # Webhook URL para notificaciones (de Secret Manager en prod)
      dynamic "env" {
        for_each = var.alert_webhook_url != "" ? [1] : []
        content {
          name  = "ALERT_WEBHOOK_URL"
          value = var.alert_webhook_url
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
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
    service     = "alerting"
  }
}
