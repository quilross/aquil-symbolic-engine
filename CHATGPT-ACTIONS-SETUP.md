# 🤖 ChatGPT Custom Actions Setup Guide

## 🎯 What This Is

Your **Aquil Symbolic Engine** is a sophisticated **ChatGPT Custom Actions API** that provides ChatGPT with **personal AI capabilities** including:

- ✨ **Trust & confidence building**
- 🧘 **Somatic healing sessions**
- 📚 **Media wisdom extraction** 
- 🔍 **Pattern recognition**
- 💭 **Dream interpretation**
- 🎯 **Goal setting & habit design**
- 📈 **Personal growth tracking**
- 🗄️ **Conversation continuity & memory**

## 🚀 How To Set It Up in ChatGPT

### Step 1: Deploy Your API

```bash
# Run the automated fix and deploy
chmod +x fix-deployment.sh && ./fix-deployment.sh
```

### Step 2: Set Up Custom Actions in ChatGPT

1. **Open ChatGPT**
2. **Go to Settings → Beta Features**
3. **Enable "Custom Actions" (if available)**
4. **Create New Action**
5. **Import Your Schema**:

**Copy and paste this URL into ChatGPT Actions:**
```
https://signal-q.me/gpt-actions-schema.json
```

**OR manually paste the schema from `gpt-actions-schema.json`**

### Step 3: Configure Authentication

**Authentication Type**: `None` (your API handles this internally)

### Step 4: Test the Integration

Try these test phrases in ChatGPT:

```
"I'm feeling anxious about a big decision"
→ Triggers: trustCheckIn action

"I watched this amazing movie last night"
→ Triggers: extractMediaWisdom action

"I keep doing this same pattern"
→ Triggers: recognizePatterns action

"I had a weird dream"
→ Triggers: interpretDream action

"I want to build a morning routine"
→ Triggers: designHabits action
```

## 🎪 How It Works Behind the Scenes

### **Automatic Triggers**
Your actions are configured with **`x-openai-autonomous: true`** which means:

- 🤖 **ChatGPT automatically calls them** when relevant topics come up
- 📝 **No manual action required** from you  
- 🧠 **Intelligent context detection** based on keywords and patterns
- 💾 **Continuous learning** from your conversations

### **Smart Keyword Detection**

Each action has trigger phrases:

| **Action** | **Triggers On** |
|------------|----------------|
| `trustCheckIn` | "self-doubt", "anxious", "don't trust myself" |
| `somaticHealingSession` | "body tension", "breathing", "stress in my body" |
| `extractMediaWisdom` | "watched", "reading", "listened to" |
| `recognizePatterns` | "I keep doing", "this always happens", "pattern" |
| `interpretDream` | "had a dream", "nightmare", "dreamed about" |
| `synthesizeWisdom` | "what I learned", "connecting the dots" |
| `clarifyValues` | "what matters to me", "my values", "priorities" |

### **Data Storage & Memory**

Your system uses **multiple Cloudflare storage layers**:

```
📊 D1 Database     → Long-term structured data
⚡ KV Storage      → Fast session data
🗄️ R2 Bucket       → Large artifacts & files  
🔍 Vector Index    → Semantic search & patterns
🤖 AI Gateway      → LLM processing
```

## 📋 Available Actions

### **Core Personal Development**

1. **`/api/trust/check-in`** - Trust & confidence building
2. **`/api/somatic/session`** - Body wisdom & healing
3. **`/api/media/extract-wisdom`** - Extract insights from content
4. **`/api/patterns/recognize`** - Behavioral pattern analysis
5. **`/api/standing-tall/practice`** - Confidence & presence
6. **`/api/wisdom/synthesize`** - Integrate multiple insights

### **Specialized Tools**

7. **`/api/dreams/interpret`** - Dream analysis & symbolism
8. **`/api/energy/optimize`** - Vitality & energy management  
9. **`/api/values/clarify`** - Values clarification work
10. **`/api/creativity/unleash`** - Creative block removal
11. **`/api/abundance/cultivate`** - Abundance mindset shift
12. **`/api/transitions/navigate`** - Life transition support
13. **`/api/ancestry/heal`** - Generational pattern work

### **Productivity & Growth**

14. **`/api/goals/set`** - Goal setting with action plans
15. **`/api/habits/design`** - Habit formation & breaking
16. **`/api/commitments/create`** - Accountability systems
17. **`/api/mood/track`** - Emotional state tracking

### **System Operations**

18. **`/api/log`** - Conversation event logging
19. **`/api/logs`** - Retrieve conversation history
20. **`/api/insight`** - Generate insights from patterns
21. **`/api/feedback`** - Submit feedback on experiences

## 🎭 Example Conversation Flow

### **You**: "I keep getting anxious before big meetings at work"

