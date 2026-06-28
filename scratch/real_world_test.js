const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const TEST_EMAIL = `test-onboarding-${Date.now()}@blubot.com`;
const TEST_PASSWORD = 'password123';
const TEST_PHONE = '260971234567';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('=== Starting Real World Test ===');
  let testUserId = null;
  let testBusinessId = null;

  try {
    // -------------------------------------------------------------
    // STEP 1: Business Onboarding Flow (User Signup)
    // -------------------------------------------------------------
    console.log(`\nStep 1: Simulating new user signup with email: ${TEST_EMAIL}`);
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Business Corp'
      }
    });

    if (signUpError) {
      throw new Error(`Auth Signup failed: ${signUpError.message}`);
    }

    testUserId = authData.user.id;
    console.log(`User created successfully with ID: ${testUserId}`);

    // Wait a brief moment for the database trigger to run
    await sleep(2000);

    // Verify business creation
    console.log('\nChecking if business profile was auto-created via trigger...');
    const { data: businessData, error: busError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', testUserId)
      .maybeSingle();

    if (busError) {
      throw new Error(`Error querying business profile: ${busError.message}`);
    }

    if (!businessData) {
      throw new Error('Business profile was NOT auto-created on user signup!');
    }

    testBusinessId = businessData.id;
    console.log('Business profile verified successfully!');
    console.log(JSON.stringify(businessData, null, 2));

    // -------------------------------------------------------------
    // STEP 2: Verify Webhook and AI Automated Reply Flow
    // -------------------------------------------------------------
    console.log('\nStep 2: Simulating incoming customer message on WhatsApp...');
    const messagePayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'demo-wa-business-id',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '1195923860268489',
                  phone_number_id: '1195923860268489'
                },
                messages: [
                  {
                    from: TEST_PHONE,
                    id: `wamid.test-${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                      body: 'Hi Blu_bot! What are your subscription plans and pricing rates?'
                    },
                    type: 'text'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    console.log('Sending message payload to webhook at http://localhost:3002/api/webhook/whatsapp ...');
    const webhookRes = await fetch('http://localhost:3002/api/webhook/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!webhookRes.ok) {
      throw new Error(`Webhook request failed: ${webhookRes.status} ${webhookRes.statusText}`);
    }

    console.log('Webhook responded immediately with 200 OK. Waiting for AI agent processing...');
    
    // Wait for the asynchronous processMessageAsync to run Genkit flows and update DB
    // We wait 8 seconds to allow Gemini API to respond
    console.log('Sleeping for 8 seconds to allow Gemini processing...');
    await sleep(8000);

    // Verify conversation was created in DB
    console.log('\nChecking DB for created conversation and messages...');
    const { data: conversationData, error: convoError } = await supabase
      .from('conversations')
      .select('*')
      .eq('business_id', testBusinessId)
      .eq('customer_number', TEST_PHONE)
      .maybeSingle();

    if (convoError) {
      throw new Error(`Failed to query conversations: ${convoError.message}`);
    }

    if (!conversationData) {
      throw new Error(`No conversation was created in DB for customer ${TEST_PHONE}`);
    }

    console.log('Conversation created in DB:');
    console.log(JSON.stringify(conversationData, null, 2));

    // Verify messages saved
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationData.id)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw new Error(`Failed to query messages: ${msgError.message}`);
    }

    console.log(`\nFound ${messages.length} messages in conversation:`);
    messages.forEach((msg, idx) => {
      console.log(`[${idx + 1}] Role: ${msg.role} | Content: "${msg.content}"`);
    });

    const inboundMsg = messages.find(m => m.role === 'user');
    const replyMsg = messages.find(m => m.role === 'agent');

    if (!inboundMsg) throw new Error('Inbound customer message was not saved to messages table!');
    if (!replyMsg) throw new Error('AI automated reply was not generated/saved to messages table!');

    console.log('AI Reply Flow successful!');

    // -------------------------------------------------------------
    // STEP 3: Verify AI Escalation Flow
    // -------------------------------------------------------------
    console.log('\nStep 3: Simulating a frustrated customer requesting human escalation...');
    const escalationPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'demo-wa-business-id',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '1195923860268489',
                  phone_number_id: '1195923860268489'
                },
                messages: [
                  {
                    from: TEST_PHONE,
                    id: `wamid.test-escalate-${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                      body: 'This bot is useless. Connect me with a real human support agent immediately! I am very angry.'
                    },
                    type: 'text'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    };

    console.log('Sending frustration payload to webhook...');
    const escRes = await fetch('http://localhost:3002/api/webhook/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(escalationPayload)
    });

    if (!escRes.ok) {
      throw new Error(`Webhook escalation request failed: ${escRes.status} ${escRes.statusText}`);
    }

    console.log('Escalation payload sent. Sleeping for 8 seconds for processing...');
    await sleep(8000);

    // Verify conversation status is escalated
    console.log('\nChecking DB for conversation escalation status...');
    const { data: updatedConvo, error: updConvoError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationData.id)
      .single();

    if (updConvoError) {
      throw new Error(`Failed to query updated conversation: ${updConvoError.message}`);
    }

    console.log('Conversation status in DB:', updatedConvo.status);
    console.log('Conversation summary/reason:', updatedConvo.summary);

    if (updatedConvo.status !== 'escalated') {
      throw new Error('Conversation was NOT escalated as expected!');
    }

    console.log('Escalation Flow successful!');

  } catch (error) {
    console.error('\n❌ Test execution failed with error:', error.message);
  } finally {
    // -------------------------------------------------------------
    // STEP 4: Cleanup Test Data
    // -------------------------------------------------------------
    console.log('\nStep 4: Cleaning up test data...');
    if (testUserId) {
      console.log(`Deleting test user ${testUserId} (cascades database deletions)...`);
      const { error: cleanupError } = await supabase.auth.admin.deleteUser(testUserId);
      if (cleanupError) {
        console.error('Failed to clean up test user:', cleanupError.message);
      } else {
        console.log('Clean up completed successfully.');
      }
    }
    console.log('=== Test Run Finished ===');
  }
}

runTest();
