import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async request => {
  if (request.method !== 'POST') return new Response(JSON.stringify({ ok: false, error: 'Método no permitido' }), { status: 405, headers: { 'Content-Type': 'application/json' } })
  try {
    const setupKey = Deno.env.get('GRASSI_SETUP_KEY') || ''
    if (!setupKey || request.headers.get('x-setup-key') !== setupKey) throw new Error('Clave de instalación inválida')
    const url = Deno.env.get('SUPABASE_URL')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const email = (Deno.env.get('GRASSI_ADMIN_EMAIL') || 'admin@grassi.local').trim().toLowerCase()
    const password = Deno.env.get('GRASSI_ADMIN_PASSWORD') || ''
    if (password.length < 12) throw new Error('GRASSI_ADMIN_PASSWORD debe tener al menos 12 caracteres')
    const admin = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } })
    const { count } = await admin.from('memberships').select('user_id', { count: 'exact', head: true })
    if ((count || 0) > 0) throw new Error('La instalación inicial ya fue realizada')

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Administrador GRASSI', must_change_password: true },
      app_metadata: { provisioned_by: 'bootstrap-admin' },
    })
    if (createError || !created.user) throw createError || new Error('No fue posible crear el administrador')

    const { data: business, error: businessError } = await admin.from('businesses').insert({
      name: Deno.env.get('GRASSI_BUSINESS_NAME') || 'GRASSI Repuestos',
      legal_name: Deno.env.get('GRASSI_LEGAL_NAME') || 'GRASSI Repuestos',
      currency: 'Bs',
    }).select('id').single()
    if (businessError || !business) {
      await admin.auth.admin.deleteUser(created.user.id)
      throw businessError || new Error('No fue posible crear la empresa')
    }

    const { error: membershipError } = await admin.from('memberships').insert({
      business_id: business.id,
      user_id: created.user.id,
      role: 'admin',
      display_name: 'Administrador GRASSI',
      email,
      job_title: 'Administrador',
      supervisor: true,
      must_change_password: true,
      permissions: { sales: true, clients: true, stock: true, cash: true, reports: true },
    })
    if (membershipError) {
      await admin.from('businesses').delete().eq('id', business.id)
      await admin.auth.admin.deleteUser(created.user.id)
      throw membershipError
    }
    const { error: settingsError } = await admin.from('business_settings').insert({ business_id: business.id })
    if (settingsError) {
      await admin.from('businesses').delete().eq('id', business.id)
      await admin.auth.admin.deleteUser(created.user.id)
      throw settingsError
    }

    return new Response(JSON.stringify({ ok: true, businessId: business.id, userId: created.user.id, email }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
})
