import kernelJson from '../../config/personality_kernel.json' assert { type: 'json' }
const K = kernelJson.personality_kernel_v1

export function classifyGKState(text, lastActiveKey = null) {
  const t = (text || '').toLowerCase()
  let best = null
  for (const [key, spec] of Object.entries(K)) {
    for (const phrase of spec.detect_shadow) {
      const p = phrase.toLowerCase()
      if (t.includes(p)) {
        const score = p.length
        if (!best || score > best.score || (score === best.score && key === lastActiveKey)) {
          best = { activeKey: key, state: 'shadow', cues: [phrase], score }
        }
      }
    }
  }
  return best ? { activeKey: best.activeKey, state: best.state, cues: best.cues } : { activeKey: null, state: null, cues: [] }
}