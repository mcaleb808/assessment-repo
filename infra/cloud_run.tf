resource "google_service_account" "api_runtime" {
  account_id   = "assessment-api-run"
  display_name = "Runtime SA for the api Cloud Run service"
}

resource "google_service_account" "web_runtime" {
  account_id   = "assessment-web-run"
  display_name = "Runtime SA for the web Cloud Run service"
}

resource "google_cloud_run_v2_service" "api" {
  name                = "assessment-api"
  location            = var.region
  deletion_protection = false
  ingress             = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.api_runtime.email
    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = var.api_image

      ports {
        container_port = 8000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        startup_cpu_boost = true
      }

      env {
        name  = "MCP_TRANSPORT"
        value = "sse"
      }
      env {
        name  = "STRONG_MODEL"
        value = "gpt-4o"
      }
      env {
        name  = "FAST_MODEL"
        value = "gpt-4o-mini"
      }
      env {
        name  = "LANGFUSE_HOST"
        value = "https://cloud.langfuse.com"
      }
      env {
        name  = "LOG_LEVEL"
        value = "INFO"
      }

      dynamic "env" {
        for_each = local.api_secrets
        content {
          name = env.value
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.api[env.value].secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [
    google_project_service.enabled,
    google_secret_manager_secret_iam_member.api_runtime_access,
    google_secret_manager_secret_version.api_bootstrap,
  ]
}

resource "google_cloud_run_v2_service" "web" {
  name                = "assessment-web"
  location            = var.region
  deletion_protection = false
  ingress             = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.web_runtime.email
    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = var.web_image

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        startup_cpu_boost = true
      }

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.api.uri
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
    ]
  }

  depends_on = [google_project_service.enabled]
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = google_cloud_run_v2_service.web.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
