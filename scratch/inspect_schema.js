const fs = require('fs');
require('dotenv').config();

async function inspectSchema() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Fetching OpenAPI schema from:', url);
  try {
    const res = await globalThis.fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch schema: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Paths available:');
    console.log(Object.keys(data.paths).filter(p => p.startsWith('/')));
    
    console.log('Definitions available:');
    if (data.definitions) {
      console.log(Object.keys(data.definitions));
    }
  } catch (err) {
    console.error('Error fetching OpenAPI schema:', err);
  }
}

inspectSchema();
