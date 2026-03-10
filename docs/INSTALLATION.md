# Installation & Setup Guide

## Prerequisites

- **n8n instance** (cloud.n8n.io or self-hosted)
- **Groq API key** (free tier available at console.groq.com)
- Any modern web browser
- Simple HTTP server (Python, Node.js, or VS Code Live Server)

---

## Step 1: Import n8n Workflow

### Option A: Import from File

1. Open n8n instance → Click **Workflows**
2. Click **Add Workflow** or **Import** button
3. Select **Import from File**
4. Choose `n8n-workflows/chatting-workflow.json`
5. Click **Import**

### Option B: Manual Setup (if import fails)

1. Create a new workflow in n8n
2. Add these nodes in order:
   - **Webhook** (POST, path: `chatapp`)
   - **AI Agent** with custom system prompt
   - **Groq Chat Model** (LLM)
   - **Respond to Webhook**
3. Connect as shown in `ARCHITECTURE.md`

---

## Step 2: Configure Credentials

### Add Groq API Key

1. In n8n, go to **Settings** → **Credentials**
2. Click **New Credential** → Select **Groq**
3. Paste your Groq API key from https://console.groq.com
4. Save the credential
5. In workflow, click **Groq Chat Model** node
6. Select the credential you just created

---

## Step 3: Configure Webhook

1. Open the **Webhook** node in the workflow
2. Note the full webhook URL (should be displayed)
3. Copy it - you'll need it for the frontend

**Example**: `https://your-n8n-instance.com/webhook/chatapp`

---

## Step 4: Setup Frontend

### Update Webhook URL

1. Open `app.js`
2. Find this line (around line 12):
   ```javascript
   WEBHOOK_URL: (() => {
       const urlParam = new URLSearchParams(window.location.search).get('webhook');
       return urlParam || 'http://localhost:5678/webhook/chatapp';
   })(),
   ```
3. Replace `http://localhost:5678/webhook/chatapp` with your n8n webhook URL

### Option A: Pass URL as Query Parameter (Recommended for deployment)
```
http://localhost:8000/?webhook=https://your-n8n-instance.com/webhook/chatapp
```

### Option B: Edit directly in app.js
Update the default value in the code above.

---

## Step 5: Start the Services

### Terminal 1: Start n8n (if self-hosted)
```bash
n8n start
```

### Terminal 2: Start Frontend Server

**Using Python (3.x)**
```bash
python -m http.server 8000
```

**Using Node.js**
```bash
npx http-server -p 8000
```

**Using VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

---

## Step 6: Test the Application

1. Open browser → `http://localhost:8000`
2. Type a message: "What is 2 + 2?"
3. Send message
4. You should see the AI response in the chat

---

## Troubleshooting

### "Network Error"
- Check if n8n webhook is active
- Verify webhook URL in `app.js`
- Check CORS settings (should be allowed by default)

### "No response from AI"
- Verify Groq API key is correct
- Check n8n workflow is active
- Check n8n logs for errors

### "Webhook returns 404"
- Verify webhook path is exactly `chatapp`
- Check webhook is active in Workflow settings

### "Localhost connection refused"
- Ensure HTTP server is running
- Check port 8000 is not in use (`netstat -ano` on Windows)
- Try different port: `python -m http.server 9000`

---

## Deployment to Production

### Keeping Webhook URL Secret

1. Store webhook URL in environment variable or backend
2. Don't hardcode in frontend
3. Use query parameter approach or backend proxy

### Hosting Options

**Frontend**: Netlify, Vercel, GitHub Pages
**Backend**: Managed n8n Cloud or self-hosted

### Setting Environment on n8n Cloud

1. In Workflow settings → **Environment Variables**
2. Add: `GROQ_API_KEY=your_key`
3. Use `$env.GROQ_API_KEY` in webhook response if needed

---

## File Structure

```
simple-chat-ai/
├── index.html                          # Chat UI
├── app.js                             # Frontend logic
├── style.css                          # Styling
├── n8n-workflows/
│   └── chatting-workflow.json          # n8n workflow
├── docs/
│   ├── ARCHITECTURE.md                 # System design
│   ├── INSTALLATION.md                 # This file
│   └── API.md                          # API documentation
├── screenshots/
│   └── [Add workflow screenshot here]
└── README.md                           # Project overview
```

---

## Next Steps

- Customize the system prompt in the AI Agent node
- Add tools/integrations to the AI Agent
- Store messages in a database (add DB Write node)
- Add user authentication
- Deploy to production

For more details, see `ARCHITECTURE.md`
