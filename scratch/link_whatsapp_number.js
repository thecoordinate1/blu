const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const email = 'mapalolungu65@gmail.com';
  const whatsappNumber = '1195923860268489';

  console.log(`Searching for auth user: ${email}...`);
  
  // 1. Get user by email using admin auth API
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error listing users:', userError.message);
    return;
  }

  const targetUser = users.find(u => u.email === email);
  if (!targetUser) {
    console.error(`User not found with email: ${email}`);
    console.log('Available users:');
    users.forEach(u => console.log(` - ${u.email} (${u.id})`));
    return;
  }

  console.log(`Found user: ${targetUser.email} (ID: ${targetUser.id})`);

  // 2. Find their business
  const { data: business, error: selectError } = await supabase
    .from('businesses')
    .select('id, name, whatsapp_number')
    .eq('owner_id', targetUser.id)
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.error('Error fetching business:', selectError.message);
    return;
  }

  if (!business) {
    console.log(`No business profile found for owner_id: ${targetUser.id}. Creating one...`);
    const { data: newBusiness, error: insertError } = await supabase
      .from('businesses')
      .insert({
        name: 'My Business',
        owner_id: targetUser.id,
        whatsapp_number: whatsappNumber,
        subscription_tier: 'free'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating business profile:', insertError.message);
      return;
    }

    console.log(`Successfully created business profile with whatsapp_number: ${whatsappNumber}`, newBusiness);
  } else {
    console.log(`Found business: "${business.name}" (ID: ${business.id}) with current whatsapp_number: ${business.whatsapp_number}`);
    
    // Update the whatsapp_number
    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update({ whatsapp_number: whatsappNumber })
      .eq('id', business.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating business profile:', updateError.message);
      return;
    }

    console.log(`Successfully updated business profile: "${updatedBusiness.name}" with whatsapp_number: ${updatedBusiness.whatsapp_number}`);
  }
}

run().catch(console.error);
