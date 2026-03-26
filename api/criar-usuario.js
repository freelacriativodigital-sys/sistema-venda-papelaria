const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const { email, senha, perfil } = req.body || {};

    const emailLimpo = String(email || '').trim().toLowerCase();
    const senhaLimpa = String(senha || '').trim();
    const perfilFinal = String(perfil || 'admin').trim().toLowerCase();

    if (!emailLimpo || !senhaLimpa) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    if (!['admin', 'padrao'].includes(perfilFinal)) {
      return res.status(400).json({ error: 'Perfil inválido.' });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailLimpo,
      password: senhaLimpa,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({
        error: authError.message || 'Erro ao criar usuário no Authentication.',
      });
    }

    const authUser = authData?.user;

    const { error: insertError } = await supabase.from('usuarios_painel').insert([
      {
        usuario: emailLimpo,
        perfil: perfilFinal,
      },
    ]);

    if (insertError) {
      if (authUser?.id) {
        await supabase.auth.admin.deleteUser(authUser.id);
      }

      return res.status(400).json({
        error: insertError.message || 'Erro ao salvar perfil no banco.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuário criado com sucesso.',
      user: {
        id: authUser?.id,
        email: authUser?.email,
        perfil: perfilFinal,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Erro interno do servidor.',
    });
  }
};