// Configuração pública do frontend. Nunca coloque a service_role aqui.
window.GRASSI_CONFIG = {
  mode: 'supabase',
  supabaseUrl: 'https://hfobfckmqgkpjqxwaaef.supabase.co',
  supabasePublishableKey: 'sb_publishable_eDPOvOIlXu0STQzfaFXCOg_GnL2tNm3',
  demoUsers: [
    { email: 'admin@example.invalid', password: 'admin123', role: 'admin', name: 'Administrador Demo' },
    { email: 'employee@example.invalid', password: 'func123', role: 'employee', name: 'Funcionario Demo Caixa' }
  ]
};
