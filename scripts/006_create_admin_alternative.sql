-- Alternative method: Create admin profile that can be linked to a manually created auth user
-- Use this if the previous script doesn't work due to auth.users permissions

-- Step 1: First create a user manually in Supabase Dashboard with:
-- Email: admin@ecoloop.edu
-- Password: Admin123! (or your preferred password)
-- Auto Confirm User: YES

-- Step 2: Then run this script to set up the admin profile
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from the auth.users table

DO $$
DECLARE
  admin_email text := 'admin@ecoloop.edu';
  admin_user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please create the user in Supabase Dashboard first.', admin_email;
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = admin_user_id) THEN
    -- Update existing profile to admin
    UPDATE profiles
    SET role = 'admin',
        full_name = 'Administrador Principal',
        updated_at = NOW()
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Profile updated to admin role for user: %', admin_email;
  ELSE
    -- Create new admin profile
    INSERT INTO profiles (
      id,
      email,
      full_name,
      role,
      eco_points,
      created_at
    ) VALUES (
      admin_user_id,
      admin_email,
      'Administrador Principal',
      'admin',
      0,
      NOW()
    );
    
    RAISE NOTICE 'Admin profile created for user: %', admin_email;
  END IF;

  RAISE NOTICE 'Admin setup complete!';
  RAISE NOTICE 'Email: %', admin_email;
  RAISE NOTICE 'User ID: %', admin_user_id;
END $$;
