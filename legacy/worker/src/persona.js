// src/persona.js
// Human Design persona dynamics module

// Import persona configuration
import personaData from '../persona.json' assert { type: 'json' };

/**
 * Get a user's persona configuration
 * @param {string} userId - User identifier
 * @returns {Object|null} Persona object with type and authority, or null if not found
 */
export function getPersona(userId) {
  if (!userId || typeof userId !== 'string') {
    return null;
  }
  return personaData[userId] || null;
}

/**
 * Blend response with Human Design persona dynamics
 * @param {string} baseResponse - The base AI response
 * @param {Object} persona - User's persona {type, authority}
 * @param {Object} gkState - Gene Key state {key, tone}
 * @returns {string} Response adjusted for persona
 */
export function blendResponseWithPersona(baseResponse, persona, gkState) {
  let adjusted = baseResponse;
  if (!persona) return adjusted;

  const { type, authority } = persona;

  // Type-based adjustments
  if ((type === "Projector" || type === "Reflector") && gkState.tone === "shadow") {
    // If user is a Projector/Reflector and in a shadow state, encourage waiting and reflection
    adjusted += " Remember, as a " + type + ", it's okay to take your time — wait for the right invitation or clarity before acting.";
  } else if ((type === "Projector" || type === "Reflector") && gkState.tone === "gift") {
    // If they're in a gift state, still acknowledge their strategy
    adjusted += " As a " + type + ", your patience and alignment are paying off; continue to trust the timing of things.";
  }

  // Authority-based adjustments
  if (authority === "Emotional") {
    // Emotional authority: always advise waiting for clarity
    adjusted += " Since you have an Emotional authority, give yourself time to feel things out before final decisions.";
  } else if (authority === "Sacral") {
    // Sacral (gut) authority: encourage listening to immediate gut responses
    adjusted += " With a Sacral authority, trust your gut responses in the moment – your immediate feeling is usually correct.";
  } else if (authority === "Splenic") {
    // Splenic (intuition) authority: encourage acting on intuitive hits
    adjusted += " Having a Splenic authority means your intuition speaks softly but quickly – it's good to honor those instant insights.";
  } else if (authority === "Ego") {
    // Ego (Willpower) authority: encourage checking if heart is truly in it
    adjusted += " With an Ego authority, check if your heart is truly in this – follow what you strongly desire and have willpower for.";
  } else if (authority === "SelfProjected") {
    // Self-Projected (G or Self Authority): suggest talking it out
    adjusted += " As someone with Self-Projected authority, talk this through or see if it feels authentically 'you' when you speak about it.";
  } else if (authority === "Environmental") {
    // Environmental (Mental Projectors): advise discussing in right environment
    adjusted += " With Environmental authority, discuss this in the right environment or with a trusted friend to hear your own guidance clearly.";
  } else if (authority === "Lunar") {
    // Lunar (Reflectors): emphasize waiting a lunar cycle for big decisions
    adjusted += " Given your Lunar authority, for significant decisions, consider waiting through a full lunar cycle to gain complete clarity.";
  }

  return adjusted;
}