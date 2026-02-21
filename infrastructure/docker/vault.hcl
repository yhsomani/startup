storage "file" {
  path = "/vault/file"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"
  tls_disable = "true"
}

disable_mlock = true

ui = true

service_registration "kubernetes" {}

telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}
