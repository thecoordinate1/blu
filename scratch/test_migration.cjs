// Quick migration test — check if Cloud API columns exist
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zgqixjzznbrsdkmdvmrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncWl4anp6bmJyc2RrbWR2bXJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQwMTgzMCwiZXhwIjoyMDkyOTc3ODMwfQ.irNvjJ0A290wm2dE63GqBVkAnwzaVPO-KaCmosHCyhY'
);

async function main() {
  console.log('Testing whatsapp_sessions table...');
  
  const { data, error } = await supabase
    .from('whatsapp_sessions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    // Check if the error mentions specific columns
    if (error.message.includes('wa_phone_number_id')) {
      console.log('❌ Cloud API columns NOT found');
    }
    return;
  }

  console.log('Rows:', data?.length ?? 0);
  if (data && data.length > 0) {
    const cols = Object.keys(data[0]);
    console.log('Columns:', cols.join(', '));
    console.log('Has wa_phone_number_id:', cols.includes('wa_phone_number_id'));
    console.log('Has provider:', cols.includes('provider'));
  } else {
    console.log('Table is empty — testing insert...');
    const { error: insertErr } = await supabase
      .from('whatsapp_sessions')
      .upsert({
        business_id: '00000000-0000-0000-0000-000000000000',
        provider: 'cloud_api',
        wa_phone_number_id: 'test_123',
        status: 'disconnected'
      }, { onConflict: 'business_id' });

    if (insertErr) {
      console.log('Insert result:', insertErr.message);
      if (insertErr.message.includes('foreign key') || insertErr.message.includes('businesses')) {
        console.log('✅ Columns exist (FK error expected for fake ID)');
      } else {
        console.log('❌ Migration may be needed');
      }
    } else {
      console.log('✅ Insert succeeded — columns exist!');
      await supabase.from('whatsapp_sessions').delete().eq('business_id', '00000000-0000-0000-0000-000000000000');
    }
  }
}

main().catch(console.error);
