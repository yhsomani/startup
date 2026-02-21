path "secret/data/talentsphere/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/talentsphere/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/data/talentsphere/database" {
  capabilities = ["read"]
}

path "secret/data/talentsphere/jwt" {
  capabilities = ["read"]
}

path "sys/health" {
  capabilities = ["read"]
}
