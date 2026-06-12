-- ============================================================
-- Blu_bot Database Schema
-- Migration: 00001_create_schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────
-- BUSINESSES
-- ──────────────────────────────────────────────
CREATE TABLE businesses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  ops_number    TEXT NOT NULL UNIQUE,
  primary_number TEXT NOT NULL,
  gemini_context JSONB DEFAULT '{}'::jsonb,
  subscription_tier TEXT NOT NULL DEFAULT 'starter',
  api_key       TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- CONVERSATIONS
-- ──────────────────────────────────────────────
CREATE TABLE conversations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  contact_wa_id    TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active',
  last_message_at  TIMESTAMPTZ DEFAULT now(),
  escalation_reason TEXT,
  agent_context    JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- MESSAGES
-- ──────────────────────────────────────────────
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  body            TEXT,
  media_url       TEXT,
  wa_message_id   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────
-- AGENT ACTIONS
-- ──────────────────────────────────────────────
CREATE TABLE agent_actions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  action_type     TEXT NOT NULL,
  payload         JSONB DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'pending',
  executed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Helper: resolve business_id from the api_key stored in app.api_key setting
-- Every policy gates on this so tenants can never cross-read.

CREATE POLICY "businesses_tenant_isolation" ON businesses
  FOR ALL
  USING (id = (SELECT b.id FROM businesses b WHERE b.api_key = current_setting('app.api_key', true)))
  WITH CHECK (id = (SELECT b.id FROM businesses b WHERE b.api_key = current_setting('app.api_key', true)));

CREATE POLICY "conversations_tenant_isolation" ON conversations
  FOR ALL
  USING (business_id = (SELECT b.id FROM businesses b WHERE b.api_key = current_setting('app.api_key', true)))
  WITH CHECK (business_id = (SELECT b.id FROM businesses b WHERE b.api_key = current_setting('app.api_key', true)));

CREATE POLICY "messages_tenant_isolation" ON messages
  FOR ALL
  USING (business_id = (SELECT b.id FROM businesses b WHERE b.api_key = current_setting('app.api_key', true)))
  WITH CHECK (business_id = (SELECT b.id FROM businesses b WHERE b.api_key = current_setting('app.api_key', true)));

CREATE POLICY "agent_actions_tenant_isolation" ON agent_actions
  FOR ALL
  USING (business_id = (SELECT b.id FROM businesses b WHERE b.api_key = current_setting('app.api_key', true)))
  WITH CHECK (business_id = (SELECT b.id FROM businesses b WHERE b.api_key = current_setting('app.api_key', true)));

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_conversations_business_status ON conversations(business_id, status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_business ON messages(business_id);
CREATE INDEX idx_agent_actions_business ON agent_actions(business_id);
CREATE INDEX idx_businesses_ops_number ON businesses(ops_number);
CREATE INDEX idx_businesses_api_key ON businesses(api_key);
