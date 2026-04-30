variable "project_id" {
  type        = string
  description = "GCP project ID."
}

variable "region" {
  type        = string
  description = "Default region for all resources."
  default     = "us-central1"
}

variable "github_repo" {
  type        = string
  description = "GitHub repo in 'owner/name' form. Used to bind the WIF provider."
}

variable "api_image" {
  type        = string
  description = "Initial image tag for the api Cloud Run service. Real tags ship via CI."
  default     = "us-docker.pkg.dev/cloudrun/container/hello:latest"
}

variable "web_image" {
  type        = string
  description = "Initial image tag for the web Cloud Run service. Real tags ship via CI."
  default     = "us-docker.pkg.dev/cloudrun/container/hello:latest"
}
