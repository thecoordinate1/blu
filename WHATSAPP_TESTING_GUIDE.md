# 📱 Blu Bot — WhatsApp Phone Testing Guide

> Follow these steps to test the Blu bot on your real WhatsApp number.  
> **Estimated time:** ~10 minutes

---

## Prerequisites

Before you start, make sure you have:

- [ ] Access to the [Meta for Developers](https://developers.facebook.com/apps/) portal (ask the team lead for access)
- [ ] Node.js 18+ installed on your machine
- [ ] The project cloned from GitHub: `https://github.com/thecoordinate1/blu`
- [ ] The `.env` file (ask the team lead — never commit this to git)
- [ ] Your personal WhatsApp number registered as a test recipient (see Step 3)

---

## Step 1 — Start the Dev Server

Open a terminal in the project folder and run:

```bash
npm install
npm run dev
```

You should see:
```
✓ Ready in Xs
- Local: http://localhost:3000
```

> If you see port `3002` instead of `3000`, use `3002` in all commands below.

---

## Step 2 — Expose Localhost with ngrok

The bot needs a **public HTTPS URL** so Meta's servers can deliver WhatsApp messages to your machine.

Open a **second terminal** and run:

```bash
# Option A — install ngrok via winget (Windows)
winget install ngrok
ngrok http 3000

# Option B — install ngrok via npm (cross-platform)
npx ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abc123.ngrok-free.app → http://localhost:3000
```

📋 **Copy the `https://` URL** — you'll need it in Step 3.

> ⚠️ Keep this terminal open. Closing it kills the tunnel and Meta can no longer reach your server.

---

## Step 3 — Register the Webhook with Meta

1. Go to [Meta for Developers](https://developers.facebook.com/apps/) and open the **Blu app**
2. In the left sidebar, click **WhatsApp → Configuration**
3. Under the **Webhook** section, click **Edit**
4. Fill in:
   - **Callback URL:** `https://YOUR-NGROK-URL.ngrok-free.app/api/webhook/whatsapp`
   - **Verify token:** `blu-agent-secret`
5. Click **Verify and Save**

✅ If it succeeds, the webhook is connected.

> **What happens here:** Meta sends a one-time GET request to your URL to confirm it's valid. Your server responds with the correct token, and Meta saves the webhook.

---

## Step 4 — Add Your Phone as a Test Recipient

WhatsApp Business accounts in development mode can only message pre-approved numbers.

1. In the Meta portal, go to **WhatsApp → API Setup**
2. Under **Send and receive messages**, find the **To** dropdown
3. Click **Manage phone number list**
4. Add your WhatsApp number (e.g. `+260977123456`)
5. You'll receive a confirmation code on WhatsApp — enter it to verify

---

## Step 5 — Send a Test Message

Open WhatsApp on your phone and send a message to the Blu business number:

```
+1 195 923 860 268 489
```

Try messages like:
- `Hello! What plans do you offer?`
- `I need help with my account`
- `What are your business hours?`
- `I want to speak to a human` ← triggers escalation detection

---

## Step 6 — Verify It Worked

**On your phone:** You should receive a reply from the bot within 5–15 seconds.

**In your terminal** (dev server), look for these log lines:
```
[WhatsApp Webhook] Received from +260977XXXXXX: Hello! What plans do you offer?
[Agent Pipeline] Generated response: <the AI reply>
```

**In the dashboard** at `http://localhost:3000/dashboard`:
- A new conversation will appear under **Conversations**
- The AI reply will be visible in the message thread

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Webhook verification fails | Make sure the dev server is running and ngrok URL is correct |
| Bot receives message but doesn't reply | Check the terminal for `[Agent Pipeline]` error logs |
| `ENOTFOUND generativelanguage.googleapis.com` | Your machine has no internet — check network/VPN |
| `503 Service Unavailable` from Gemini | High demand on the AI model — the bot will auto-retry and fall back to a safe reply |
| Message not delivered to phone | Your number may not be on the approved test recipient list (see Step 4) |
| ngrok URL expired | Free ngrok URLs reset on restart — re-register the new URL in Meta each session |

---

## Going to Production (Permanent URL)

Once you're ready to move beyond local testing, deploy to Firebase:

```bash
firebase deploy
```

Use the resulting `https://your-app.web.app` URL as the permanent webhook in Meta — no ngrok required.

---

## Key Credentials (ask team lead for values)

| Item | Where to find it |
|---|---|
| `.env` file | Team lead / shared secret manager |
| Meta app access | [developers.facebook.com](https://developers.facebook.com/apps/) |
| Supabase dashboard | [supabase.com/dashboard](https://supabase.com/dashboard) |
| WhatsApp business number | `WHATSAPP_FROM_NUMBER` in `.env` |
| Webhook verify token | `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env` |

---

*Last updated: June 2026 — Blu Platform v1.0*
