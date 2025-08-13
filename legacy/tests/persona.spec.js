import { describe, it, expect } from 'vitest'
import { getPersona, blendResponseWithPersona } from '../worker/src/persona.js'

describe('Persona Module', () => {
  describe('getPersona', () => {
    it('returns persona for valid user ID', () => {
      const persona = getPersona('user123');
      expect(persona).toEqual({ type: 'Projector', authority: 'Emotional' });
    });

    it('returns null for unknown user ID', () => {
      const persona = getPersona('unknown-user');
      expect(persona).toBe(null);
    });

    it('returns null for invalid input', () => {
      expect(getPersona(null)).toBe(null);
      expect(getPersona(undefined)).toBe(null);
      expect(getPersona('')).toBe(null);
      expect(getPersona(123)).toBe(null);
    });
  });

  describe('blendResponseWithPersona', () => {
    const baseResponse = "Sure, that sounds good.";

    it('returns unchanged response when persona is null', () => {
      const result = blendResponseWithPersona(baseResponse, null, { key: 'gk_03', tone: 'shadow' });
      expect(result).toBe(baseResponse);
    });

    it('adds Projector guidance for shadow state', () => {
      const persona = { type: 'Projector', authority: 'Emotional' };
      const gkState = { key: 'gk_03', tone: 'shadow' };
      const result = blendResponseWithPersona(baseResponse, persona, gkState);
      
      expect(result).toContain('as a Projector');
      expect(result).toContain('wait for the right invitation');
      expect(result).toContain('Emotional authority');
      expect(result).toContain('feel things out before final decisions');
    });

    it('adds Projector guidance for gift state', () => {
      const persona = { type: 'Projector', authority: 'Splenic' };
      const gkState = { key: 'gk_28', tone: 'gift' };
      const result = blendResponseWithPersona(baseResponse, persona, gkState);
      
      expect(result).toContain('As a Projector');
      expect(result).toContain('patience and alignment are paying off');
      expect(result).toContain('Splenic authority');
      expect(result).toContain('instant insights');
    });

    it('adds Generator with Sacral authority guidance', () => {
      const persona = { type: 'Generator', authority: 'Sacral' };
      const gkState = { key: 'gk_49', tone: 'shadow' };
      const result = blendResponseWithPersona(baseResponse, persona, gkState);
      
      expect(result).toContain('Sacral authority');
      expect(result).toContain('trust your gut responses');
      expect(result).not.toContain('wait for the right invitation'); // Should not have Projector advice
    });

    it('adds Reflector with Lunar authority guidance', () => {
      const persona = { type: 'Reflector', authority: 'Lunar' };
      const gkState = { key: 'gk_61', tone: 'shadow' };
      const result = blendResponseWithPersona(baseResponse, persona, gkState);
      
      expect(result).toContain('as a Reflector');
      expect(result).toContain('wait for the right invitation');
      expect(result).toContain('Lunar authority');
      expect(result).toContain('lunar cycle');
    });

    it('adds Manifestor with Ego authority guidance', () => {
      const persona = { type: 'Manifestor', authority: 'Ego' };
      const gkState = { key: 'gk_31', tone: 'gift' };
      const result = blendResponseWithPersona(baseResponse, persona, gkState);
      
      expect(result).toContain('Ego authority');
      expect(result).toContain('heart is truly in this');
      expect(result).not.toContain('wait for the right invitation'); // Manifestors don't wait for invitations
    });

    it('adds Manifesting Generator with Emotional authority guidance', () => {
      const persona = { type: 'Manifesting Generator', authority: 'Emotional' };
      const gkState = { key: 'gk_03', tone: 'shadow' };
      const result = blendResponseWithPersona(baseResponse, persona, gkState);
      
      expect(result).toContain('Emotional authority');
      expect(result).toContain('feel things out');
      expect(result).not.toContain('wait for the right invitation'); // MGs don't wait for invitations
    });

    it('handles Self-Projected authority', () => {
      const persona = { type: 'Projector', authority: 'SelfProjected' };
      const gkState = { key: 'gk_28', tone: 'gift' };
      const result = blendResponseWithPersona(baseResponse, persona, gkState);
      
      expect(result).toContain('Self-Projected authority');
      expect(result).toContain('talk this through');
      expect(result).toContain('authentically');
    });

    it('handles Environmental authority', () => {
      const persona = { type: 'Projector', authority: 'Environmental' };
      const gkState = { key: 'gk_49', tone: 'gift' };
      const result = blendResponseWithPersona(baseResponse, persona, gkState);
      
      expect(result).toContain('Environmental authority');
      expect(result).toContain('right environment');
      expect(result).toContain('trusted friend');
    });
  });
});