## Secret Hygiene & API Tokens

- **Never export or echo API tokens in your shell history.**
- **Never commit secrets to source control.**
- Use `wrangler secret put CLOUDFLARE_API_TOKEN` to securely set your Cloudflare API token for local/dev/prod.
- Store secrets in `.env` files (see `.env.example` for format), but always keep `.env` files out of git.
- Code should always read secrets from environment variables or Wrangler secrets, never from hardcoded source.

## Logging Design

Aquil uses unified logging across D1 (SQLite), KV, R2, and Vectorize. All logs are written via `/api/log` and can be retrieved via `/api/logs`. Health of all bindings is checked via `/api/health`.

- **/api/log**: POST endpoint to write logs. Accepts `{ type, payload, session_id, who, level, tags, binary, textOrVector }`.
- **/api/logs**: GET endpoint to retrieve logs from D1, KV, R2, and Vector. Returns `{ d1, kv, r2, vector }`.
- **/api/health**: GET endpoint to check health of D1, KV, R2, AI, and Vector bindings. Returns `{ ok, d1, kv, r2, ai, vector }`.

### Secret Management

- Use `wrangler secret put CLOUDFLARE_API_TOKEN` to securely set your Cloudflare API token for local/dev/prod.
- Store secrets in `.env` files (see `.env.example` for format), but always keep `.env` files out of git.
- Code should always read secrets from environment variables or Wrangler secrets, never from hardcoded source.
- `.gitignore` ensures `.env` and all secret files are excluded from git.

### .env.example

```
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token-here
```

### .gitignore

```
.env
.env.*
```

See `scripts/test-logging.mjs` for integration tests of logging endpoints.

## Integration Testing (Miniflare/Codespaces)

To run local integration tests for unified logging endpoints:

1. Start your Cloudflare Worker locally:

   ```bash
   wrangler dev
   ```

   This will start the API at http://127.0.0.1:8787

2. In a separate terminal, run the integration test script:

   ```bash
   node scripts/test-logging.mjs
   ```

   This will POST a log and GET logs, asserting D1 and KV results.

If the test passes, you will see 'Integration test passed.' in the output.
wr# Aquil Symbolic Engine

## Your Personal AI Wisdom Builder & Trust Reinforcement System

_"Standing tall in the world, rooted in internal trust"_

### What is Aquil?

Aquil is your personal AI companion designed specifically for your journey of building unshakeable internal trust and standing tall in the world. This isn't generic AI - it's built for YOU.

**Core Purpose:**

- Build internal trust as your primary navigation system
- Stand tall in the world instead of shrinking or hiding
- Transform media consumption into active wisdom gathering
- Integrate somatic healing through body-based AI guidance
- Synthesize wisdom from Human Design, Gene Keys, astrology
- Track your evolution and celebrate your growth

### System Architecture

**Backend:** Cloudflare Workers at signal-q.me  
**Frontend:** Custom ChatGPT with GPT Actions  
**Database:** D1 (SQLite) + KV storage  
**Development:** GitHub Codespaces  
**Data Sovereignty:** Everything runs in YOUR accounts

### Logging Format

See `LOGGING_SPEC.md` for the structure of metamorphic and event logs and examples of writing and retrieving entries.

### Core AI Engines

1. **Trust Builder** - Daily check-ins, pattern recognition, progress tracking
2. **Media Wisdom Extractor** - Transform TV/movies/books into growth
3. **Somatic Healer** - Body-based healing and embodied practices
4. **Wisdom Synthesizer** - Multi-framework integration (HD, GK, astrology)
5. **Pattern Recognizer** - Growth pattern analysis over time
6. **Standing Tall Coach** - Confidence building and authentic empowerment
7. **Aquil Core** - Central orchestration and daily synthesis

### Quick Deploy

1. **Codespaces:** Open this repo in GitHub Codespaces
2. **Install:** `npm install && npm install -g wrangler`
3. **Login:** `wrangler login` (use catnip-pieces1@icloud.com)
4. **Setup:** `npm run setup` (creates D1 database and KV namespace)
5. **Deploy:** `npm run deploy`
6. **Test:** Visit https://signal-q.me/api/health

### First Session

Once deployed, create your custom GPT in ChatGPT Plus:

- **Name:** "Aquil - Personal Wisdom Engine"
- **Actions:** Import `gpt-actions-schema.json`
- **Base URL:** `https://signal-q.me`

**First interaction:** "Aquil, let's do our first trust check-in together"

### Your Journey

This system becomes more valuable over time:

- **Week 1:** Learning your patterns and preferences
- **Month 1:** Sophisticated pattern recognition and personalized guidance
- **Month 3:** Deep integration of all wisdom systems
- **Ongoing:** Continuous evolution as your personal AI companion

Built for your journey of internal authority and authentic empowerment.

---

_Welcome home to yourself, Aquil._ 🌱
