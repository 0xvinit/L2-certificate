#!/bin/bash

# Deployment script for Arbitrum Sepolia
# Usage: ./deploy.sh

set -e

echo "=========================================="
echo "CertificateRegistry Deployment Script"
echo "Network: Arbitrum Sepolia"
echo "=========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with ISSUER and PRIVATE_KEY"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$ISSUER" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "Error: ISSUER or PRIVATE_KEY not set in .env file"
    exit 1
fi

echo "Building contracts..."
forge build

echo ""
echo "Deploying to Arbitrum Sepolia..."
echo "Issuer: $ISSUER"
echo ""

# Deploy using the RPC endpoint from foundry.toml
forge script script/Deploy.s.sol:Deploy \
    --rpc-url arbitrum_sepolia \
    --broadcast \
    --verify \
    -vvvv

echo ""
echo "=========================================="
echo "Deployment completed!"
echo "=========================================="

