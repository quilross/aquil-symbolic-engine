#!/bin/bash

# Signal Q Smoke Test Script
# Tests the basic health and version endpoints

set -e

# Environment variables with defaults
BASE="${BASE:-https://signal_q.catnip-pieces1.workers.dev}"
TOKEN="${TOKEN:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Signal Q Smoke Test"
echo "Base URL: $BASE"
if [ -n "$TOKEN" ]; then
    echo "API Token: ${TOKEN:0:10}..." # Show only first 10 chars
else
    echo "API Token: Not provided"
fi
echo ""

# Check if API token is provided
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Error: TOKEN environment variable is required${NC}"
    echo "Example: export TOKEN=sq_live_xxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

# Test 1: Version endpoint (no auth required)
echo "📋 Testing GET /version (no auth)..."
VERSION_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE/version")
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
echo "🏥 Testing POST /actions/system_health (with Bearer auth)..."
HEALTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE/actions/system_health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed 's/HTTPSTATUS:[0-9]*$//')

if [ "$HEALTH_STATUS" != "200" ]; then
    echo -e "${RED}❌ Health endpoint failed with status $HEALTH_STATUS${NC}"
    echo "Response: $HEALTH_BODY"
    exit 1
fi

# Parse health response - new schema expects "status" field
HEALTH_STATUS_VALUE=$(echo "$HEALTH_BODY" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
if [ "$HEALTH_STATUS_VALUE" != "healthy" ]; then
    echo -e "${RED}❌ Health check failed - status is '$HEALTH_STATUS_VALUE' (expected 'healthy')${NC}"
    echo "Response: $HEALTH_BODY"
    exit 1
fi

echo -e "${GREEN}✅ Health endpoint OK (status: $HEALTH_STATUS_VALUE)${NC}"
echo ""

# Summary
echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
echo "✅ Version endpoint: $VERSION"
echo "✅ Health status: $HEALTH_STATUS_VALUE"
echo ""
echo "Signal Q API is healthy and responding correctly."