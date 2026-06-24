# Connect Dashboard to Real Data & Fix Bot

The dashboard pages are almost entirely hardcoded with mock data. The TypeScript types are severely out of sync with the actual SQL schema. The WhatsApp sender crashes if env vars are missing.

## User Review Required

> [!IMPORTANT]
> The `agent_actions` table was never created in the database but is referenced in the Audit Log page. I will create a new migration to add it, along with adding TypeScript types for `payments`.

> [!WARNING]
> The dashboard currently shows hardcoded Zambian Kwacha revenue figures, order counts, and inventory from localStorage. Since there is no `orders` or `products` table in the database, the dashboard KPIs will be derived from **conversations**, **messages**, and **payments** data — which is the real data the bot generates. Inventory management will remain localStorage-based for now unless you want a products table added.

## Proposed Changes

---

### 1. Fix TypeScript Database Types

Sync types to match the **actual SQL migration** columns exactly.

#### [MODIFY] [database.ts](file:///c:/Users/User/Documents/blu/src/lib/types/database.ts)
- Fix `businesses` columns: remove `ops_number`, `primary_number`, `gemini_context`; add `whatsapp_number`; fix tier values to `free|pro|enterprise`
- Fix `conversations` columns: rename `contact_wa_id` → `customer_number`; fix status values to `active|escalated|resolved`; replace `escalation_reason`/`agent_context` with `summary`/`metadata`
- Fix `messages` columns: remove `direction`, `media_url`, `wa_message_id`; rename `body` → `content`; add `business_id`; fix role values to `user|agent|system`
- Add `payments` table types
- Add `agent_actions` table types (matching the new migration)

---

### 2. Create `agent_actions` Migration

#### [NEW] [20260624000000_agent_actions.sql](file:///c:/Users/User/Documents/blu/supabase/migrations/20260624000000_agent_actions.sql)
- Create `agent_actions` table: `id`, `conversation_id`, `business_id`, `action_type`, `payload`, `status`, `executed_at`
- Add indexes and RLS policies
- Wire the webhook to log agent actions (AI responses, escalations)

---

### 3. Fix WhatsApp Sender (Crash Prevention)

#### [MODIFY] [sender.ts](file:///c:/Users/User/Documents/blu/src/lib/whatsapp/sender.ts)
- Use lazy initialization instead of throwing in constructor at module level
- Log a warning instead of crashing if env vars are missing

---

### 4. Connect Dashboard Page to Supabase

#### [MODIFY] [page.tsx](file:///c:/Users/User/Documents/blu/src/app/(dashboard)/dashboard/page.tsx)
- Replace hardcoded KPI cards with real queries:
  - **Total Conversations**: `COUNT(*)` from `conversations`
  - **Messages Handled**: `COUNT(*)` from `messages` where role = 'agent'
  - **Escalations**: `COUNT(*)` from `conversations` where status = 'escalated'
  - **Payments**: `SUM(amount)` from `payments` where status = 'successful'
- Replace hardcoded "Agent Impact" with real message/conversation counts
- Keep inventory management as localStorage (no DB table for products yet)
- Keep revenue chart structure but populate with real payment data when available, fallback to "No data yet" states

---

### 5. Connect Analytics Page to Supabase

#### [MODIFY] [page.tsx](file:///c:/Users/User/Documents/blu/src/app/(dashboard)/analytics/page.tsx)
- Replace hardcoded metric cards with real queries from conversations, messages, and payments tables
- Replace random heatmap with real message timestamps grouped by hour/day
- Replace hardcoded revenue sources with payment method breakdown

---

### 6. Connect Audit Log Page to Supabase

#### [MODIFY] [page.tsx](file:///c:/Users/User/Documents/blu/src/app/(dashboard)/audit-log/page.tsx)
- Query `agent_actions` table for real bot activity logs
- Show actual AI responses, escalations, and status changes
- Fall back to empty state when no data exists

---

### 7. Update Webhook to Log Agent Actions

#### [MODIFY] [route.ts](file:///c:/Users/User/Documents/blu/src/app/api/webhook/whatsapp/route.ts)
- Insert into `agent_actions` when the bot sends a response (action_type: 'auto_reply')
- Insert into `agent_actions` when escalation is triggered (action_type: 'escalation')

---

### 8. Fix Sidebar with Real Business Info

#### [MODIFY] [layout.tsx](file:///c:/Users/User/Documents/blu/src/app/(dashboard)/layout.tsx)
- Fetch the authenticated user's business name from Supabase
- Show real message count vs tier limit in footer usage bar

---

## Verification Plan

### Automated Tests
- `npm run build` — ensure TypeScript compiles with the corrected types

### Manual Verification
- Navigate to `/dashboard` and verify KPIs show real counts (or "0" if no data yet instead of fake numbers)
- Navigate to `/conversations` and verify it still works with realtime
- Navigate to `/analytics` and verify real data or empty states
- Navigate to `/audit-log` and verify it shows real bot actions or empty state
- Send a WhatsApp message to the bot and verify the action appears in the audit log
