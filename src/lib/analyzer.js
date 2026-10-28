// Heuristic bot-vs-human analysis of one speaker in a chat transcript.
// Every signal returns a bot-likeness score (0 = human-like, 1 = bot-like), a weight and a plain-language reason.

const LINE = /^\s*(?:\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?\s*[-–]?\s*)?([^:\n]{1,40}?)\s*:\s+(.+)$/

/** Parse "Name: text" lines (optional "[12:01]" or "12:01:05" timestamp prefix). Lines without a speaker continue the previous message. */
export function parseTranscript(text) {
  const messages = []
  for (const raw of String(text || '').split(/\r?\n/)) {
    if (!raw.trim()) continue
    const m = raw.match(LINE)
    if (m) {
      const t = m[1] !== undefined ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3] || 0) : null
      messages.push({ speaker: m[4].trim(), text: m[5].trim(), time: t })
    } else if (messages.length) {
      messages[messages.length - 1].text += '\n' + raw.trim()
    }
  }
  return messages
}

export function speakers(messages) {
  const count = new Map()
  for (const m of messages) count.set(m.speaker, (count.get(m.speaker) || 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, messages: n }))
}

/** Guess which speaker to analyse: the one that is not "me/you/I", otherwise the second speaker to appear. */
export function defaultSpeaker(messages) {
  const order = [...new Set(messages.map(m => m.speaker))]
  const self = /^(me|i|you|ja|user)$/i
  if (order.some(s => self.test(s))) return order.find(s => !self.test(s)) || order[0]
  return order[1] || order[0] || ''
}

const AI_PHRASES = [
  'as an ai', 'as a language model', "i'm sorry, but", 'i apologize for', 'certainly!', 'absolutely!', 'great question',
  'i hope this helps', 'let me know if', 'feel free to', "it's important to note", 'it is important to note', 'delve',
  'furthermore', 'additionally', 'in conclusion', 'overall,', 'here are some', "here's a", 'happy to help', 'i understand your',
  'that being said', 'tapestry', 'in summary', 'i can help you', 'is there anything else',
]
const HUMAN_MARKERS = /\b(lol|lmao|haha+|hehe|idk|tbh|imo|ngl|omg|brb|btw|u|ur|ya|yeah|nah|gonna|wanna|kinda|dunno|ok|k|xd)\b|[😂🤣😅😭🙃😉😎👍🔥💀]|!!+|\?\?+|\.\.\.$/i
const clamp = (v) => Math.max(0, Math.min(1, v))
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)

