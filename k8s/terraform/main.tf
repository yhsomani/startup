# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "talentsphere-terraform-state"
    prefix = "prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# GKE Cluster
resource "google_container_cluster" "talentsphere" {
  name     = "talentsphere-${var.environment}"
  location = var.region
  
  initial_node_count = 1
  remove_default_node_pool = true
  
  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name
  
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
  
  # Network policy for service-to-service isolation
  network_policy {
    enabled  = true
    provider = "CALICO"
  }
  
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
  }
  
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }
  
  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }
}

# Node pool for services
resource "google_container_node_pool" "services" {
  name       = "services"
  cluster    = google_container_cluster.talentsphere.name
  node_count = var.node_count
  
  autoscaling {
    min_node_count = 3
    max_node_count = 10
  }
  
  node_config {
    machine_type = var.machine_type
    disk_size_gb = 50
    disk_type    = "pd-standard"
    
    service_account = google_service_account.nodes.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/servicecontrol",
      "https://www.googleapis.com/auth/service.management.readonly"
    ]
    
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}

# Cloud SQL PostgreSQL with Citus
resource "google_sql_database_instance" "postgres" {
  name             = "talentsphere-postgres-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = "db-custom-4-16384"  # 4vCPU, 16GB RAM
    
    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 30
      backup_retention_days          = 30
    }
    
    database_flags {
      name  = "max_connections"
      value = "200"
    }
    
    ip_configuration {
      private_network = google_compute_network.vpc.id
    }
  }
  
  deletion_protection = true
}

# Redis memorystore for caching
resource "google_redis_instance" "cache" {
  name           = "talentsphere-cache-${var.environment}"
  tier           = "standard_hl"  # High availability
  memory_size_gb = 16
  region         = var.region
  
  authorized_network = google_compute_network.vpc.id
  
  redis_configs = {
    maxmemory-policy = "allkeys-lru"
    timeout          = "300"
  }
  
  replica_configuration {
    replica_configuration = true
  }
}

# Elasticsearch
resource "google_elasticsearch_domain" "search" {
  domain_name           = "talentsphere-${var.environment}"
  elasticsearch_version = "8.0"
  
  cluster_config {
    instance_type = "t3.small.elasticsearch"
    instance_count = 3
  }
  
  ebs_options {
    ebs_enabled = true
    volume_size = 100
    volume_type = "gp2"
  }
  
  vpc_options {
    subnet_ids         = [google_compute_subnetwork.subnet.id]
    security_group_ids = [google_security_group.es.id]
  }
}

# Object storage for media
resource "google_storage_bucket" "media" {
  name          = "talentsphere-${var.environment}-media"
  location      = var.region
  force_destroy = false
  
  versioning {
    enabled = true
  }
  
  uniform_bucket_level_access = true
  
  cors {
    origin          = ["https://talentsphere.com"]
    method          = ["GET", "HEAD", "DELETE"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }
}

# Outputs
output "kubernetes_cluster_name" {
  value = google_container_cluster.talentsphere.name
}

output "database_instance_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "redis_host" {
  value = google_redis_instance.cache.host
}
