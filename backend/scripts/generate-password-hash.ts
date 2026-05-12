import bcrypt from 'bcrypt';

/**
 * Script para generar hashes bcrypt de contraseñas de prueba
 * Ejecutar: npx ts-node scripts/generate-password-hash.ts [password]
 */

const password = process.argv[2] || 'test123';

bcrypt.hash(password, 10).then((hash) => {
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('\nSQL INSERT:');
  console.log(`INSERT INTO public.profiles (email, password_hash, full_name, role) VALUES`);
  console.log(`  ('user@ecoloop.com', '${hash}', 'Usuario', 'user')`);
});
