#!/bin/bash

# Aquil Symbolic Engine - Comprehensive Endpoint Testing Script
# Tests all 30 endpoints defined in the OpenAPI schema

set -e  # Exit on any error

echo "🧪 Aquil Symbolic Engine - Comprehensive Endpoint Testing"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-https://signal-q.me}"
VERBOSE="${2:-false}"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

echo -e "${BLUE}Testing against: ${BASE_URL}${NC}"
echo -e "${BLUE}Verbose mode: ${VERBOSE}${NC}"
echo ""

# Test helper function
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local operation_id="$3"
    local payload="$4"
    local expected_status="${5:-200}"
    
    TEST_COUNT=$((TEST_COUNT + 1))
    
    echo -n "${TEST_COUNT}. Testing ${operation_id} (${method} ${endpoint})... "
    
    local curl_cmd="curl -s -w '%{http_code}' -X ${method} '${BASE_URL}${endpoint}'"
    
    # Add headers
    curl_cmd="${curl_cmd} -H 'Content-Type: application/json'"
    curl_cmd="${curl_cmd} -H 'User-Agent: AquilEndpointTester/1.0'"
    
    # Add payload if provided
    if [ -n "$payload" ]; then
        curl_cmd="${curl_cmd} -d '${payload}'"
    fi
    
    # Execute the request
    local response
    local http_code
    
    if [ "$VERBOSE" = "true" ]; then
        echo ""
        echo "  Command: ${curl_cmd}"
    fi
    
    response=$(eval "$curl_cmd" 2>/dev/null)
    
    # Extract HTTP status code (last 3 characters)
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS (${http_code})${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
        
        if [ "$VERBOSE" = "true" ] && [ -n "$response_body" ]; then
            echo "  Response: ${response_body:0:200}..."
        fi
    else
        echo -e "${RED}❌ FAIL (${http_code}, expected ${expected_status})${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        
        if [ -n "$response_body" ]; then
            echo "  Response: ${response_body:0:200}..."
        fi
    fi
    
    sleep 0.5  # Rate limiting
}

# System endpoints
echo -e "${BLUE}=== System Endpoints ===${NC}"
test_endpoint "POST" "/api/session-init" "sessionInit" '{}'
test_endpoint "GET" "/api/system/health-check" "systemHealthCheck" ""
test_endpoint "GET" "/api/system/readiness" "systemReadiness" ""

# Logging endpoints
echo -e "${BLUE}=== Logging Endpoints ===${NC}"
test_endpoint "POST" "/api/log" "logDataOrEvent" '{"type":"test","data":{"test":true}}'
test_endpoint "GET" "/api/logs/latest?limit=5" "getLatestLogs" ""
test_endpoint "POST" "/api/logs/retrieve" "retrieveLogsOrDataEntries" '{"limit":10}'
test_endpoint "POST" "/api/logs/retrieval-meta" "updateRetrievalMeta" '{"timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'

# Data Operations endpoints
echo -e "${BLUE}=== Data Operations Endpoints ===${NC}"
test_endpoint "GET" "/api/kv/get?key=test" "getKVStoredData" ""
test_endpoint "POST" "/api/kv/log" "storeInKV" '{"key":"test","value":"test_data"}'
test_endpoint "POST" "/api/d1/query" "queryD1Database" '{"query":"SELECT 1 as test"}'
test_endpoint "POST" "/api/vectorize/query" "ragMemoryConsolidation" '{"query":"test query","limit":5}'
test_endpoint "POST" "/api/vectorize/upsert" "upsertVectors" '{"vectors":[{"id":"test","values":[0.1,0.2,0.3]}]}'

