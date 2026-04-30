SHELL := /bin/bash

PROJECT_ID    ?= assessment-mcaleb808
REGION        ?= us-central1
REGISTRY      := $(REGION)-docker.pkg.dev/$(PROJECT_ID)/assessment-repo
SHA           ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo dev)
API_IMAGE     := $(REGISTRY)/api:$(SHA)
WEB_IMAGE     := $(REGISTRY)/web:$(SHA)

.PHONY: help dev test build deploy list-tools smoke pre-warm tf-plan tf-apply clean

help:
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

dev: ## Run api + web locally via docker compose
	docker compose up --build

test: ## Run api pytest + web typecheck
	cd apps/api && uv run pytest -q
	cd apps/web && pnpm typecheck

build: ## Build both Docker images locally tagged $(SHA)
	docker build -t $(API_IMAGE) apps/api
	docker build -t $(WEB_IMAGE) apps/web

push: build ## Build then push both images to Artifact Registry
	docker push $(API_IMAGE)
	docker push $(WEB_IMAGE)

deploy: push ## Deploy both services to Cloud Run with the just-pushed tags
	gcloud run deploy assessment-api --image $(API_IMAGE) --region $(REGION) --project $(PROJECT_ID)
	gcloud run deploy assessment-web --image $(WEB_IMAGE) --region $(REGION) --project $(PROJECT_ID)

list-tools: ## Connect to MCP server (env or URL=...) and dump tool schemas to tools.json
	uv run --with mcp --with httpx python scripts/list_tools.py

smoke: ## Hit a deployed API URL with a sample payload (URL=https://...)
	bash scripts/smoke.sh "$(URL)"

pre-warm: ## Verify gcloud auth, project, region, and print Cloud Run URLs
	bash scripts/pre_warm.sh

eval: ## Run the eval harness against an API URL (URL=https://...)
	cd evals && uv run --with httpx python run.py "$(URL)"

tf-plan: ## terraform init + plan in infra/
	cd infra && terraform init && terraform plan -out=tf.plan

tf-apply: ## terraform apply the saved plan in infra/
	cd infra && terraform apply tf.plan

clean: ## Remove local build artefacts
	rm -rf apps/api/.venv apps/api/.pytest_cache apps/api/.ruff_cache
	rm -rf apps/web/.next apps/web/node_modules
