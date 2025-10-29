-- Create main administrator user
-- This script creates the principal admin account for EcoLoop

-- First, we need to create the auth user
-- Note: You'll need to run this with Supabase admin privileges

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Insert into auth.users (this requires admin privileges)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@ecoloop.edu',
    crypt('Admin123!', gen_salt('bf')), -- Password: Admin123!
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Administrador Principal"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO admin_user_id;

  -- Create profile for admin user
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    eco_points,
    created_at
  ) VALUES (
    admin_user_id,
    'admin@ecoloop.edu',
    'Administrador Principal',
    'admin',
    0,
    NOW()
  );

  RAISE NOTICE 'Admin user created successfully with email: admin@ecoloop.edu';
  RAISE NOTICE 'Password: Admin123!';
  RAISE NOTICE 'User ID: %', admin_user_id;
END $$;
