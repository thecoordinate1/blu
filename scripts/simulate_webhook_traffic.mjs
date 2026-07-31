import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Command Line Arguments Parsing ──────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return defaultValue;
}

const TARGET_URL = getArg('--url', 'https://blu-mauve-theta.vercel.app/api/webhook/whatsapp');
const TOTAL_REQUESTS = parseInt(getArg('--count', '250'), 10);
const INTERVAL_SECONDS = parseInt(getArg('--interval', '120'), 10);
const TEAM_MEMBER = parseInt(getArg('--member', '1'), 10);
const STATE_FILE = path.join(__dirname, `test_progress_member${TEAM_MEMBER}.json`);

// ── Diverse Customer Queries Pool (50 Prompts) ──────────────────────────────
const CUSTOMER_PROMPTS = [
  "Hi! What products do you have in stock?",
  "How much does a Solar Kit cost?",
  "Do you have USB Charging Cables in stock?",
  "What is your pricing in Kwacha for accessories?",
  "What are your business hours?",
  "Where is your shop located?",
  "Do you offer delivery to Lusaka?",
  "Can I talk to a human support agent?",
  "I want to speak to a manager right now.",
  "Are there any discounts available today?",
  "Hello, do you sell solar panels?",
  "Is the solar kit covered by warranty?",
  "What payment methods do you accept?",
  "Can I pay via Airtel Money or MTN Mobile Money?",
  "Do you have power banks in stock?",
  "How long does delivery take?",
  "Hi, I need help choosing a solar system.",
  "What is the price of the basic solar package?",
  "Are all items listed in Kwacha?",
  "I need urgent technical support.",
  "Can I cancel my order?",
  "Hello, is anyone online?",
  "What products are currently out of stock?",
  "Do you sell in bulk or wholesale?",
  "Can you send me a price list?",
  "Hi Blu_bot! What can you help me with?",
  "Do you deliver outside Lusaka?",
  "Is shipping free for orders above K1000?",
  "I need a sales invoice for my company.",
  "How do I return a damaged item?",
  "Do you have LED bulb lights in stock?",
  "Can I reserve an item for pickup tomorrow?",
  "What is your customer support contact number?",
  "Hi! Do you have solar inverters?",
  "Can I pay cash on delivery?",
  "Do you offer installation services?",
  "I want to speak to customer service.",
  "Are your prices inclusive of VAT?",
  "Hello, do you have any special promotions this week?",
  "What is your highest capacity solar battery?",
  "How can I track my order status?",
  "Can I get a quotation for 5 solar kits?",
  "Hi, do you sell laptop power adapters?",
  "Are you open on weekends?",
  "Can you transfer me to an agent?",
  "Hello! What is your return policy?",
  "Do you have rechargeable solar lamps?",
  "How can I contact the store owner?",
  "What is the price of the USB fast charger?",
  "Hi! Thanks for your help!"
];

// ── Customer Profile Generator ──────────────────────────────────────────────
function getCustomerProfile(index, member) {
  const basePhone = member === 1 ? 260970000000 : 260975000000;
  const phoneNumber = `${basePhone + index}`;
  const names = ["Chipo", "Mutale", "Kabwe", "Thandiwe", "Bwembya", "Mwape", "Lombe", "Sipho", "Chanda", "Zindaba"];
  const name = names[index % names.length] + ` (Tester M${member})`;
  return { phoneNumber, name };
}

// ── Webhook Payload Builder ──────────────────────────────────────────────────
function buildWebhookPayload(prompt, customer, index) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "100000000000000",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15550000000",
                phone_number_id: "1195923860268489"
              },
              contacts: [
                {
                  profile: { name: customer.name },
                  wa_id: customer.phoneNumber
                }
              ],
              messages: [
                {
                  from: customer.phoneNumber,
                  id: `wamid.autotest_m${TEAM_MEMBER}_${index}_${Date.now()}`,
                  timestamp: `${Math.floor(Date.now() / 1000)}`,
                  text: { body: prompt },
                  type: "text"
                }
              ]
            },
            field: "messages"
          }
        ]
      }
    ]
  };
}

// ── Load / Save State ───────────────────────────────────────────────────────
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch {
      // Fallback default
    }
  }
  return { completedRequests: 0, successfulRequests: 0, failedRequests: 0, logs: [] };
}

function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save state:', err);
  }
}

// ── Send Webhook Request ────────────────────────────────────────────────────
async function sendWebhookRequest(index) {
  const customer = getCustomerProfile(index, TEAM_MEMBER);
  const prompt = CUSTOMER_PROMPTS[index % CUSTOMER_PROMPTS.length];
  const payload = buildWebhookPayload(prompt, customer, index);

  const startTime = Date.now();
  console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 Request ${index + 1}/${TOTAL_REQUESTS} (Team Member ${TEAM_MEMBER})`);
  console.log(`📱 Customer: ${customer.name} (${customer.phoneNumber})`);
  console.log(`💬 Message: "${prompt}"`);

  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - startTime;
    const isSuccess = response.ok;
    const bodyText = await response.text();

    console.log(`⏱️ Response Time: ${duration}ms | HTTP ${response.status}`);
    console.log(`📥 Result: ${bodyText.trim()}`);

    return {
      index: index + 1,
      timestamp: new Date().toISOString(),
      status: response.status,
      durationMs: duration,
      prompt,
      customer: customer.name,
      success: isSuccess,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Request ${index + 1} Failed:`, err.message);

    return {
      index: index + 1,
      timestamp: new Date().toISOString(),
      status: 0,
      durationMs: duration,
      prompt,
      customer: customer.name,
      error: err.message,
      success: false,
    };
  }
}

// ── Main Controller Loop ───────────────────────────────────────────────────
async function run() {
  console.log(`=======================================================`);
  console.log(`🤖 Blu_bot WhatsApp Webhook Test Runner`);
  console.log(`🌐 Target Endpoint: ${TARGET_URL}`);
  console.log(`🎯 Target Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`⏳ Pacing Interval: 1 request every ${INTERVAL_SECONDS} seconds`);
  console.log(`👥 Team Member ID: ${TEAM_MEMBER}`);
  console.log(`=======================================================\n`);

  const state = loadState();
  let startIndex = state.completedRequests;

  if (startIndex >= TOTAL_REQUESTS) {
    console.log(`🎉 All ${TOTAL_REQUESTS} requests for Team Member ${TEAM_MEMBER} have already completed!`);
    console.log(`Total Success: ${state.successfulRequests} | Total Failed: ${state.failedRequests}`);
    return;
  }

  console.log(`▶️ Resuming from request index ${startIndex + 1}...`);

  for (let i = startIndex; i < TOTAL_REQUESTS; i++) {
    const log = await sendWebhookRequest(i);
    
    state.completedRequests = i + 1;
    if (log.success) {
      state.successfulRequests++;
    } else {
      state.failedRequests++;
    }
    state.logs.push(log);
    saveState(state);

    if (i < TOTAL_REQUESTS - 1) {
      console.log(`⏳ Waiting ${INTERVAL_SECONDS} seconds before sending request ${i + 2}/${TOTAL_REQUESTS}...`);
      await new Promise(resolve => setTimeout(resolve, INTERVAL_SECONDS * 1000));
    }
  }

  console.log(`\n=======================================================`);
  console.log(`🎉 COMPLETED ALL ${TOTAL_REQUESTS} REQUESTS!`);
  console.log(`✅ Success: ${state.successfulRequests} | ❌ Failed: ${state.failedRequests}`);
  console.log(`=======================================================`);
}

run();
