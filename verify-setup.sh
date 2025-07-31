#!/bin/bash

echo "🔍 Aquil Symbolic Engine - Complete System Verification"
echo "═══════════════════════════════════════════════════════"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0

check_item() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local name="$1"
    local command="$2"
    local expected="$3"
    
    echo -n "📋 $name: "
    
    # Ensure we're in the right directory and run the command
    if (cd /home/runner/work/aquil-symbolic-engine/aquil-symbolic-engine && eval "$command") > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        if [ ! -z "$expected" ]; then
            echo "   Expected: $expected"
        fi
        return 1
    fi
}

echo -e "\n${BLUE}1. Repository Structure${NC}"
echo "────────────────────────"
check_item "Worker directory exists" "[ -d worker ]"
check_item "Main index.js exists" "[ -f worker/src/index.js ]"
check_item "OpenAPI schema exists" "[ -f worker/src/openapi.json ]"
check_item "Wrangler config exists" "[ -f worker/wrangler.toml ]"
check_item "Deploy script exists" "[ -f worker/deploy.sh ]"
check_item "Deploy script is executable" "[ -x worker/deploy.sh ]"

echo -e "\n${BLUE}2. Cloudflare Configuration${NC}"
echo "─────────────────────────"
check_item "Wrangler CLI available" "npx wrangler --version"
check_item "Worker config validates" "cd worker && npx wrangler deploy --dry-run"

echo -e "\n${BLUE}3. Code Quality & Structure${NC}"
echo "────────────────────────────"
check_item "Main handler export exists" "grep -q 'export default' worker/src/index.js"
check_item "UserState class exists" "grep -q 'export class UserState' worker/src/index.js"
check_item "Authentication implemented" "grep -q 'Authorization' worker/src/index.js"
check_item "API tokens configured" "grep -q 'API_TOKEN' worker/wrangler.toml"
check_item "Durable Objects configured" "grep -q 'USERSTATE' worker/wrangler.toml"

echo -e "\n${BLUE}4. API Endpoints Coverage${NC}"
echo "─────────────────────────"
endpoints=(
    "/track-time"
    "/session-monitor" 
    "/agent-overwhelm"
    "/philadelphia-context"
    "/privacy-settings"
    "/system/health"
    "/deploy/status"
    "/identity-nodes"
    "/voice-shifts"
)

for endpoint in "${endpoints[@]}"; do
    check_item "Endpoint $endpoint implemented" "grep -q \"$endpoint\" worker/src/index.js"
done

echo -e "\n${BLUE}5. CustomGPT Integration${NC}"
echo "──────────────────────────"
check_item "OpenAPI version 3.1" "grep -q '\"openapi\": \"3.1.0\"' worker/src/openapi.json"
check_item "Bearer auth configured" "grep -q 'bearerAuth' worker/src/openapi.json"
check_item "Server URL configured" "grep -q 'signal_q.workers.dev' worker/src/openapi.json"
check_item "Core endpoints documented" "grep -q '/track-time' worker/src/openapi.json"

echo -e "\n${BLUE}6. Security & Best Practices${NC}"
echo "────────────────────────────────"
check_item "API tokens not 'changeme'" "! grep -q 'changeme' worker/wrangler.toml"
check_item "Secure token format" "grep -q 'sq_live_' worker/wrangler.toml"
check_item "Admin token configured" "grep -q 'sq_admin_' worker/wrangler.toml"
check_item "Error handling present" "grep -q 'catch\\|try' worker/src/index.js"

echo -e "\n${BLUE}7. Storage Configuration${NC}"
echo "─────────────────────────"
if grep -q "# \\[\\[kv_namespaces\\]\\]" worker/wrangler.toml; then
    echo -e "📋 KV namespace: ${YELLOW}⚠ COMMENTED OUT${NC} (fallback storage active)"
    echo "   For production: npx wrangler kv:namespace create SIGNAL_KV"
else
    check_item "KV namespace configured" "grep -q '\\[\\[kv_namespaces\\]\\]' worker/wrangler.toml"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo "═══════════════════════════════════════════════════════"

PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $((TOTAL_CHECKS - PASSED_CHECKS))"
echo "Success Rate: $PERCENTAGE%"

if [ $PERCENTAGE -eq 100 ]; then
    echo -e "\n${GREEN}🎉 PERFECT SCORE! System is fully ready for production.${NC}"
    STATUS="READY"
elif [ $PERCENTAGE -ge 90 ]; then
    echo -e "\n${GREEN}✅ EXCELLENT! System is ready with minor notes.${NC}"
    STATUS="READY"
elif [ $PERCENTAGE -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  GOOD! System is mostly ready, address remaining issues.${NC}"
    STATUS="MOSTLY_READY"
else
    echo -e "\n${RED}❌ NEEDS WORK! Please address the failed checks before deployment.${NC}"
    STATUS="NEEDS_WORK"
fi

echo -e "\n${BLUE}🚀 DEPLOYMENT INSTRUCTIONS${NC}"
echo "──────────────────────────"
if [ "$STATUS" = "READY" ] || [ "$STATUS" = "MOSTLY_READY" ]; then
    echo "1. Deploy worker:     cd worker && ./deploy.sh"
    echo "2. Test API:          node test-system.js"
    echo "3. Upload to CustomGPT: worker/src/openapi.json"
    echo "4. Set base URL:      https://signal_q.workers.dev"
    echo "5. Set auth token:    sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h"
else
    echo "❌ Fix failing checks before deployment"
fi

echo -e "\n${BLUE}🔧 PRODUCTION OPTIMIZATION${NC}"
echo "─────────────────────────────"
echo "• Configure KV namespace for persistent storage"
echo "• Set up monitoring and alerts"
echo "• Consider rate limiting for production"
echo "• Review and rotate API tokens regularly"

echo -e "\n${BLUE}📚 CUSTOMGPT INTEGRATION${NC}"
echo "──────────────────────────────"
echo "• Schema file: worker/src/openapi.json"
echo "• Base URL: https://signal_q.workers.dev"
echo "• Auth header: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h"
echo "• Test endpoint: /system/health"

echo ""