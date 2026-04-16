# Configuracion del Usuario Administrador Principal

Este proyecto funciona en local con backend Express y PostgreSQL (sin proveedor externo).

## Opcion 1: Crear usuario y promoverlo a admin

1. Registra el usuario desde la app en /auth/register (email sugerido: admin@ecoloop.edu).
2. Ejecuta el script scripts/005_create_admin_user.sql en tu base PostgreSQL.

## Opcion 2: Promover por email existente

1. Asegurate de que el usuario ya exista en la tabla users.
2. Ejecuta el script scripts/006_create_admin_alternative.sql.

## Verificacion

Ejecuta:

```sql
SELECT id, email, full_name, role, eco_points
FROM users
WHERE email = 'admin@ecoloop.edu';
```

Si role = 'admin', el usuario ya puede iniciar sesion y acceder a /admin.

## Seguridad

Cambia la contrasena inicial si usaste una temporal.
