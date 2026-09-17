# Text-to-Speech Backend

Node.js + Express API that powers the Text-to-Speech application. It receives
text from the frontend, translates it into the selected language, converts
it to speech using a free Text-to-Speech engine, and returns a playable/
downloadable audio file.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Text-to-Speech:** `google-tts-api` (free, keyless wrapper around Google
  Translate's TTS endpoint)
- **Translation:** `@vitalets/google-translate-api` (free, keyless — lets
  users type in one language and hear it spoken correctly in another)
- **Other libraries:** `cors`, `dotenv`, `morgan`, `express-rate-limit`, `uuid`

## Folder Structure
text-to-speech-backend/
├── server.js # App entry point — middleware, routes, startup
├── routes/
│ ├── ttsRoutes.js # POST /api/tts, GET /api/voices
│ └── healthRoutes.js # GET /api/health
├── controllers/
│ └── ttsController.js # Request handling logic
├── services/
│ └── ttsService.js # Translation + TTS generation + cleanup job
├── middleware/
│ ├── errorHandler.js # Centralized error responses
│ ├── rateLimiter.js # Rate limiting on /api/tts
│ └── validateRequest.js # Content-Type enforcement
├── utils/
│ └── validators.js # Request body validation
├── data/
│ └── voices.js # Static catalog of supported languages/voices
├── audio/ # Generated mp3 files (gitignored, auto-cleaned)
├── .env.example
├── .gitignore
└── package.json


## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Server runs at `http://localhost:5000` by default.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `CLIENT_ORIGIN` | Frontend URL allowed by CORS | `http://localhost:5173` |
| `MAX_TEXT_LENGTH` | Max characters accepted per request | `2000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window (ms) | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `10` |

No API keys are required — both external services used are free and keyless.

## API Reference

### `GET /api/health`
Returns server status.
```json
{ "success": true, "status": "ok", "timestamp": "2026-09-15T10:00:00.000Z" }
```

### `GET /api/voices`
Returns the list of supported languages/voices. Optional `?language=hi` query param filters results.
```json
{
  "success": true,
  "voices": [
    { "id": "hi-IN-default", "name": "Hindi", "language": "hi", "languageLabel": "Hindi", "gender": "Female" }
  ]
}
```

### `POST /api/tts`
Translates (if needed) and converts text to speech.

**Request:**
```json
{ "text": "Hello, this is a test", "voice": "hi-IN-default" }
```

**Success response (201):**
```json
{
  "success": true,
  "audioUrl": "/audio/3f9a2b1c-xxxx.mp3",
  "translatedText": "नमस्ते, यह एक परीक्षण है"
}
```

**Error responses:**
| Status | Cause |
|---|---|
| 400 | Empty text, text too long, missing/invalid voice, wrong Content-Type |
| 404 | Unknown route |
| 429 | Too many requests (rate limited) |
| 500 | Unexpected server error |
| 503 | Translation/TTS provider failed |

### `GET /audio/:filename`
Serves a generated mp3 file (static file serving). Files older than 1 hour are automatically deleted.

## Security Notes

- CORS is restricted to a single allowed origin (`CLIENT_ORIGIN`)
- `/api/tts` is rate-limited to prevent abuse
- No API keys are stored or exposed, since the TTS/translation services used are free and keyless
- Generated audio is not stored permanently — cleaned up hourly

## Deployment

Deployed on **Render**. Set `CLIENT_ORIGIN` in the Render dashboard's environment variables to match your deployed frontend's URL.