# Theme Park Feature Flag Demo

A React + Go demonstration application for CloudBees Feature Management integration. This repository includes a complete implementation guide (`FEATURE_FLAGS_SETUP.adoc`) that teaches consultants how to integrate feature flags into applications.

**What this repository contains:**
- Complete Feature Management implementation guide
- Working demo application (theme park with tickets, events, promotions)
- Three branches for different learning paths:
  - `main` - Latest stable implementation
  - `feature-flags-clean` - Starting point for guided tutorial
  - `feature-flags-complete` - Reference implementation

## Using the Tutorial

For the complete step-by-step implementation guide, see **[FEATURE_FLAGS_SETUP.adoc](FEATURE_FLAGS_SETUP.adoc)**.

The tutorial covers:
- Prerequisites and environment setup
- CloudBees Unify configuration
- Backend SDK integration (Go)
- Frontend integration patterns
- Advanced patterns (percentage rollouts, target groups, user properties)
- Troubleshooting and best practices

## Quick Start (Demo App Only)

If you want to run the demo application without following the full tutorial:

### Backend

```bash
cd backend
cp .env.example .env
# edit .env as needed

go run .
```

The API will start on `http://localhost:8080`.

**Feature Flags:** Set `FM_KEY` in `backend/.env` to your CloudBees Feature Management API key to enable feature flags. Without this key, the app will use default flag values defined in the code (see `backend/main.go`).

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The site will be available at `http://localhost:5173`.

## Branches

This repository has three branches for different purposes:

- **`main`** - Latest stable version with all features implemented
- **`feature-flags-clean`** - Starting point for the tutorial (no SDK installed)
- **`feature-flags-complete`** - Reference implementation to compare your work

For the tutorial, start with: `git checkout feature-flags-clean`

## API Endpoints

- `GET /api/health`
- `GET /api/flags`
- `GET /api/events`
- `GET /api/promotions?segment=vip`
- `POST /api/tickets/purchase`

## Feature Management Integration

The application demonstrates CloudBees Feature Management integration patterns:

**Backend (Go):**
- `backend/main.go` - CloudBees SDK initialization and flag definitions
- `backend/handlers.go` - Flag evaluation in API endpoints with user context
- Feature flags control business logic, API responses, and feature availability

**Frontend (React):**
- `frontend/src/App.jsx` - Reads flag states from backend API
- Conditionally renders UI components based on flag values
- Backend-only SDK pattern (frontend doesn't include CloudBees SDK)

**Patterns Demonstrated:**
- Boolean flags (on/off toggles)
- Percentage rollouts with sticky behavior
- User targeting with custom properties
- Target groups for segment-based rollouts
- Kill switches for operational control

## Infrastructure (Terraform)

Terraform lives in `infra/terraform` and provisions a free-tier EC2 instance on the default VPC. The Unify workflow `Deploy EC2` runs `terraform init` and `terraform apply` using AWS credentials stored in CloudBees secrets.

Key inputs to set in Unify vars:

- `AWS_DEFAULT_REGION`
- `EC2_INSTANCE_NAME`
- `EC2_INSTANCE_TYPE`
- `EC2_KEY_NAME`
- `EC2_ALLOWED_HTTP_CIDR` (comma-separated list)

Remote state inputs (required for reliable create/destroy across workflows):

- `TF_STATE_BUCKET`
- `TF_STATE_KEY` (example: `theme-park/terraform.tfstate`)
- `TF_STATE_REGION`

Note: DynamoDB state locking is optional; this setup uses S3 only for lower cost.

## Deployment workflow

The `Deploy containers` workflow pulls the backend and frontend images from Docker Hub and runs them on the EC2 instance via SSH. It prints the public IP so you can access:

- `http://<public-ip>` (frontend)
- `http://<public-ip>:8080/api/health` (backend)

Required secrets/vars:

- Var: `QUICKSTART_DOCKER_USERNAME`
- Secret: `QUICKSTART_DOCKER_TOKEN`

This workflow now uses AWS SSM instead of SSH, so no inbound SSH access is required.

Optional image tag vars (default to `1.0.0`):

- `BACKEND_IMAGE_TAG`
- `FRONTEND_IMAGE_TAG`

Optional build var:

- `VITE_API_BASE_URL` (leave empty to use the built-in reverse proxy on EC2)

## Documentation

- **[FEATURE_FLAGS_SETUP.adoc](FEATURE_FLAGS_SETUP.adoc)** - Complete implementation guide (primary deliverable)
- **[BRANCHES_README.md](BRANCHES_README.md)** - Guide to repository branches
- **[CLAUDE.md](CLAUDE.md)** - Standards for adoption journey implementation guides
- **[PEDAGOGICAL_REVIEW.md](PEDAGOGICAL_REVIEW.md)** - Tutorial quality checklist
- **[STANDARDS_REVIEW.md](STANDARDS_REVIEW.md)** - CLAUDE.md compliance audit

## Repository Purpose

This repository serves as both:
1. **A working demo application** for CloudBees Feature Management
2. **An adoption journey implementation guide** for PS consultants

The guide follows CloudBees Professional Services standards and can be used to teach customers Feature Management integration patterns.
