const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: tables, error: tableError } = await supabase
    .rpc('get_tables'); // standard check if available, or just query phone_numbers

  console.log('Querying phone_numbers...');
  const { data, error } = await supabase
    .from('phone_numbers')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching phone_numbers:', error.message);
  } else {
    console.log('Sample row from phone_numbers table:', JSON.stringify(data?.[0] || {}, null, 2));
  }
  
  console.log('Querying profiles...');
  const { data: pData, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (pError) {
    console.error('Error fetching profiles:', pError.message);
  } else {
    console.log('Sample row from profiles table:', JSON.stringify(pData?.[0] || {}, null, 2));
  }
}

run().catch(console.error);
