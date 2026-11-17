/* Conexión del portal con Supabase (Project Settings → API).
   La clave "anon" es pública por diseño: los datos los protege el login
   y las reglas de seguridad de supabase/esquema.sql. */
window.GT_SUPABASE = {
  url: "",      // ej. https://abcdefgh.supabase.co
  anonKey: ""   // clave anon public
};
