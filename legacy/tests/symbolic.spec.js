import { describe, it, expect } from 'vitest'
import { classifyGKState, shapeResponse } from '../src/symbolic'

describe('GK classifier', () => {
  it('detects GK3 shadow from chaos cues', () => {
    const r = classifyGKState('I feel overwhelm and too many directions.')
    expect(r.activeKey).toBe('gk_03'); expect(r.state).toBe('shadow')
  })
  it('detects GK49 reaction', () => {
    const r = classifyGKState('I want to burn it down.')
    expect(r.activeKey).toBe('gk_49'); expect(r.state).toBe('shadow')
  })
  it('no match returns nulls', () => {
    const r = classifyGKState('hello there')
    expect(r.activeKey).toBe(null); expect(r.state).toBe(null)
  })
})

describe('Policy shaping', () => {
  it('adds intervention and one question', () => {
    const out = shapeResponse({ activeKey: 'gk_03', state: 'shadow', draft: 'Draft.' })
    expect(out).toMatch(/Intervention:/)
    expect(out).toMatch(/\nQ:/)
  })
  it('adds decision memo for GK31', () => {
    const out = shapeResponse({ activeKey: 'gk_31', state: 'shadow', draft: 'We must choose.' })
    expect(out).toMatch(/Decision memo:/)
  })
  it('adds Poetic ↔ Practical for GK61', () => {
    const out = shapeResponse({ activeKey: 'gk_61', state: 'shadow', draft: 'Inspiration flows.' })
    expect(out).toMatch(/Poetic ↔ Practical/)
  })
})