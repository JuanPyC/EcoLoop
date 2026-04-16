-- Alternativa local para promover un usuario existente a admin
-- Reemplaza el email segun necesidad.

DO $$
DECLARE
  admin_email text := 'admin@ecoloop.edu';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = admin_email) THEN
    RAISE EXCEPTION 'Usuario con email % no existe. Registralo primero desde la app o API.', admin_email;
  END IF;

  UPDATE users
  SET role = 'admin',
      full_name = COALESCE(full_name, 'Administrador Principal'),
      updated_at = NOW()
  WHERE email = admin_email;

  RAISE NOTICE 'Admin setup completo para: %', admin_email;
END $$;
