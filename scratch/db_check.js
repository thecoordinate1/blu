const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDb() {
  // Check payments
  const { data: payments, error: payErr } = await supabase.from('payments').select('*');
  if (payErr) {
    console.error('Error fetching payments:', payErr);
  } else {
    console.log('Payments count:', payments.length);
    console.log('Payments:', JSON.stringify(payments, null, 2));
  }
}

checkDb();
