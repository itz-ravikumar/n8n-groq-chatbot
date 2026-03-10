# API Documentation

## Webhook Endpoint

### Base URL
```
http://your-n8n-server:5678/webhook/chatapp
```

Or in production, your n8n cloud URL + `/webhook/chatapp`

---

## Request Format

### Method: POST

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "message": "Your user message here"
}
```

### Example cURL
```bash
curl -X POST http://localhost:5678/webhook/chatapp \
  -H "Content-Type: application/json" \
  -d '{"message": "What is AI?"}'
```

---

## Response Format

### Success Response (HTTP 200)

```json
{
  "text": "✅ Final Answer:\n\nAI (Artificial Intelligence) is the simulation of human intelligence by machines."
}
```

### Error Response (HTTP 4xx/5xx)

```json
{
  "error": "Error message describing what went wrong"
}
```

---

## Response Format Features

The AI Agent enforces structured Markdown formatting:

### 1. **For Comparisons** → Tables
```
| Feature | Option A | Option B |
|---------|----------|----------|
| Price   | $10      | $15      |
| Speed   | Fast     | Slow     |
```

### 2. **For Explanations** → Bullet Points
```
- First point
- Second point
- Third point
```

### 3. **For Procedures** → Numbered Steps
```
1. First step
2. Second step
3. Third step
```

### 4. **For Calculations** → Boxed Final Answer
```
Working through the problem...

✅ Final Answer:
Result = 42
```

---

## System Prompt

The AI Agent uses this system prompt:

```
You are a precise and structured AI assistant.

Always follow these rules:

1. Give clear, direct answers.
2. Use simple language.
3. If the answer involves comparison, data, pros/cons, or categories → use a Markdown table.
4. If explaining steps → use numbered steps.
5. If listing ideas → use bullet points.
6. If solving a math or coding problem → show steps and then provide a clearly separated final answer section.
7. Highlight final answers using:
   ✅ Final Answer:
8. Never add unnecessary introduction or filler text.
9. Keep responses clean and properly formatted in Markdown.
```

To customize, edit the AI Agent node in the n8n workflow.

---

## Timeout & Rate Limits

- Request timeout: 30 seconds (n8n default)
- No built-in rate limiting (implement in reverse proxy if needed)
- AI response time: 2-10 seconds depending on Groq availability

---

## Frontend Integration Example

### JavaScript/Fetch
```javascript
const webhook_url = 'http://localhost:5678/webhook/chatapp';

async function sendMessage(message) {
  try {
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('AI Response:', data.text);
    return data.text;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage
sendMessage('What is 2 + 2?');
```

### Python/Requests
```python
import requests
import json

webhook_url = 'http://localhost:5678/webhook/chatapp'

def send_message(message):
    response = requests.post(
        webhook_url,
        json={"message": message},
        headers={"Content-Type": "application/json"}
    )
    return response.json()

# Usage
result = send_message('What is 2 + 2?')
print(result['text'])
```

### cURL
```bash
curl -X POST http://localhost:5678/webhook/chatapp \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 2 + 2?"}' \
  | jq '.text'
```

---

## Testing the Endpoint

### Using Postman

1. Create new POST request
2. URL: `http://localhost:5678/webhook/chatapp`
3. Body (raw JSON):
   ```json
   {
     "message": "Hello, how are you?"
   }
   ```
4. Send

### Using REST Client (VS Code)

Create `test.http`:
```http
POST http://localhost:5678/webhook/chatapp
Content-Type: application/json

{
  "message": "What is 2 + 2?"
}
```

Then click "Send Request" in the editor.

---

## Webhook Configuration in n8n

### Node Settings

- **HTTP Method**: POST
- **Path**: chatapp
- **Response Mode**: Using "Respond to Webhook" node

### Optional Parameters

The current setup expects only `message` field. To extend:

1. Edit the Webhook node
2. Add custom fields in JSON schema if needed
3. Reference them in AI Agent with `$json.body.fieldname`

---

## CORS Policy

- By default, n8n webhooks allow all origins
- If you get CORS errors, implement a reverse proxy or CORS middleware
- For production, consider restricting to known frontend domains

---

## Security Considerations

1. **Webhook URL is public** - Anyone with the URL can send messages
2. **No authentication** - Add auth if needed (use Authorization header)
3. **API Key visible in frontend** - Keep API keys on n8n side only
4. **Input validation** - The AI Agent processes all inputs, be cautious with sensitive data

### Adding Authentication (Optional)

See n8n documentation on adding authentication headers or JWT validation.

---

## Extending the API

### Add Message History

Modify the request to include history:
```json
{
  "message": "Current question",
  "history": [
    {"role": "user", "text": "Previous question"},
    {"role": "assistant", "text": "Previous answer"}
  ]
}
```

Then wire a Memory node in n8n to use this history.

### Add User Identification

```json
{
  "message": "Question",
  "userId": "user123"
}
```

Use this to store separate conversation threads.

---

## Performance

- Average response time: 2-5 seconds
- Groq API typically processes >= 30 tokens/second
- Longer conversations may take more time
- Consider caching frequent queries

---

## Debugging

Check n8n workflow execution logs:
1. Open workflow in n8n
2. Click execution history
3. View logs for each node
4. Debug individual node outputs

Enable verbose logging in n8n settings if needed.
