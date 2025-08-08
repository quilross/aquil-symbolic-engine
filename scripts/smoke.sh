#!/bin/bash

# Signal Q Smoke Test Script
# Tests the basic health and version endpoints

set -e

# Environment variables with defaults
SIGNALQ_BASE_URL="${SIGNALQ_BASE_URL:-https://signal_q.catnip-pieces1.workers.dev}"
SIGNALQ_API_TOKEN="${SIGNALQ_API_TOKEN:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Signal Q Smoke Test"
echo "Base URL: $SIGNALQ_BASE_URL"
echo "API Token: ${SIGNALQ_API_TOKEN:0:10}..." # Show only first 10 chars
echo ""

# Check if API token is provided
if [ -z "$SIGNALQ_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: SIGNALQ_API_TOKEN environment variable is required${NC}"
    echo "Example: export SIGNALQ_API_TOKEN=sq_live_xxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

# Test 1: Version endpoint (no auth required)
echo "📋 Testing GET /version (no auth)..."
VERSION_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$SIGNALQ_BASE_URL/version")
VERSION_STATUS=$(echo "$VERSION_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
VERSION_BODY=$(echo "$VERSION_RESPONSE" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$VERSION_STATUS" != "200" ]; then
    echo -e "${RED}❌ Version endpoint failed with status $VERSION_STATUS${NC}"
    echo "Response: $VERSION_BODY"
    exit 1
fi

# Parse version response
VERSION=$(echo "$VERSION_BODY" | grep -o '"version":"[^"]*' | cut -d'"' -f4)
if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Version endpoint returned invalid JSON${NC}"
    echo "Response: $VERSION_BODY"
    exit 1
fi

echo -e "${GREEN}✅ Version endpoint OK (version: $VERSION)${NC}"
echo ""

# Test 2: Health endpoint (requires auth)
echo "🏥 Testing GET /system/health (with Bearer auth)..."
HEALTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "Authorization: Bearer $SIGNALQ_API_TOKEN" \
    "$SIGNALQ_BASE_URL/system/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$HEALTH_STATUS" != "200" ]; then
    echo -e "${RED}❌ Health endpoint failed with status $HEALTH_STATUS${NC}"
    echo "Response: $HEALTH_BODY"
    exit 1
fi

# Parse health response
OVERALL_STATUS=$(echo "$HEALTH_BODY" | grep -o '"overall":"[^"]*' | cut -d'"' -f4)
if [ "$OVERALL_STATUS" != "healthy" ]; then
    echo -e "${RED}❌ Health check failed - overall status is '$OVERALL_STATUS' (expected 'healthy')${NC}"
    echo "Response: $HEALTH_BODY"
    exit 1
fi

echo -e "${GREEN}✅ Health endpoint OK (overall: $OVERALL_STATUS)${NC}"
echo ""

# Summary
echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
echo "✅ Version endpoint: $VERSION"
echo "✅ Health status: $OVERALL_STATUS"
echo ""
echo "Signal Q API is healthy and responding correctly."