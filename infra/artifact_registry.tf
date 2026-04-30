resource "google_artifact_registry_repository" "images" {
  location      = var.region
  repository_id = "assessment-repo"
  description   = "Container images for the assessment-repo Cloud Run services."
  format        = "DOCKER"

  depends_on = [google_project_service.enabled]
}
