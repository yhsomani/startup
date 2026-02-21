param(
    [switch]$Unseal,
    [switch]$Init,
    [string]$TokenFile = "$PSScriptRoot\..\infrastructure\docker\vault-keys\vault-token.txt"
)

$ErrorActionPreference = "Stop"
$VAULT_ADDR = "http://localhost:8200"

function Initialize-Vault {
    Write-Host "Initializing Vault..." -ForegroundColor Cyan
    
    $initOutput = docker run --rm `
        -e VAULT_ADDR=$VAULT_ADDR `
        hashicorp/vault:1.15 `
        vault operator init -key-shares=5 -key-threshold=3 -format=json
    
    $initJson = $initOutput | ConvertFrom-Json
    
    $keysDir = "$PSScriptRoot\..\infrastructure\docker\vault-keys"
    if (!(Test-Path $keysDir)) {
        New-Item -ItemType Directory -Path $keysDir -Force | Out-Null
    }
    
    Write-Host "`nUnseal Keys (save these securely!):" -ForegroundColor Yellow
    for ($i = 0; $i -lt 5; $i++) {
        $keyPath = "$keysDir\unseal-key-$i.txt"
        $initJson.unseal_keys_b64[$i] | Set-Content -Path $keyPath
        Write-Host "  Key $i : $($initJson.unseal_keys_b64[$i])"
    }
    
    Write-Host "`nRoot Token:" -ForegroundColor Yellow
    $initJson.root_token | Set-Content -Path $TokenFile
    Write-Host "  Saved to: $TokenFile"
    
    return $initJson
}

function Unseal-Vault {
    Write-Host "Unsealing Vault..." -ForegroundColor Cyan
    
    $keysDir = "$PSScriptRoot\..\infrastructure\docker\vault-keys"
    $keys = @()
    
    for ($i = 0; $i -lt 3; $i++) {
        $keyPath = "$keysDir\unseal-key-$i.txt"
        if (Test-Path $keyPath) {
            $keys += (Get-Content $keyPath | Select-Object -First 1)
        }
    }
    
    if ($keys.Count -eq 0) {
        Write-Host "No unseal keys found. Please initialize Vault first." -ForegroundColor Red
        return
    }
    
    foreach ($key in $keys) {
        docker run --rm `
            -e VAULT_ADDR=$VAULT_ADDR `
            hashicorp/vault:1.15 `
            vault operator unseal $key
    }
    
    Write-Host "Vault unsealed successfully!" -ForegroundColor Green
}

function Check-VaultStatus {
    $status = docker run --rm `
        -e VAULT_ADDR=$VAULT_ADDR `
        hashicorp/vault:1.15 `
        vault status -format=json 2>$null
    
    if ($status) {
        $statusJson = $status | ConvertFrom-Json
        Write-Host "Vault Status:" -ForegroundColor Cyan
        Write-Host "  Sealed: $($statusJson.sealed)"
        Write-Host "  Initialized: $($statusJson.initialized)"
    }
}

if ($Init) {
    Initialize-Vault
}
elseif ($Unseal) {
    Unseal-Vault
}
else {
    Check-VaultStatus
    Write-Host "`nUsage:" -ForegroundColor Yellow
    Write-Host "  -Init     Initialize Vault (first time only)"
    Write-Host "  -Unseal   Unseal Vault after restart"
}
