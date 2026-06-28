const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const email = 'mapalolungu65@gmail.com';
  const primaryPhone = '+260772822579';

  console.log(`Searching for auth user: ${email}...`);
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.error(`User not found: ${email}`);
    return;
  }

  console.log(`Updating auth user ID: ${user.id}...`);
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      phone: primaryPhone,
      user_metadata: {
        ...user.user_metadata,
        primary_number: primaryPhone,
        phone: primaryPhone
      }
    }
  );

  if (updateError) {
    console.error('Error updating user auth details:', updateError.message);
    return;
  }

  console.log(`Successfully updated auth user:`, {
    id: updatedUser.user.id,
    email: updatedUser.user.email,
    phone: updatedUser.user.phone,
    user_metadata: updatedUser.user.user_metadata
  });
}

run().catch(console.error);
