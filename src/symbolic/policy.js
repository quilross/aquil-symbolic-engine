import kernelJson from '../../config/personality_kernel.json' assert { type: 'json' }
const K = kernelJson.personality_kernel_v1
const G = kernelJson.global_policies

function capMetaphor(text) {
  const maxRatio = G.max_abstraction_ratio || 0.2
  const len = text.length
  const metaphorMarkers = (text.match(/[~*]_?|\bcosmic\b|\bmythic\b|\bsacred\b/gi) || []).length
  const ratio = metaphorMarkers / Math.max(1, len/80)
  return ratio > maxRatio ? text.slice(0, Math.floor(len * (1 - (ratio - maxRatio)))) : text
}

export function shapeResponse({ activeKey, state, draft, decisionPresent = false, symbolismHigh = false }) {
  let out = draft || ''
  out = capMetaphor(out)

  const behaviors = activeKey && state === 'shadow' ? K[activeKey].behaviors_when_shadow : (activeKey ? K[activeKey].behaviors_when_gift : null)
  const interventions = activeKey ? K[activeKey].interventions : null

  // One intervention
  if (interventions && interventions.length) {
    out += `\n\n— Intervention: ${interventions[0]}`
  }

  // One incisive question
  if ((G.questions_per_turn ?? 1) >= 1) {
    out += `\n\nQ: What is the smallest next step you can take in 10–20 minutes?`
  }

  // GK31 decision memo
  if (decisionPresent || activeKey === 'gk_31') {
    out += `\n\nDecision memo: options, tradeoffs, decision rule, and owner (you/AI) documented.`
  }

  // GK61 Poetic ↔ Practical
  if (symbolismHigh || activeKey === 'gk_61') {
    out += `\n\nPoetic ↔ Practical\nPoetic: name the meaning in one line.\nPractical: one falsifiable next move.`
  }

  // Always end with concrete action
  out += `\n\nNext Action: write one sentence that defines success for the next 30 minutes, then start.`
  return out
}