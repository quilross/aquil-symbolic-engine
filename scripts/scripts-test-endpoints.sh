#!/bin/bash

# Test all Aquil API endpoints
# Verifies your deployment is working correctly

BASE_URL="https://signal-q.me"

echo "🧪 Testing Aquil Symbolic Engine API Endpoints"
echo "=============================================="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "$BASE_URL/api/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Trust Check-in
echo "2. Testing Trust Check-in..."
curl -s -X POST "$BASE_URL/api/trust/check-in" \
  -H "Content-Type: application/json" \
  -d '{
    "current_state": "I am feeling uncertain about trusting myself today but I want to grow",
    "trust_level": 5,
    "specific_situation": "Making an important decision about my career",
    "body_sensations": "Tension in my shoulders and chest feels tight"
  }' | jq '.message' || echo "❌ Trust check-in failed"
echo ""

# Test 3: Media Wisdom Extraction
echo "3. Testing Media Wisdom Extraction..."
curl -s -X POST "$BASE_URL/api/media/extract-wisdom" \
  -H "Content-Type: application/json" \
  -d '{
    "media_type": "movie",
    "title": "The Pursuit of Happyness",
    "your_reaction": "This movie really moved me. The main character never gave up on his dreams despite incredible challenges. It made me think about my own persistence and whether I trust myself enough to keep going when things get difficult.",
    "content_summary": "A story about perseverance, fatherhood, and believing in yourself against all odds"
  }' | jq '.message' || echo "❌ Media wisdom extraction failed"
echo ""

# Test 4: Somatic Session
echo "4. Testing Somatic Session..."
curl -s -X POST "$BASE_URL/api/somatic/session" \
  -H "Content-Type: application/json" \
  -d '{
    "body_state": "I feel tension in my neck and shoulders, and my breathing feels shallow",
    "emotions": "I am feeling anxious and a bit overwhelmed",
    "intention": "I want to connect with my body and find some calm"
  }' | jq '.message' || echo "❌ Somatic session failed"
echo ""

# Test 5: Wisdom Synthesis
echo "5. Testing Wisdom Synthesis..."
curl -s -X POST "$BASE_URL/api/wisdom/synthesize" \
  -H "Content-Type: application/json" \
  -d '{
    "life_situation": "I am at a crossroads in my life, considering a major career change",
    "specific_question": "Should I leave my stable job to pursue my passion project?",
    "frameworks_requested": ["human_design", "gene_keys", "somatic_wisdom"]
  }' | jq '.message' || echo "❌ Wisdom synthesis failed"
echo ""

# Test 6: Pattern Recognition
echo "6. Testing Pattern Recognition..."
curl -s -X POST "$BASE_URL/api/patterns/recognize" \
  -H "Content-Type: application/json" \
  -d '{
    "area_of_focus": "trust_building",
    "recent_experiences": "I have been doing trust check-ins and noticing I often doubt my first instincts",
    "recurring_themes": "I seem to always seek validation from others before making decisions"
  }' | jq '.message' || echo "❌ Pattern recognition failed"
echo ""

# Test 7: Standing Tall Practice
echo "7. Testing Standing Tall Practice..."
curl -s -X POST "$BASE_URL/api/standing-tall/practice" \
  -H "Content-Type: application/json" \
  -d '{
    "situation": "I have a presentation at work next week and I tend to make myself small in meetings",
    "fears_concerns": "I am worried people will judge me or think I do not belong",
    "desired_outcome": "I want to speak with confidence and take up my rightful space",
    "past_successes": "I did well presenting to my team last year when I prepared thoroughly"
  }' | jq '.message' || echo "❌ Standing tall practice failed"
echo ""

# Test 8: Daily Synthesis
echo "8. Testing Daily Synthesis..."
curl -s "$BASE_URL/api/wisdom/daily-synthesis" | jq '.message' || echo "❌ Daily synthesis failed"
echo ""

echo "🎉 API Testing Complete!"
echo ""
echo "✅ If all tests showed responses, your Aquil system is working correctly!"
echo ""
echo "🤖 Next Steps:"
echo "   1. Create your ChatGPT GPT using docs/CHATGPT_SETUP_GUIDE.md"
echo "   2. Start your first real session: 'Aquil, let's do a trust check-in'"
echo "   3. Check docs/API_DOCUMENTATION.md for detailed endpoint information"
echo ""