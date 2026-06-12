# Blu_bot

**Autonomous WhatsApp Business Agent · SaaS Platform**
*by Bluetick Technology Ltd, Lusaka, Zambia*

Blu_bot is a multi-tenant SaaS platform that deploys autonomous AI agents for businesses over WhatsApp. Each business gets an AI agent that reads and replies to customer messages, performs database operations, and escalates to human agents when needed.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend API | Node.js + Hono |
| AI Reasoning | Gemini Flash 2.0 |
| Database | Supabase (Postgres + RLS) |
| Realtime | Supabase Realtime |
| WhatsApp | Meta WABA / waapi.app |
| Auth | Supabase Auth |
| Queue | BullMQ + Redis |
| Billing | Lenco |

## Project Structure

```
blu-bot/
├── apps/
│   ├── api/              ← Hono backend (Node.js + TypeScript)
│   └── dashboard/        ← Next.js 14 frontend
├── .github/workflows/    ← CI/CD pipelines
└── README.md
```

## Getting Started

See the [Engineer Developer Guide](./blu-bot-master-prompt.pdf) for full setup instructions.

### Quick Start

```bash
# Backend
cd apps/api
npm install
cp .env.example .env.local   # Fill in your credentials
npm run dev                   # API on :3001

# Worker (separate terminal)
cd apps/api
npm run worker

# Dashboard
cd apps/dashboard
npm install
cp .env.example .env.local
npm run dev                   # Dashboard on :3000
```

## License

Proprietary — Bluetick Technology Ltd. All rights reserved.
