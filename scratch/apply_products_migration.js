const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Testing table existence for products...');
  const { data, error } = await supabase.from('products').select('*').limit(1);
  
  if (error && error.code === '42P01') {
    console.log('Products table does not exist yet.');
    // Let's create products table using RPC or raw query if supported, or inform the user
    // We can also insert initial sample products once table is created
  } else if (!error) {
    console.log('Products table exists! Sample count:', data.length);
  } else {
    console.log('Result:', error.message);
  }
}

applyMigration();
