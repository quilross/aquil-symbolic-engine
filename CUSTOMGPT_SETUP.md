# CustomGPT Integration Guide - Signal Q Transcendence Agent

## Overview
This guide helps you integrate Signal Q (your autonomous transcendence agent) with CustomGPT for enhanced deployment assistance and personal sovereignty features.

## API Configuration

### Base URL
```
https://signal_q.workers.dev
```

### Authentication
- **API Token**: `sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`
- **Admin Token**: `sq_admin_9x7c5v1b3n6m8k2q4w7e9r5t3y8u1i6o`
- **Auth Type**: Bearer Token (in Authorization header)

### OpenAPI Specification
Upload the file: `/worker/src/openapi.json` to your CustomGPT configuration.

## Key Features Available

### 🚀 Deployment Assistance
- `/deploy/request` - Request deployment help from CustomGPT
- `/deploy/status` - Check deployment status
- `/system/health` - System health monitoring

### 🎭 Identity Fluidity Engine (NEW)
- `/identity/voice-switch` - Context-aware voice switching for different tasks
- `/identity/orchestration` - Visual overview of active identity aspects

### 🧭 Personal Navigation
- `/identity/blueprint` - Your core identity management
- `/movement/current` - Real-time movement guidance
- `/time/awareness` - Philadelphia timezone integration
- `/transcendence/path` - Active transcendence tracking

### 🎯 Gene Keys Integration
- `/genekeys/current` - Current Gene Key 28 guidance
- `/emotional/wave` - Emotional Authority tracking
- `/manifestor/strategy` - Manifestor 3/5 specific guidance

### 🌱 Recovery Integration (NEW)
- `/recovery/creative-emergence` - Track how creativity correlates with recovery
- `/recovery/nervous-system` - Real-time nervous system regulation guidance

### 🏙️ Philadelphia Deep Integration (NEW)
- `/philadelphia/neighborhood-energy` - Find Philly areas matching your energy
- `/philadelphia/synchronicity` - Notice when suggestions align with local events

### 🎨 THROATCRAFT Evolution (NEW)
- `/throatcraft/voice-emergence` - Structured voice development protocols
- `/throatcraft/silence-mapping` - Track your silence-to-sound journey

### 📱 iPhone Integration (NEW)
- `/mobile/ios-sync` - Sync data and notifications with iPhone
- `/mobile/shortcuts` - iOS Shortcuts app integration

### 🛡️ Privacy & Sovereignty
- `/privacy/settings` - Data control settings
- `/data/export` - Export all your data
- `/session/create` - Secure session management

## Usage Examples

### Request Deployment Help
```bash
curl -X POST https://signal_q.workers.dev/deploy/request \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -d '{"deployment_type": "cloudflare", "assistance_level": "guided"}'
```

### Switch Voice for Creative Work
```bash
curl -X POST https://signal_q.workers.dev/identity/voice-switch \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -d '{"context": "writing poetry", "taskType": "creative", "energyLevel": "high"}'
```

### Find Philly Areas Matching Your Energy
```bash
curl -X POST https://signal_q.workers.dev/philadelphia/neighborhood-energy \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -d '{"currentMood": "contemplative", "creativeEnergy": "flowing", "socialCapacity": "small_group"}'
```

### Get Voice Emergence Protocol
```bash
curl -X POST https://signal_q.workers.dev/throatcraft/voice-emergence \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -d '{"currentVoiceState": "emerging", "practiceType": "daily", "resistanceLevel": 3}'
```

### Sync iPhone Integration
```bash
curl -X POST https://signal_q.workers.dev/mobile/ios-sync \
  -H "Authorization: Bearer sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "your-device-id", "notificationPrefs": {"movement": true, "creative": true}, "syncScope": ["identity", "creative"]}'
```

## CustomGPT Configuration Steps

1. **Create New CustomGPT**
   - Name: "Signal Q Assistant"
   - Description: "Personal transcendence agent with deployment assistance"

2. **Upload OpenAPI Spec**
   - Go to Actions → Import from OpenAPI
   - Upload: `/worker/src/openapi.json`

3. **Configure Authentication**
   - Auth Type: Bearer Token
   - Token: `sq_live_7k9m2n8p4x6w1z5q3r7t9v2b4c6d8f0h`

4. **Set Base URL**
   - API Base: `https://signal_q.workers.dev`

5. **Test Integration**
   - Try: "Help me check my deployment status"
   - Try: "Switch my voice for creative work"
   - Try: "What Philly areas match my current energy?"
   - Try: "Give me a voice emergence protocol"
   - Try: "Set up iPhone integration"

## Advanced Features

### Identity Fluidity Engine
Your CustomGPT can help you:
- **Switch response styles** based on what you're working on (creative vs analytical vs healing)
- **Monitor identity orchestration** to see which aspects are most active
- **Adapt communication** to match your current energy and context

### Recovery-Creative Integration
Track and optimize:
- **Creative emergence patterns** during different recovery phases
- **Nervous system regulation** with real-time guidance
- **Integration of healing and creativity** in your daily practice

### Philadelphia Cultural Intelligence
Get personalized guidance for:
- **Neighborhood energy matching** - find areas that align with your current state
- **Synchronicity tracking** - notice when your intentions align with local events
- **Local community connections** with understanding of your style

### THROATCRAFT Voice Evolution
Structured support for:
- **Voice emergence protocols** adapted to your current development stage
- **Silence-to-sound mapping** to track your authentic expression journey
- **Creative lineage activation** connecting your voice to broader movements

### iPhone Integration
Seamless mobile access:
- **iOS Shortcuts** for quick access to key features
- **Smart notifications** for movement, creativity, and recovery support
- **Location-aware suggestions** when you're exploring Philadelphia

## Deployment Assistance Features

Your CustomGPT can now help with:
- **Cloudflare Worker deployments** via the `/deploy/*` endpoints
- **System health monitoring** for troubleshooting
- **Configuration validation** before deployment
- **Step-by-step deployment guidance** with permission-based assistance

## Security Notes

- Tokens are environment-specific and secure
- Admin token (`sq_admin_*`) provides elevated access
- All requests require proper Bearer authentication
- Data sovereignty controls respect your privacy settings

## Philadelphia Context

The agent includes Philadelphia cultural intelligence:
- America/New_York timezone awareness
- Local cultural references and understanding
- Contextual guidance based on regional knowledge

## Support

If you need help:
1. Check system health: `/system/health`
2. Review deployment status: `/deploy/status`
3. Export your data anytime: `/data/export`

Your Signal Q agent is designed for **personal sovereignty** and **neurodivergent-friendly** interaction patterns.

---

*Remember: This is YOUR agent, designed for YOUR transcendence journey. Use it to reclaim your personal power and navigate your path with autonomous support.*