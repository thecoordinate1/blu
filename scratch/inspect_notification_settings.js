const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Querying notification_settings...');
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching notification_settings:', error.message);
  } else {
    console.log('Sample row from notification_settings table:', JSON.stringify(data?.[0] || {}, null, 2));
  }
}

run().catch(console.error);
