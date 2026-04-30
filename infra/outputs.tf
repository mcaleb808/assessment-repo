output "api_url" {
  value       = google_cloud_run_v2_service.api.uri
  description = "Public URL of the api Cloud Run service."
}

output "web_url" {
  value       = google_cloud_run_v2_service.web.uri
  description = "Public URL of the web Cloud Run service."
}

output "artifact_registry" {
  value       = "${google_artifact_registry_repository.images.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}"
  description = "Docker registry path for both services."
}

output "wif_provider" {
  value       = google_iam_workload_identity_pool_provider.github.name
  description = "Full WIF provider resource name (for google-github-actions/auth)."
}

output "deployer_sa_email" {
  value       = google_service_account.deployer.email
  description = "Service account the GitHub Action impersonates."
}

output "api_runtime_sa_email" {
  value       = google_service_account.api_runtime.email
  description = "Service account the api Cloud Run service runs as."
}
