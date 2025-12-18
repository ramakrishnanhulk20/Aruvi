#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Aruvi to Vercel with environment variables

.DESCRIPTION
    This script helps configure and deploy Aruvi to Vercel by:
    1. Setting up required environment variables
    2. Choosing between USDC or xUSD contract system
    3. Deploying to Vercel

.PARAMETER ContractSystem
    Choose "usdc" or "xusd" contract system (default: usdc)

.PARAMETER Production
    Deploy to production (default: preview)

.EXAMPLE
    .\deploy-vercel.ps1 -ContractSystem usdc
    .\deploy-vercel.ps1 -ContractSystem xusd -Production
#>

param(
    [ValidateSet("usdc", "xusd")]
    [string]$ContractSystem = "usdc",
    
    [switch]$Production
)

# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Color, [string]$Message)
    Write-Host "${Color}${Message}${Reset}"
}

Write-ColorOutput $Blue "🚀 Aruvi Vercel Deployment Script"
Write-ColorOutput $Blue "=================================="
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-ColorOutput $Red "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
}

# Load contract addresses based on system choice
$envFile = if ($ContractSystem -eq "usdc") { "contracts/.env.usdc" } else { "contracts/.env.xusd" }

if (-not (Test-Path $envFile)) {
    Write-ColorOutput $Red "❌ Contract environment file not found: $envFile"
    exit 1
}

Write-ColorOutput $Green "✓ Using $($ContractSystem.ToUpper()) contract system"
Write-Host ""

# Parse env file
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim() -replace '^["'']|["'']$', ''
        $envVars[$key] = $value
    }
}

# Required environment variables
$requiredVars = @{
    "NEXT_PUBLIC_CHAIN_ID" = "11155111"
    "NEXT_PUBLIC_RELAYER_URL" = "https://relayer.testnet.zama.org"
    "NEXT_PUBLIC_XUSD_ADDRESS" = $envVars["XUSD_ADDRESS"]
    "NEXT_PUBLIC_PAYMENT_GATEWAY_ADDRESS" = $envVars["PAYMENT_GATEWAY_ADDRESS"]
    "NEXT_PUBLIC_PRODUCT_REGISTRY_ADDRESS" = $envVars["PRODUCT_REGISTRY_ADDRESS"]
    "NEXT_PUBLIC_REFUND_MANAGER_ADDRESS" = $envVars["REFUND_MANAGER_ADDRESS"]
    "NEXT_PUBLIC_USDC_ADDRESS" = $envVars["USDC_ADDRESS"]
}

# Prompt for user-specific variables
Write-ColorOutput $Yellow "📝 Please provide the following configuration:"
Write-Host ""

$sepoliaRpc = Read-Host "Sepolia RPC URL (e.g., https://sepolia.infura.io/v3/YOUR_KEY)"
if ([string]::IsNullOrWhiteSpace($sepoliaRpc)) {
    Write-ColorOutput $Red "❌ Sepolia RPC URL is required"
    exit 1
}
$requiredVars["NEXT_PUBLIC_SEPOLIA_RPC"] = $sepoliaRpc

$walletConnectId = Read-Host "WalletConnect Project ID (get from https://cloud.walletconnect.com)"
if ([string]::IsNullOrWhiteSpace($walletConnectId)) {
    Write-ColorOutput $Red "❌ WalletConnect Project ID is required"
    exit 1
}
$requiredVars["NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"] = $walletConnectId

$jwtSecret = Read-Host "JWT Secret (press Enter to generate random)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    # Generate random JWT secret
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    Write-ColorOutput $Green "✓ Generated random JWT secret"
}
$requiredVars["JWT_SECRET"] = $jwtSecret

Write-Host ""
Write-ColorOutput $Blue "📋 Environment Variables to be set:"
Write-Host ""
foreach ($key in $requiredVars.Keys | Sort-Object) {
    $displayValue = if ($key -eq "JWT_SECRET") { "***hidden***" } else { $requiredVars[$key] }
    Write-Host "  $key = $displayValue"
}
Write-Host ""

$confirm = Read-Host "Continue with deployment? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-ColorOutput $Yellow "⚠️  Deployment cancelled"
    exit 0
}

# Set environment variables in Vercel
Write-ColorOutput $Blue "📤 Setting environment variables in Vercel..."
Write-Host ""

$scope = if ($Production) { "production" } else { "preview,development" }

foreach ($key in $requiredVars.Keys) {
    $value = $requiredVars[$key]
    Write-Host "Setting $key..."
    
    # Remove existing variable (ignore errors)
    vercel env rm $key $scope --yes 2>$null | Out-Null
    
    # Add new variable
    echo $value | vercel env add $key $scope
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $Red "❌ Failed to set $key"
    }
}

Write-Host ""
Write-ColorOutput $Green "✓ Environment variables configured"
Write-Host ""

# Deploy
Write-ColorOutput $Blue "🚀 Deploying to Vercel..."
Write-Host ""

Push-Location frontend

if ($Production) {
    vercel --prod
} else {
    vercel
}

Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-ColorOutput $Green "✓ Deployment successful!"
    Write-Host ""
    Write-ColorOutput $Yellow "📝 Next steps:"
    Write-Host "  1. Verify deployment at the URL shown above"
    Write-Host "  2. Test wallet connection"
    Write-Host "  3. Test wrap/unwrap functionality"
    Write-Host "  4. Test payment flow"
    Write-Host ""
} else {
    Write-ColorOutput $Red "❌ Deployment failed"
    exit 1
}
