# Architecture Overview

## System Flow

```
┌─────────────────────┐
│   Frontend (Browser) │
│  (index.html)        │
│  (app.js)            │
│  (style.css)         │
└──────────┬───────────┘
           │
           │ Fetch POST
           │ {"message": "user input"}
           ↓
┌──────────────────────┐
│  n8n Webhook Node    │
│  Path: /webhook/     │
│        chatapp       │
└──────────┬───────────┘
           │
           │ Processes Message
           ↓
┌──────────────────────┐
│   AI Agent Node      │
│  - System Prompt     │
│  - Message Context   │
│  - Structured Output │
└──────────┬───────────┘
           │
           │ AI Processing
           ↓
┌──────────────────────┐
│ Groq Chat Model      │
│ (gpt-oss-20b)        │
│ (Requires API Key)   │
└──────────┬───────────┘
           │
           │ Generation
           ↓
┌──────────────────────┐
│ Respond to Webhook   │
│ JSON Response        │
└──────────┬───────────┘
           │
           │ HTTP 200
           │ {"text": "AI Response"}
           ↓
┌─────────────────────┐
│   Frontend (Browser) │
│   Display Response   │
│   Store in History   │
└─────────────────────┘
```

## Components

### Frontend (HTML/CSS/JavaScript)
- **File**: `index.html`, `app.js`, `style.css`
- **Technology**: Vanilla JavaScript (no dependencies)
- **Responsibility**: 
  - Display chat UI
  - Send messages via webhook
  - Display AI responses
  - Store message history locally

### Backend (n8n Workflow)
- **File**: `n8n-workflows/chatting-workflow.json`
- **Nodes**:
  - **Webhook**: Receives POST requests with user messages
  - **AI Agent**: Processes message with system prompt, enforces structured output
  - **Groq Chat Model**: LLM for generating responses (requires Groq API key)
  - **Respond to Webhook**: Sends response back to frontend

## API Endpoint

### Request
```
POST http://your-n8n-server:5678/webhook/chatapp
Content-Type: application/json

{
  "message": "What is 2+2?"
}
```

### Response
```json
{
  "text": "✅ Final Answer:\n\n2 + 2 = 4"
}
```

## Key Features

### 1. **Structured Output**
The AI Agent enforces:
- Tables for comparisons
- Bullet points for explanations
- Numbered steps for procedures
- Boxed final answers for calculations

### 2. **Message Processing**
- User message extracts from request body
- AI Agent processes with custom system prompt
- Response formatted in Markdown

### 3. **Groq AI Model**
- Uses OpenAI-compatible API
- Model: `gpt-oss-20b`
- Requires credentials setup in n8n

## Environment Variables

For n8n workflow to work, ensure these are configured:

```
GROQ_API_KEY=your_groq_api_key_here
```

## Deployment

### Development
```bash
# Terminal 1: Start n8n locally (or connect to cloud instance)
n8n start

# Terminal 2: Start frontend server
npx http-server -p 8000
```

Visit: `http://localhost:8000`

Webhook URL: `http://localhost:5678/webhook/chatapp`

### Production
1. Deploy n8n on server or cloud
2. Deploy frontend on CDN or web server
3. Update webhook URL in `app.js` configuration
4. Ensure Groq API credentials are set as environment variables on n8n

## LocalStorage
Messages are stored in browser localStorage with key: `simple_chat_history`

## Error Handling
- Network errors: Display error message to user
- n8n errors: HTTP error response displayed in chat
- Validation: Frontend validates message before sending
