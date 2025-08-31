// Example prompt starters for expanded Ark 2.0 functionality
// These prompts are designed to trigger specific API endpoints and voices

export const EXAMPLE_PROMPTS = {
  dreams: [
    "I had a recurring dream about my childhood home.",
    "I dreamed I was falling into deep water last night.",
    "There was this strange dream with symbols I don't understand.",
    "I keep having nightmares about being chased.",
    "I had a vivid dream that felt really significant."
  ],
  
  energy: [
    "I feel so drained today, no energy at all.",
    "I'm constantly exhausted even after sleeping.",
    "My energy levels have been really low lately.",
    "I feel burned out and depleted.",
    "I can't seem to find my vitality anymore."
  ],
  
  values: [
    "I don't know what really matters to me right now.",
    "I feel disconnected from my core values.",
    "What should I prioritize in my life?",
    "I'm not sure what's truly important anymore.",
    "I want to align my life with what matters most."
  ],
  
  creativity: [
    "I keep hitting a creative block when writing.",
    "I feel stuck creatively and can't express myself.",
    "I want to create but don't know where to start.",
    "My artistic inspiration has completely dried up.",
    "I feel blocked from my creative expression."
  ],
  
  abundance: [
    "Money feels tight and stressful right now.",
    "I have a scarcity mindset around finances.",
    "I want to cultivate more abundance in my life.",
    "Financial stress is overwhelming me.",
    "I feel like there's never enough money."
  ],
  
  transitions: [
    "I'm moving into a new phase of life and feel uncertain.",
    "This life transition feels overwhelming.",
    "I'm changing careers and don't know what to expect.",
    "Everything in my life is shifting right now.",
    "I'm navigating a major life change."
  ],
  
  ancestry: [
    "I keep repeating patterns from my family.",
    "I want to heal generational trauma in my lineage.",
    "My relationship with my parents affects everything.",
    "I notice inherited patterns that don't serve me.",
    "Family dynamics are showing up in my relationships."
  ],
  
  somatic: [
    "My body feels tense and I can't relax.",
    "I have chronic pain that won't go away.",
    "I want to connect more with my body wisdom.",
    "I feel disconnected from my physical self.",
    "My body is trying to tell me something."
  ],
  
  standing_tall: [
    "I feel small and powerless in meetings.",
    "I shrink when I should stand up for myself.",
    "I want to feel more confident and authentic.",
    "I don't know how to take up space.",
    "I need help finding my personal power."
  ],
  
  trust: [
    "I don't trust my own decisions anymore.",
    "I second-guess myself constantly.",
    "How do I know if I'm making the right choice?",
    "I want to trust my intuition more.",
    "I doubt my own wisdom and judgment."
  ],
  
  commitments: [
    "I want to practice meditation for the next month.",
    "I need accountability for my goals.",
    "I want to commit to standing tall in meetings.",
    "Help me track my progress on personal growth.",
    "I need support staying consistent with practices."
  ],
  
  patterns: [
    "I keep repeating the same mistakes.",
    "I notice patterns in my relationships.",
    "Why do I always react this way?",
    "I want to understand my behavioral patterns.",
    "I see cycles in my life that I want to break."
  ],
  
  media_wisdom: [
    "I just read a book that really moved me.",
    "This podcast episode gave me insights.",
    "I watched a movie that felt meaningful.",
    "This article resonated deeply with me.",
    "I want to extract wisdom from this content."
  ],
  
  synthesis: [
    "Help me make sense of everything happening.",
    "I want to synthesize my recent experiences.",
    "What patterns do you see in my journey?",
    "I need a daily compass for today.",
    "Show me my growth trajectory over time."
  ]
};

// Prompt starters organized by voice preference
export const VOICE_SPECIFIC_PROMPTS = {
  mirror: [
    "I'm feeling overwhelmed and need grounding.",
    "My body is holding a lot of tension today.",
    "I don't trust my own judgment right now.",
    "I feel vulnerable and need support.",
    "I'm processing some difficult emotions."
  ],
  
  oracle: [
    "What does this dream mean symbolically?",
    "I'm looking for deeper meaning in this experience.",
    "Help me understand the archetypal patterns here.",
    "I want wisdom from this challenging situation.",
    "What is my unconscious trying to tell me?"
  ],
  
  scientist: [
    "I want to analyze my behavioral patterns.",
    "Help me understand the mechanics of this habit.",
    "What data do you see in my energy patterns?",
    "I need a systematic approach to this problem.",
    "How does this pattern serve or protect me?"
  ],
  
  strategist: [
    "What should I do next in this situation?",
    "I need a practical plan for moving forward.",
    "Help me create accountability for this goal.",
    "What actions would be most effective here?",
    "I want to commit to a specific practice."
  ]
};

// Context-aware prompt suggestions based on user state
export const CONTEXTUAL_PROMPTS = {
  morning: [
    "What does my body need today?",
    "Help me set intentions for today.",
    "I want a daily compass for navigating today.",
    "What energy am I bringing to this day?",
    "How can I align with my values today?"
  ],
  
  evening: [
    "Help me synthesize today's experiences.",
    "What did I learn about myself today?",
    "I want to process today's emotions.",
    "What patterns showed up for me today?",
    "How did I grow or change today?"
  ],
  
  stuck: [
    "I feel completely stuck and don't know what to do.",
    "I'm paralyzed by indecision right now.",
    "Everything feels overwhelming and unclear.",
    "I need help breaking through this stagnation.",
    "I'm in a loop and can't find my way out."
  ],
  
  breakthrough: [
    "I just had a major realization about myself.",
    "Something shifted and I want to understand it.",
    "I feel like I'm on the edge of a breakthrough.",
    "This insight wants to be integrated.",
    "I'm ready to commit to a new way of being."
  ]
};

// Function to get random prompt from category
export function getRandomPrompt(category) {
  const prompts = EXAMPLE_PROMPTS[category];
  if (!prompts || prompts.length === 0) return null;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Function to get contextually appropriate prompts
export function getContextualPrompts(timeOfDay, userState) {
  const timePrompts = CONTEXTUAL_PROMPTS[timeOfDay] || [];
  const statePrompts = CONTEXTUAL_PROMPTS[userState] || [];
  return [...timePrompts, ...statePrompts];
}

// Function to get voice-specific prompts
export function getVoicePrompts(voiceId) {
  return VOICE_SPECIFIC_PROMPTS[voiceId] || [];
}