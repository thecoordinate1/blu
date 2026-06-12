-- ============================================================
-- Blu_bot Seed Data
-- ============================================================

-- Test business
INSERT INTO businesses (id, name, ops_number, primary_number, api_key, gemini_context, subscription_tier)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Acme Corp',
  '+260971234567',
  '+260979876543',
  'test-api-key-123',
  '{
    "persona": "Friendly and professional assistant for Acme Corp",
    "knowledge_base": "We sell electronics and gadgets. Business hours are 8am-5pm CAT.",
    "tone": "professional",
    "capabilities": ["order_lookup", "product_info", "complaint_handling"]
  }'::jsonb,
  'starter'
);

-- Test conversation
INSERT INTO conversations (id, business_id, contact_wa_id, status, agent_context)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '+260955111222',
  'active',
  '{"summary": "Customer asking about product availability"}'::jsonb
);

-- Test messages
INSERT INTO messages (business_id, conversation_id, direction, role, body, wa_message_id)
VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'inbound',
    'user',
    'Hi, do you have the new Samsung Galaxy in stock?',
    'wamid.test001'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'outbound',
    'assistant',
    'Hello! Yes, we currently have the Samsung Galaxy S24 in stock. Would you like to know the price or place an order?',
    'wamid.test002'
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'inbound',
    'user',
    'How much is it?',
    'wamid.test003'
  );
