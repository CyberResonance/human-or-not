# Human or Not

Paste a chat transcript and see whether the other side writes like a **bot or a human**, with every signal explained.
There's also a practice mode with example chats, so you can train your own eye.

Everything runs in the browser. Nothing is sent anywhere unless you ask Gemini for a second opinion with your own API key.

## Features

- **Chat analyser.** Paste lines as `Name: text`, optionally with times like `[14:02:10]`. Pick the speaker to check and get:
  - a verdict: likely bot, likely human, or hard to tell;
  - a confidence level;
  - a 0–100% bot-likeness meter.
- **Seven explained signals:**

  | Signal | What it looks at |
  |---|---|
  | Assistant-style phrasing | "I hope this helps", "let me know if", em dashes… |
  | Spelling and punctuation | perfectly capitalised, fully punctuated messages |
  | Slang, emoji, typos | casual writing that bots rarely produce |
  | Message length | long, evenly sized replies |
  | Lists and formatting | bullet points, numbering, bold text |
  | Repetition | repeated openings, duplicate messages, low word variety |
  | Reply speed | replies that would need typing faster than 12 characters per second (only with timestamps) |

  Phrasing, formatting and repetition count only when they're present, because their absence says nothing.
  Chats with only a few messages are pulled towards 50%, since there's little evidence.
- **Gemini second opinion (optional).**
  - Uses `gemini-2.5-flash` with your own key.
  - The key is sent as a request header, kept only in the open tab, and never saved.
- **Practice mode.** Six example chats (support bot, dating-app bot, job-scam bot, and three real-sounding people). Guess first, then see what the analyser noticed. Your score is tracked.

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

Build a static version that you can host anywhere:

```bash
npm run build
```

## Tests

```bash
npm test
```

17 Vitest tests cover:
- transcript parsing;
- speaker detection;
- the verdict on every practice chat;
- low-evidence handling;
- the Gemini prompt and answer parsing, including that the API key never appears in the URL.

## Limits

The analyser uses heuristics, so treat its result as a hint, not proof. A careful human can write like a bot, and a well-prompted bot can fake typos.
The practice chats were written for this app.

## License

MIT, see [LICENSE](LICENSE). Built by [CyberResonance](https://cyberresonance.io).
