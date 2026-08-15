// Configuração pública do frontend. Nunca coloque a service_role aqui.
window.GRASSI_CONFIG = {
  mode: 'demo', // altere para 'supabase' após configurar o projeto
  supabaseUrl: '',
  supabasePublishableKey: '',
  demoUsers: [
    { email: 'admin@example.invalid', password: 'admin123', role: 'admin', name: 'Administrador Demo' },
    { email: 'employee@example.invalid', password: 'func123', role: 'employee', name: 'Funcionario Demo Caixa' }
  ]
};
