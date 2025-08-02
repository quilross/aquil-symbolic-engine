// index.js — ARK 4.3 SOLO MODE w/ Gift Trigger, KV Ready

import { getSystemHealth, getAgentSuggestions, getGeneKeyGuidance, getEffectivenessDashboard, getRecoverySupport, checkArkCoherence, getPhiladelphiaContext, getLivePhiladelphiaEvents, getIdentityOrchestration, getCreativeEmergence, getAlphaPresenceGuidance, getSilenceMapping, getSynchronicityTracking, activateAquilProbe, trackEmotionalWave, manifestorInitiation, activateThroatcraft, getTraumaInformedResponse, orchestrateIdentities, getPredictiveProtocol, contextVoiceSwitch, getNervousSystemGuidance, getNeighborhoodEnergy, getCattleDogGuidance, getCompanionBondingAdvice, getSomaticAwareness, getSomaticRegulation, getSomaticTraumaRelease, aiEnhancedResponse, getVoiceEmergenceProtocol, giftInstinctTrigger } from "./routes.js";

export default {
  async fetch(request, env, ctx) {
    // 🛡️ Safe JSON fallback
    if (!Request.prototype._jsonSafe) {
      const originalJson = Request.prototype.json;
      Request.prototype.json = async function () {
        try {
          return await originalJson.call(this);
        } catch (err) {
          console.warn("⚠️ Safe JSON fallback triggered:", err.message, {
            url: this.url,
            method: this.method,
          });
          return {};
        };
      };
      Request.prototype._jsonSafe = true;
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    console.log("🌐 Request received:", request.method, pathname);

    // Diagnostic GET endpoints
    if (pathname === "/system/health") return await getSystemHealth();
    if (pathname === "/agent-suggestions") return await getAgentSuggestions();
    if (pathname === "/gene-key-guidance") return await getGeneKeyGuidance();
    if (pathname === "/effectiveness-dashboard") return await getEffectivenessDashboard();
    if (pathname === "/recovery-support") return await getRecoverySupport();
    if (pathname === "/ark-coherence-check") return await checkArkCoherence();
    if (pathname === "/philadelphia-context") return await getPhiladelphiaContext();
    if (pathname === "/live-philadelphia-events") return await getLivePhiladelphiaEvents();
    if (pathname === "/identity/orchestration") return await getIdentityOrchestration();
    if (pathname === "/recovery/creative-emergence") return await getCreativeEmergence();
    if (pathname === "/lunacraft/alpha-presence") return await getAlphaPresenceGuidance();
    if (pathname === "/throatcraft/silence-mapping") return await getSilenceMapping();
    if (pathname === "/philadelphia/synchronicity") return await getSynchronicityTracking();

    // POST endpoints (mutation, trigger, or user-originating data)
    if (pathname === "/protocols/aquil-probe") return await activateAquilProbe(request);
    if (pathname === "/emotional-wave-tracker") return await trackEmotionalWave(request);
    if (pathname === "/manifestor-initiation") return await manifestorInitiation(request);
    if (pathname === "/throatcraft-session") return await activateThroatcraft(request);
    if (pathname === "/trauma-informed-response") return await getTraumaInformedResponse(request);
    if (pathname === "/multi-identity-orchestration") return await orchestrateIdentities(request);
    if (pathname === "/predictive-protocol") return await getPredictiveProtocol();
    if (pathname === "/identity/voice-switch") return await contextVoiceSwitch(request);
    if (pathname === "/recovery/nervous-system") return await getNervousSystemGuidance(request);
    if (pathname === "/philadelphia/neighborhood-energy") return await getNeighborhoodEnergy(request);
    if (pathname === "/lunacraft/cattle-dog-guidance") return await getCattleDogGuidance(request);
    if (pathname === "/lunacraft/companion-bonding") return await getCompanionBondingAdvice(request);
    if (pathname === "/somatic/body-awareness") return await getSomaticAwareness(request);
    if (pathname === "/somatic/nervous-system-regulation") return await getSomaticRegulation(request);
    if (pathname === "/somatic/trauma-release") return await getSomaticTraumaRelease(request);
    if (pathname === "/ai-enhance") return await aiEnhancedResponse(request);
    if (pathname === "/throatcraft/voice-emergence") return await getVoiceEmergenceProtocol(request);
    if (pathname === "/ritual/gift-instinct-trigger") return await giftInstinctTrigger(request);

    // Final fallback
    return new Response("Not Found", { status: 404 });
  },
};