function signalPolish(msgs) {
  const tidy = msgs.filter(m => /^[A-Z0-9"'(]/.test(m.text) && /[.!?)"']$/.test(m.text.trim())).length / msgs.length
  return { id: 'polish', label: 'Spelling and punctuation', weight: 1.2, score: clamp((tidy - 0.3) / 0.6),
    detail: `${Math.round(tidy * 100)}% of messages start with a capital and end with punctuation.` }
}

function signalAiPhrases(msgs) {
  const all = msgs.map(m => m.text.toLowerCase()).join('\n')
  const hits = AI_PHRASES.filter(p => all.includes(p))
  const dashes = (all.match(/—/g) || []).length
  const n = hits.length + Math.min(2, dashes)
  return { id: 'phrases', label: 'Assistant-style phrasing', weight: 1.6, score: clamp(n / 3),
    detail: n ? `Found ${[...hits.map(h => `"${h}"`), dashes ? `${dashes} em dash(es)` : ''].filter(Boolean).join(', ')}.` : 'No typical assistant phrases.' }
}

function signalCasual(msgs) {
  const casual = msgs.filter(m => HUMAN_MARKERS.test(m.text)).length / msgs.length
  return { id: 'casual', label: 'Slang, emoji, typos', weight: 1.3, score: clamp(1 - casual * 2.5),
    detail: casual ? `${Math.round(casual * 100)}% of messages use slang, emoji or casual punctuation.` : 'No slang, emoji or casual punctuation at all.' }
}

function signalLength(msgs) {
  const lens = msgs.map(m => m.text.length)
  const avg = mean(lens)
  const sd = Math.sqrt(mean(lens.map(l => (l - avg) ** 2)))
  const cv = avg ? sd / avg : 0
  const longScore = clamp((avg - 60) / 180)
  const evenScore = msgs.length >= 3 ? clamp((0.6 - cv) / 0.5) : 0.5
  return { id: 'length', label: 'Message length', weight: 1.0, score: clamp(longScore * 0.6 + evenScore * 0.4),
    detail: `Average ${Math.round(avg)} characters; variation ${cv.toFixed(2)} (humans usually mix very short and long messages).` }
}

function signalStructure(msgs) {
  const structured = msgs.filter(m => /(^|\n)\s*(?:[-*•]|\d+[.)])\s+\S/.test(m.text) || /\*\*[^*]+\*\*/.test(m.text) || /^#+\s/m.test(m.text)).length
  return { id: 'structure', label: 'Lists and formatting', weight: 1.1, score: clamp(structured / Math.max(1, msgs.length) * 2.5),
    detail: structured ? `${structured} message(s) use bullet lists, numbering or bold text.` : 'No lists or Markdown formatting.' }
}

function signalRepetition(msgs) {
  const openers = msgs.map(m => m.text.toLowerCase().split(/\s+/).slice(0, 2).join(' '))
  const dupOpen = openers.length - new Set(openers).size
  const dupMsg = msgs.length - new Set(msgs.map(m => m.text.toLowerCase())).size
  const words = msgs.flatMap(m => m.text.toLowerCase().match(/[a-ząćęłńóśźż']+/g) || [])
  const ttr = words.length ? new Set(words).size / words.length : 1
  const score = clamp(dupOpen / Math.max(2, msgs.length) * 1.5 + dupMsg * 0.4 + (words.length > 80 ? clamp((0.5 - ttr) * 2) : 0))
  return { id: 'repetition', label: 'Repetition', weight: 0.8, score,
    detail: `${dupOpen} repeated opening(s), ${dupMsg} repeated message(s), vocabulary variety ${ttr.toFixed(2)}.` }
}

function signalTiming(all, who) {
  const gaps = []
  for (let i = 1; i < all.length; i++) {
    const m = all[i], prev = all[i - 1]
    if (m.speaker === who && prev.speaker !== who && m.time != null && prev.time != null) {
      const dt = (m.time - prev.time + 86400) % 86400
      gaps.push({ dt, len: m.text.length })
    }
  }
  if (gaps.length < 2) return { id: 'timing', label: 'Reply speed', weight: 0, score: 0.5, detail: 'Not enough timestamps (add times like [12:01] for this signal).' }
  const cps = gaps.map(g => g.len / Math.max(1, g.dt))
  const fast = cps.filter(c => c > 12).length / cps.length
  const dts = gaps.map(g => g.dt), avg = mean(dts)
  const cv = avg ? Math.sqrt(mean(dts.map(d => (d - avg) ** 2))) / avg : 0
  return { id: 'timing', label: 'Reply speed', weight: 1.5, score: clamp(fast * 0.8 + clamp((0.4 - cv) / 0.4) * 0.3),
    detail: `${Math.round(fast * 100)}% of replies would need typing faster than 12 characters per second; reply-time variation ${cv.toFixed(2)}.` }
}

/** Analyse one speaker. Returns { probability, verdict, confidence, signals, messageCount }. */
export function analyze(messages, who) {
  const msgs = messages.filter(m => m.speaker === who)
  if (!msgs.length) return { probability: 0.5, verdict: 'unknown', confidence: 'none', signals: [], messageCount: 0 }
  const signals = [signalAiPhrases(msgs), signalPolish(msgs), signalCasual(msgs), signalLength(msgs), signalStructure(msgs),
    signalRepetition(msgs), signalTiming(messages, who)]
  // Phrases, formatting and repetition are one-sided: finding them points to a bot, but their absence proves nothing.
  const ONE_SIDED = ['phrases', 'structure', 'repetition']
  for (const s of signals) s.effectiveWeight = ONE_SIDED.includes(s.id) ? s.weight * s.score : s.weight
  const w = signals.reduce((s, x) => s + x.effectiveWeight, 0) || 1
  let p = signals.reduce((s, x) => s + x.score * x.effectiveWeight, 0) / w
  // Few messages: pull towards 50% because there is little evidence.
  const shrink = Math.min(1, msgs.length / 6)
  p = 0.5 + (p - 0.5) * shrink
  const verdict = p >= 0.62 ? 'bot' : p <= 0.38 ? 'human' : 'unsure'
  const confidence = msgs.length < 3 ? 'low' : Math.abs(p - 0.5) > 0.25 && msgs.length >= 5 ? 'high' : 'medium'
  return { probability: Math.round(p * 100) / 100, verdict, confidence, signals, messageCount: msgs.length }
}
