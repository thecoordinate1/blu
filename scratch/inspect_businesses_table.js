const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching businesses:', error);
    return;
  }

  console.log('Sample row from businesses table:', JSON.stringify(data?.[0] || {}, null, 2));
}

run().catch(console.error);
