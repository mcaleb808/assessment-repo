locals {
  api_secrets = [
    "OPENAI_API_KEY",
    "LANGFUSE_PUBLIC_KEY",
    "LANGFUSE_SECRET_KEY",
    "MCP_SERVER_URL",
  ]
}

resource "google_secret_manager_secret" "api" {
  for_each  = toset(local.api_secrets)
  secret_id = each.value

  replication {
    auto {}
  }

  depends_on = [google_project_service.enabled]
}

# Bootstrap version so Cloud Run can mount a "latest" reference. Replace via
#   gcloud secrets versions add NAME --data-file=path
# Lifecycle ignores body changes so subsequent terraform runs don't clobber
# rotated secrets that were updated out of band.
resource "google_secret_manager_secret_version" "api_bootstrap" {
  for_each    = google_secret_manager_secret.api
  secret      = each.value.id
  secret_data = "REPLACE_ME"

  lifecycle {
    ignore_changes = [secret_data]
  }
}

resource "google_secret_manager_secret_iam_member" "api_runtime_access" {
  for_each  = google_secret_manager_secret.api
  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api_runtime.email}"
}