# Personal Development endpoints
echo -e "${BLUE}=== Personal Development Endpoints ===${NC}"
test_endpoint "POST" "/api/discovery/generate-inquiry" "generateDiscoveryInquiry" '{"context":"growth"}'
test_endpoint "POST" "/api/trust/check-in" "trustCheckIn" '{"current_state":"open"}'
test_endpoint "POST" "/api/somatic/session" "somaticHealingSession" '{"focus_area":"relaxation"}'
test_endpoint "POST" "/api/media/extract-wisdom" "extractMediaWisdom" '{"media_type":"book","title":"Test Book","personal_reaction":"Very insightful"}'
test_endpoint "POST" "/api/patterns/recognize" "recognizePatterns" '{"data":"test pattern data"}'
test_endpoint "POST" "/api/standing-tall/practice" "standingTallPractice" '{"intention":"confidence"}'
test_endpoint "POST" "/api/wisdom/synthesize" "synthesizeWisdom" '{"inputs":["wisdom1","wisdom2"]}'
test_endpoint "GET" "/api/wisdom/daily-synthesis" "getDailySynthesis" ""
test_endpoint "POST" "/api/energy/optimize" "optimizeEnergy" '{"current_energy":7}'
test_endpoint "POST" "/api/values/clarify" "clarifyValues" '{"current_values":["growth","authenticity"]}'
test_endpoint "POST" "/api/creativity/unleash" "unleashCreativity" '{"creative_block":"perfectionism"}'
test_endpoint "POST" "/api/abundance/cultivate" "cultivateAbundance" '{"mindset":"growth"}'
test_endpoint "POST" "/api/transitions/navigate" "navigateTransition" '{"transition_type":"career"}'
test_endpoint "POST" "/api/ancestry/heal" "healAncestry" '{"focus":"family_patterns"}'

# Goals and Habits endpoints
echo -e "${BLUE}=== Goals and Habits Endpoints ===${NC}"
test_endpoint "POST" "/api/goals/set" "setPersonalGoals" '{"goal":"test goal","timeframe":"30d"}'
test_endpoint "POST" "/api/habits/design" "designHabits" '{"habit":"daily_meditation"}'
test_endpoint "POST" "/api/commitments/create" "manageCommitment" '{"action":"create","commitment":"daily practice"}'
test_endpoint "GET" "/api/commitments/active" "listActiveCommitments" ""

# Utility endpoints  
echo -e "${BLUE}=== Utility Endpoints ===${NC}"
test_endpoint "POST" "/api/feedback" "submitFeedback" '{"content":"Great system!","rating":5}'
test_endpoint "POST" "/api/dreams/interpret" "interpretDream" '{"dream":"I was flying over mountains"}'
test_endpoint "POST" "/api/mood/track" "trackMood" '{"mood":"positive","energy_level":8}'
test_endpoint "POST" "/api/ritual/auto-suggest" "autoSuggestRitual" '{"context":"morning"}'
test_endpoint "POST" "/api/contracts/create" "createTransformationContract" '{"commitment":"30-day growth challenge"}'
test_endpoint "GET" "/api/monitoring/metrics" "getMetrics" ""
test_endpoint "POST" "/api/socratic/question" "socraticQuestioning" '{"topic":"success"}'
test_endpoint "POST" "/api/coaching/comb-analysis" "coachingCombAnalysis" '{"situation":"career transition"}'

# Test a commitment progress endpoint (dynamic ID)
echo -e "${BLUE}=== Dynamic Endpoints ===${NC}"
test_endpoint "GET" "/api/commitments/test123/progress" "trackCommitmentProgress" ""

echo ""
echo -e "${BLUE}=== TEST SUMMARY ===${NC}"
echo "Total tests: ${TEST_COUNT}"
echo -e "Passed: ${GREEN}${PASS_COUNT}${NC}"
echo -e "Failed: ${RED}${FAIL_COUNT}${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All endpoints are working correctly!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  ${FAIL_COUNT} endpoints have issues${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Check the failing endpoints in your code"
    echo "  2. Ensure all router modules are properly imported"
    echo "  3. Verify database and binding configurations"
    echo "  4. Check Cloudflare Worker logs: wrangler tail"
    exit 1
fi
