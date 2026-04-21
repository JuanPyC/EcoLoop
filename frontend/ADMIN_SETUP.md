# Configuración del Usuario Administrador Principal

## Método 1: Script Automático (Recomendado si tienes permisos completos)

Ejecuta el script `scripts/005_create_admin_user.sql` en el editor SQL de Supabase.

**Credenciales creadas:**
- Email: `admin@ecoloop.edu`
- Password: `Admin123!`

## Método 2: Creación Manual (Recomendado para la mayoría de casos)

### Paso 1: Crear usuario en Supabase Dashboard

1. Ve a tu proyecto de Supabase
2. Navega a **Authentication** → **Users**
3. Haz clic en **Add user** → **Create new user**
4. Completa los datos:
   - **Email**: `admin@ecoloop.edu`
   - **Password**: `Admin123!` (o tu contraseña preferida)
   - **Auto Confirm User**: ✅ Activado (importante)
5. Haz clic en **Create user**

### Paso 2: Ejecutar script de configuración

1. Ve a **SQL Editor** en Supabase
2. Ejecuta el script `scripts/006_create_admin_alternative.sql`
3. Este script creará el perfil de administrador automáticamente

## Verificación

Después de crear el administrador, verifica que todo funcione:

1. Ve a la aplicación EcoLoop
2. Inicia sesión con:
   - Email: `admin@ecoloop.edu`
   - Password: `Admin123!`
3. Deberías ser redirigido al dashboard de administrador en `/admin`

## Crear Administradores Adicionales

Una vez que tengas acceso como administrador, puedes crear más administradores desde el panel de administración:

1. Inicia sesión como admin
2. Ve a **Gestión de Usuarios** (próximamente)
3. Crea nuevos usuarios con rol "Administrador"

## Seguridad

⚠️ **Importante**: Cambia la contraseña predeterminada después del primer inicio de sesión.

## Solución de Problemas

### Error: "User not found"
- Asegúrate de haber creado el usuario en Authentication → Users primero
- Verifica que el email sea exactamente `admin@ecoloop.edu`
- Confirma que el usuario esté marcado como "Confirmed"

### Error: "Profile already exists"
- El script detectará esto y actualizará el perfil existente a rol admin
- No es necesario eliminar nada, simplemente vuelve a ejecutar el script

### No puedo acceder al dashboard
- Verifica que el usuario tenga `role = 'admin'` en la tabla `profiles`
- Cierra sesión completamente y vuelve a iniciar sesión
- Limpia las cookies del navegador si es necesario
