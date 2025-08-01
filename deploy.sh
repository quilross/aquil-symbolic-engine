#!/bin/bash

# Signal Q - Root Deploy Script
echo "🚀 Deploying Signal Q..."

# Run the deploy script from worker directory
cd "$(dirname "$0")/worker" && ./deploy.sh
