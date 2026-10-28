// Optional second opinion from Gemini. The key is passed in at call time and never stored by the app.
export function buildPrompt(messages, who) {
  const transcript = messages.map(m => `${m.speaker}: ${m.text}`).join('\n').slice(0, 12000)
  return `You judge whether one participant of a chat is an AI chatbot or a human.
Participant to judge: "${who}".
Look at style, specificity, consistency, personal details, evasiveness, typos, timing if present, and scam patterns.
Transcript:
${transcript}

Return JSON only: {"verdict": "bot" | "human" | "unsure", "probability_bot": 0-100, "reasons": ["short reason", "..."]}`
}

export function parseAnswer(data) {
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  let j
  try { j = JSON.parse(text.replace(/^```(?:json)?|```$/g, '').trim()) } catch { throw new Error('Gemini did not return valid JSON.') }
  const p = Math.max(0, Math.min(100, Number(j.probability_bot)))
  if (!['bot', 'human', 'unsure'].includes(j.verdict) || Number.isNaN(p)) throw new Error('Gemini answer is missing fields.')
  return { verdict: j.verdict, probability: p / 100, reasons: (j.reasons || []).slice(0, 6).map(String) }
}

export async function askGemini(apiKey, messages, who, fetchImpl = fetch) {
  const res = await fetchImpl('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(messages, who) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } }),
  })
  if (!res.ok) throw new Error(`Gemini request failed (HTTP ${res.status}).`)
  return parseAnswer(await res.json())
}
