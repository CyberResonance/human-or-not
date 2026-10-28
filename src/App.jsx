import { useMemo, useState } from 'react'
import { parseTranscript, speakers, defaultSpeaker, analyze } from './lib/analyzer.js'
import { askGemini } from './lib/gemini.js'
import { SAMPLES } from './lib/samples.js'

const VERDICT = { bot: 'Likely a bot', human: 'Likely a human', unsure: 'Hard to tell', unknown: 'Nothing to analyse' }

function Meter({ value }) {
  const pct = Math.round(value * 100)
  return (
    <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Bot likelihood">
      <div className="meter-track"><div className="meter-dot" style={{ left: `${pct}%` }} /></div>
      <div className="meter-labels"><span>Human</span><span>{pct}% bot-like</span><span>Bot</span></div>
    </div>
  )
}

function Report({ result }) {
  if (!result.messageCount) return <p className="muted">No messages from this speaker.</p>
  return (
    <section className="card">
      <div className={`verdict v-${result.verdict}`}>{VERDICT[result.verdict]}</div>
      <p className="muted">Based on {result.messageCount} message(s) · confidence: {result.confidence}</p>
      <Meter value={result.probability} />
      <ul className="signals">
        {result.signals.map(s => (
          <li key={s.id} className={s.effectiveWeight === 0 ? 'off' : ''}>
            <div className="sig-head"><strong>{s.label}</strong><span className="bar"><i style={{ width: `${Math.round(s.score * 100)}%` }} /></span></div>
            <span className="muted">{s.detail}{s.effectiveWeight === 0 && s.id !== 'timing' ? ' (not counted)' : ''}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Analyzer({ initial = '' }) {
  const [text, setText] = useState(initial)
  const messages = useMemo(() => parseTranscript(text), [text])
  const people = useMemo(() => speakers(messages), [messages])
  const [who, setWho] = useState('')
  const target = people.some(p => p.name === who) ? who : defaultSpeaker(messages)
  const result = useMemo(() => analyze(messages, target), [messages, target])
  const [key, setKey] = useState('')
  const [ai, setAi] = useState(null)
  const [busy, setBusy] = useState(false)

  async function second() {
    setBusy(true); setAi(null)
    try { setAi(await askGemini(key.trim(), messages, target)) } catch (e) { setAi({ error: e.message }) } finally { setBusy(false) }
  }

  return (
    <div className="grid">
      <section className="card">
        <label htmlFor="chat"><strong>Paste the chat</strong></label>
        <p className="muted">One message per line as <code>Name: text</code>. Add times like <code>[14:02:10]</code> to enable the reply-speed check.</p>
        <textarea id="chat" value={text} onChange={e => { setText(e.target.value); setAi(null) }} rows={14}
          placeholder={'[14:02:10] Me: hi, are you there?\n[14:02:12] Alex: Hello! How can I help you today?'} />
        {people.length > 0 && (
          <label className="row">Analyse
            <select value={target} onChange={e => { setWho(e.target.value); setAi(null) }}>
              {people.map(p => <option key={p.name} value={p.name}>{p.name} ({p.messages})</option>)}
            </select>
          </label>
        )}
        <details className="ai">
          <summary>Second opinion from Gemini (optional)</summary>
          <p className="muted">Sends this chat to Google's Gemini API with your own key. The key stays in this tab only and is never saved.</p>
          <div className="row">
            <input type="password" autoComplete="off" placeholder="Gemini API key" value={key} onChange={e => setKey(e.target.value)} />
            <button onClick={second} disabled={!key.trim() || !messages.length || busy}>{busy ? 'Asking…' : 'Ask Gemini'}</button>
          </div>
          {ai?.error && <p className="error">{ai.error}</p>}
          {ai && !ai.error && (
            <div className="ai-out">
              <strong>{VERDICT[ai.verdict]}</strong> · {Math.round(ai.probability * 100)}% bot-like
              <ul>{ai.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
          )}
        </details>
      </section>
      {messages.length ? <Report result={result} /> : <section className="card muted">The analysis appears here as you paste.</section>}
    </div>
  )
}

function Practice() {
  const [i, setI] = useState(0)
  const [guess, setGuess] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const s = SAMPLES[i]
  const msgs = useMemo(() => parseTranscript(s.text), [s])
  const who = defaultSpeaker(msgs)
  const result = useMemo(() => analyze(msgs, who), [msgs, who])

  function pick(g) {
    if (guess) return
    setGuess(g)
    setScore(v => ({ right: v.right + (g === s.answer ? 1 : 0), total: v.total + 1 }))
  }
  function next() { setGuess(null); setI((i + 1) % SAMPLES.length) }

  return (
    <div className="grid">
      <section className="card">
        <div className="row spread"><strong>{s.title}</strong><span className="muted">Score {score.right}/{score.total}</span></div>
        <div className="chat">
          {msgs.map((m, k) => <div key={k} className={`bubble ${m.speaker === who ? 'them' : 'me'}`}><b>{m.speaker}</b>{m.text}</div>)}
        </div>
        <p>Is <strong>{who}</strong> a bot or a human?</p>
        <div className="row">
          <button onClick={() => pick('human')} disabled={!!guess}>Human</button>
          <button onClick={() => pick('bot')} disabled={!!guess}>Bot</button>
          {guess && <button className="ghost" onClick={next}>Next chat →</button>}
        </div>
        {guess && <p className={guess === s.answer ? 'ok' : 'error'}>{guess === s.answer ? 'Correct' : 'Not quite'}: it was a {s.answer}.</p>}
      </section>
      {guess ? <Report result={result} /> : <section className="card muted">Make your guess to see what the analyser noticed.</section>}
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('analyze')
  return (
    <main>
      <header>
        <h1>Human <span>or</span> Not</h1>
        <p className="muted">Paste a chat and see which signals point to a bot or a human. Everything runs in your browser.</p>
        <nav className="tabs">
          <button className={tab === 'analyze' ? 'on' : ''} onClick={() => setTab('analyze')}>Analyse a chat</button>
          <button className={tab === 'practice' ? 'on' : ''} onClick={() => setTab('practice')}>Practice</button>
        </nav>
      </header>
      {tab === 'analyze' ? <Analyzer /> : <Practice />}
      <footer className="muted">Heuristics are hints, not proof. Built by <a href="https://cyberresonance.io" target="_blank" rel="noreferrer">CyberResonance</a>.</footer>
    </main>
  )
}
