#!/bin/bash

# Aquil Symbolic Engine - Database Initialization Script
# This script initializes the D1 database with the required schema

set -e  # Exit on any error

echo "🚀 Initializing Aquil D1 Database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI is not installed${NC}"
    echo "Please install with: npm install -g wrangler"
    exit 1
fi

# Check if schema.sql exists
if [ ! -f "schema.sql" ]; then
    echo -e "${RED}❌ Error: schema.sql not found${NC}"
    echo "Please run this script from the repository root directory"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Executing database schema...${NC}"

# Initialize the database with schema
if wrangler d1 execute AQUIL_DB --file=schema.sql --env production; then
    echo -e "${GREEN}✅ Database schema executed successfully${NC}"
else
    echo -e "${RED}❌ Failed to execute database schema${NC}"
    echo "This might be because the tables already exist, which is okay."
    echo "Continuing with verification..."
fi

echo -e "${BLUE}📋 Step 2: Verifying database tables...${NC}"

# List of tables that should exist after schema execution
tables=(
    "user_profile"
    "logs" 
    "metamorphic_logs"
    "retrieval_meta"
    "commitments"
    "goals"
    "habits"
    "values"
    "dreams"
    "insights"
    "patterns"
    "trust_scores"
    "somatic_sessions"
    "ritual_suggestions"
    "media_wisdom"
    "contracts"
)

# Verify each table exists
for table in "${tables[@]}"; do
    echo -n "  Checking table '$table'... "
    
    if wrangler d1 execute AQUIL_DB --command="SELECT COUNT(*) FROM $table" --env production --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        echo -e "    ${YELLOW}⚠️  Table '$table' might not exist or has issues${NC}"
    fi
done

echo -e "${BLUE}📋 Step 3: Testing database connectivity...${NC}"

# Test basic database operations
echo -n "  Testing SELECT operation... "
if wrangler d1 execute AQUIL_DB --command="SELECT 1 as test" --env production --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo -e "    ${YELLOW}⚠️  Database connectivity issues detected${NC}"
fi

echo -n "  Testing INSERT/DELETE operations... "
test_id=$(uuidgen 2>/dev/null || echo "test-$(date +%s)")
if wrangler d1 execute AQUIL_DB --command="INSERT INTO logs (id, type, timestamp, storedIn) VALUES ('$test_id', 'test', '$(date -u +%Y-%m-%dT%H:%M:%SZ)', 'D1'); DELETE FROM logs WHERE id = '$test_id';" --env production --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${RED}❌${NC}"
    echo -e "    ${YELLOW}⚠️  Database write operations might have issues${NC}"
fi

echo -e "${BLUE}📋 Step 4: Checking KV namespace connectivity...${NC}"

# Test KV connectivity (if possible)
echo -n "  Testing KV binding AQUIL_MEMORIES... "
if wrangler kv:key put "health-check" "ok" --binding AQUIL_MEMORIES --env production --quiet > /dev/null 2>&1; then
    wrangler kv:key delete "health-check" --binding AQUIL_MEMORIES --env production --quiet > /dev/null 2>&1
    echo -e "${GREEN}✅${NC}"
else
    echo -e "${YELLOW}⚠️  (might be expected if KV not accessible via CLI)${NC}"
fi

echo -e "${BLUE}📋 Step 5: Database initialization summary...${NC}"

# Show database stats
echo "  📊 Getting database statistics:"
wrangler d1 execute AQUIL_DB --command="SELECT 
  (SELECT COUNT(*) FROM logs) as log_count,
  (SELECT COUNT(*) FROM metamorphic_logs) as metamorphic_count,
  (SELECT COUNT(*) FROM user_profile) as profile_count" --env production 2>/dev/null || echo "    Unable to get stats (database might be empty)"

echo -e "${GREEN}🎉 Database initialization complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Test the health endpoint: curl https://signal-q.me/api/system/health-check"
echo "   2. Test session init: curl -X POST https://signal-q.me/api/session-init"
echo "   3. Deploy with: wrangler deploy"
echo ""
echo -e "${BLUE}🔧 If you encounter issues:${NC}"
echo "   • Check Cloudflare Dashboard → Workers → aquil-prod"
echo "   • Verify all bindings are properly configured"
echo "   • Check logs with: wrangler tail"
echo ""
