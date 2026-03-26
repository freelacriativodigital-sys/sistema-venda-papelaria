import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const { id, emailAtual, novoEmail, novaSenha, perfil } = req.body || {};
    const idLimpo = Number(id);
    const emailAtualLimpo = String(emailAtual || '').trim().toLowerCase();
    const novoEmailLimpo = String(novoEmail || '').trim().toLowerCase();
    const novaSenhaLimpa = String(novaSenha || '').trim();
    const perfilFinal = String(perfil || 'admin').trim().toLowerCase();

    if (!idLimpo || !emailAtualLimpo || !novoEmailLimpo) {
      return res.status(400).json({ error: 'Dados obrigatórios não enviados.' });
    }

    if (!['admin', 'padrao'].includes(perfilFinal)) {
      return res.status(400).json({ error: 'Perfil inválido.' });
    }

    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return res.status(400).json({ error: listError.message });

    const authUser = (usersData?.users || []).find((user) => String(user.email || '').trim().toLowerCase() === emailAtualLimpo);
    if (!authUser) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const payloadUpdateAuth = { email: novoEmailLimpo, email_confirm: true };
    if (novaSenhaLimpa) payloadUpdateAuth.password = novaSenhaLimpa;

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(authUser.id, payloadUpdateAuth);
    if (updateAuthError) return res.status(400).json({ error: updateAuthError.message });

    const { error: updateTableError } = await supabase.from('usuarios_painel').update({ usuario: novoEmailLimpo, perfil: perfilFinal }).eq('id', idLimpo);
    if (updateTableError) return res.status(400).json({ error: updateTableError.message });

    return res.status(200).json({ success: true, message: 'Usuário atualizado com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
  }
}