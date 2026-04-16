-- Flujo local (backend + PostgreSQL)
-- 1) Registra el usuario desde la app (/auth/register) o via POST /api/auth/register
-- 2) Ejecuta este script para promoverlo a administrador

UPDATE users
SET role = 'admin',
    full_name = COALESCE(full_name, 'Administrador Principal'),
    updated_at = NOW()
WHERE email = 'admin@ecoloop.edu';

-- Verificacion rapida
SELECT id, email, full_name, role, eco_points
FROM users
WHERE email = 'admin@ecoloop.edu';
