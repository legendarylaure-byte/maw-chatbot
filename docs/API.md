# MAWbot API Documentation

## Chat

### POST /api/chat
Send a message to the chatbot.

```json
{
  "message": "Tell me about MAW Group",
  "language": "en"
}
```

Response:
```json
{
  "response": "MAW Group is Nepal's leading automobile conglomerate..."
}
```

## Text-to-Speech

### POST /api/tts
Generate speech audio.

```json
{
  "text": "Namaste!",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "stability": 0.5,
  "similarityBoost": 0.75
}
```

Response: audio/mpeg binary

## Auth

### POST /api/auth
Verify Firebase ID token.

```json
{
  "idToken": "firebase-id-token"
}
```

Response:
```json
{
  "uid": "...",
  "email": "...",
  "isAdmin": false
}
```

## Admin

### GET /api/admin/memory?type=memory
List memory entries (requires admin auth).

### POST /api/admin/memory
CRUD operations on collections.

```json
{
  "action": "create",
  "collection": "memory",
  "data": { ... }
}
```

## Feedback

### POST /api/feedback
Submit thumbs up/down.

```json
{
  "messageId": "abc123",
  "rating": "up",
  "comment": "Great answer!"
}
```