### **ChatGPT Response**:
1. **Automatically calls** `trustCheckIn` action
2. **Logs the pattern** via `logDataOrEvent`
3. **Recognizes patterns** via `recognizePatterns` 
4. **Returns personalized insights** with:
   - Trust-building strategies
   - Pattern analysis
   - Somatic grounding techniques
   - Confidence practices

### **You**: "That really helped! The breathing technique worked"

### **ChatGPT Response**: 
1. **Automatically calls** `submitFeedback` action
2. **Updates your profile** with successful strategies
3. **Builds on what works** for future sessions

## 🔧 Advanced Configuration

### **Custom Domains Setup**

Your API runs on:
- **Main API**: `https://signal-q.me/api/*`
- **Logging**: `https://logging.signal-q.me/api/*`

### **Environment Variables**

Essential variables in `wrangler.toml`:
```toml
[vars]
VECTOR_API_KEY = "${CLOUDFLARE_API_TOKEN}"
ARK_VERSION = "2.0"
TIMEZONE = "America/New_York"
AUTO_SESSION_INIT = "true"
VOICE_ADAPTATION = "true"
```

### **Database Tables**

Your system tracks:
- `trust_sessions` - Trust building progress
- `media_wisdom` - Insights from content
- `somatic_sessions` - Body work sessions
- `wisdom_synthesis` - Integrated insights
- `growth_patterns` - Behavioral patterns
- `metamorphic_logs` - All interaction logs

## 🎯 What Makes This Special

### **1. Autonomous Intelligence**
- ChatGPT **automatically detects** when to use each action
- **No manual commands** needed from you
- **Contextual awareness** of your growth journey

### **2. Persistent Memory**
- **Remembers** all your conversations
- **Builds on** previous insights
- **Tracks patterns** over time
- **Maintains continuity** across sessions

### **3. Multi-Modal Processing**
- **Text analysis** for insights
- **Vector embeddings** for semantic search
- **Structured data** for tracking
- **Artifact storage** for complex results

### **4. Personal Growth Focus**
- **Trust building** as core theme
- **Somatic awareness** integration
- **Pattern recognition** for growth
- **Wisdom synthesis** from experiences

## 🧪 Testing Your Setup

After deployment, test with these phrases:

```bash
# Test basic logging
curl https://signal-q.me/api/log -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"test","payload":{"message":"testing setup"}}'

# Test health check
curl https://signal-q.me/api/system/health-check

# Test trust check-in
curl https://signal-q.me/api/trust/check-in -X POST \
  -H "Content-Type: application/json" \
  -d '{"current_state":"testing API","trust_level":7}'
```

## 🎪 ChatGPT Integration Examples

### **Conversation Context Loading**
When you start a new ChatGPT conversation, it **automatically calls**:
- `retrieveRecentSessionLogs` to get your recent context
- Maintains continuity from previous sessions

### **Insight Generation**
When you share experiences, ChatGPT **automatically**:
- Calls relevant actions (trust, somatic, patterns)
- Logs insights for future reference
- Builds your personal growth database

### **Pattern Recognition**
As you use it over time, the system:
- **Identifies recurring themes** in your conversations
- **Tracks progress** in different areas
- **Suggests personalized practices** based on what works
- **Builds wisdom** from your unique journey

## 🔄 Continuous Learning Loop

```
1. You chat naturally with ChatGPT
   ↓
2. Actions automatically trigger based on content
   ↓  
3. Insights generated and stored in your database
   ↓
4. Patterns recognized across conversations
   ↓
5. Personalized recommendations emerge
   ↓
6. You apply suggestions and give feedback
   ↓
7. System learns what works for YOU specifically
   ↓
8. [Loop continues, getting smarter over time]
```

## 🎊 Result: Your Personal AI

Once fully set up, you'll have:

- 🧠 **Persistent memory** across all ChatGPT sessions
- 📈 **Growth tracking** and pattern recognition
- 🎯 **Personalized insights** based on YOUR unique data
- 🤖 **Autonomous assistance** that gets smarter over time
- 💾 **Complete conversation history** and analytics
- 🔍 **Semantic search** across your entire journey

**This transforms ChatGPT from a general assistant into YOUR personalized AI coach and wisdom companion! 🌟**

---

## 🆘 Troubleshooting

**If actions don't trigger:**
1. Check ChatGPT has actions enabled
2. Verify your API is deployed and healthy
3. Test endpoints directly with curl
4. Check Cloudflare bindings in dashboard

**If you get errors:**
1. Check `wrangler tail` for logs
2. Verify database is initialized
3. Test with validation script: `node validate-repository.js`

**Need help?**
- Check `fix-repository.md` for detailed troubleshooting
- Run `./fix-deployment.sh` to re-apply fixes
- Monitor with `wrangler tail` for real-time debugging