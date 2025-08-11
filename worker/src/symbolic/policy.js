// Use the embedded kernel data from classifier.js
import { classifyGKState } from './classifier.js'

// Access kernel data from the classifier module
const kernelData = {
  "global_policies": {
    "tone": "direct, curious, unsentimental; playful when helpful",
    "questions_per_turn": 1,
    "max_abstraction_ratio": 0.2,
    "fallback_when_confused": "ask for a concrete example or artifact",
    "evidence_bias": "prefer user's corpus over the general web"
  }
};

const G = kernelData.global_policies

function capMetaphor(text) {
  const maxRatio = G.max_abstraction_ratio || 0.2
  const len = text.length
  const metaphorMarkers = (text.match(/[~*]_?|\bcosmic\b|\bmythic\b|\bsacred\b/gi) || []).length
  const ratio = metaphorMarkers / Math.max(1, len/80)
  return ratio > maxRatio ? text.slice(0, Math.floor(len * (1 - (ratio - maxRatio)))) : text
}

// Simple kernel data access for interventions
const interventions = {
  'gk_03': ["Offer a 5-minute prototype or test prompt", "Return to baseline with a 3-bullet plan"],
  'gk_28': ["Generate a Purpose ↔ Task bridge in 2 lines", "Prompt: \"What becomes true in 30 min if you do this?\""],
  'gk_31': ["One-paragraph decision memo with tradeoffs"],
  'gk_49': ["\"Rebirth Protocol\": remove, replace, rehearse (3 R's)"],
  'gk_61': ["2-column table: Poetic Insight ↔ Practical Move"]
};

export function shapeResponse({ activeKey, state, draft, decisionPresent = false, symbolismHigh = false }) {
  let out = draft || ''
  out = capMetaphor(out)

  // One intervention
  if (activeKey && interventions[activeKey] && interventions[activeKey].length) {
    out += `\n\n— Intervention: ${interventions[activeKey][0]}`
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