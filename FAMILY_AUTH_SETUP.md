# Cuentas familiares y sincronización
Cada integrante crea su propia cuenta de correo y contraseña. Los datos de bienestar se sincronizan entre sus dispositivos con Supabase Auth y Postgres, con Row Level Security (RLS) por usuario. Una cuenta NO puede ver los datos de otra.

## Activación obligatoria
1. Crear proyecto Supabase en https://supabase.com y ejecutar `supabase/schema.sql` en SQL Editor.
2. En Supabase Authentication > Providers habilitar Email. Mantener confirmación por correo habilitada. Configurar Site URL y Redirect URLs para el dominio real de Vercel.
3. En Vercel > Project > Settings > Environment Variables definir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave pública/publishable). Redeploy.
4. Probar con dos correos diferentes: registrar, confirmar correo, iniciar sesión, registrar una medición, abrir otro dispositivo y verificar sincronización. Confirmar que la segunda cuenta no ve los datos de la primera.
5. Configurar controles de abuso/rate limiting y política de privacidad antes de invitar usuarios reales.

## Alcance y seguridad
- Cada miembro posee una cuenta privada independiente. Aún no hay panel administrador de familia, invitaciones, perfiles infantiles ni acceso delegado.
- El progreso de versiones anteriores guardado en localStorage NO se migra automáticamente a la nube; no se suben datos antiguos sin autorización.
- No guardar datos sensibles de menores hasta implementar consentimiento parental, controles de acceso apropiados y revisión legal.
- No colocar service_role en variables NEXT_PUBLIC. La clave pública solo es segura con RLS habilitado.
- Si faltan variables de entorno, la aplicación muestra configuración pendiente y no finge que la sincronización funciona.
