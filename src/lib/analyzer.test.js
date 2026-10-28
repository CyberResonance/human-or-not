import { describe, it, expect } from 'vitest'
import { parseTranscript, speakers, defaultSpeaker, analyze } from './analyzer.js'
import { SAMPLES } from './samples.js'
import { buildPrompt, parseAnswer, askGemini } from './gemini.js'

describe('parseTranscript', () => {
  it('reads speakers, timestamps and multi-line messages', () => {
    const m = parseTranscript('[12:01] Me: hi\n12:01:30 Bot: Hello!\n- point one\n\nAnna: no time here')
    expect(m).toHaveLength(3)
    expect(m[0]).toEqual({ speaker: 'Me', text: 'hi', time: 43260 })
    expect(m[1].time).toBe(43290)
    expect(m[1].text).toBe('Hello!\n- point one')
    expect(m[2]).toMatchObject({ speaker: 'Anna', time: null })
  })

  it('ignores text before the first speaker line', () => {
    expect(parseTranscript('random header\nMe: hi')).toHaveLength(1)
  })
})

describe('speaker helpers', () => {
  const msgs = parseTranscript('Me: a\nBot: b\nBot: c')
  it('counts messages per speaker', () => {
    expect(speakers(msgs)).toEqual([{ name: 'Bot', messages: 2 }, { name: 'Me', messages: 1 }])
  })
  it('picks the non-"me" speaker by default', () => {
    expect(defaultSpeaker(msgs)).toBe('Bot')
    expect(defaultSpeaker(parseTranscript('Ann: x\nBob: y'))).toBe('Bob')
  })
})

describe('analyze on practice chats', () => {
  for (const s of SAMPLES) {
    it(`${s.title} -> ${s.answer}`, () => {
      const msgs = parseTranscript(s.text)
      const r = analyze(msgs, defaultSpeaker(msgs))
      expect(r.verdict).toBe(s.answer)
    })
  }

  it('returns unknown for a missing speaker', () => {
    expect(analyze(parseTranscript('Me: hi'), 'Nobody').verdict).toBe('unknown')
  })

  it('keeps few-message chats close to 50%', () => {
    const r = analyze(parseTranscript('Me: hi\nX: Certainly! I hope this helps.'), 'X')
    expect(r.confidence).toBe('low')
    expect(Math.abs(r.probability - 0.5)).toBeLessThan(0.15)
  })

  it('skips the timing signal without timestamps', () => {
    const r = analyze(parseTranscript('Me: a\nX: b\nMe: c\nX: d'), 'X')
    expect(r.signals.find(s => s.id === 'timing').weight).toBe(0)
  })
})

describe('gemini helpers', () => {
  const msgs = parseTranscript('Me: hi\nX: hello')
  it('builds a prompt naming the participant', () => {
    expect(buildPrompt(msgs, 'X')).toContain('Participant to judge: "X"')
  })
  it('parses a JSON answer, also inside a code fence', () => {
    const data = { candidates: [{ content: { parts: [{ text: '```json\n{"verdict":"bot","probability_bot":87,"reasons":["a"]}\n```' }] } }] }
    expect(parseAnswer(data)).toEqual({ verdict: 'bot', probability: 0.87, reasons: ['a'] })
  })
  it('rejects malformed answers', () => {
    expect(() => parseAnswer({ candidates: [{ content: { parts: [{ text: '{"verdict":"maybe"}' }] } }] })).toThrow()
  })
  it('sends the key as a header, not in the URL', async () => {
    let seen
    const fake = async (url, opts) => { seen = { url, opts }; return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"verdict":"human","probability_bot":10,"reasons":[]}' }] } }] }) } }
    const r = await askGemini('KEY123', msgs, 'X', fake)
    expect(r.verdict).toBe('human')
    expect(seen.url).not.toContain('KEY123')
    expect(seen.opts.headers['x-goog-api-key']).toBe('KEY123')
  })
})
