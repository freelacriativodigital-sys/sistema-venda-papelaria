import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const { id, email } = req.body || {};
    const idLimpo = Number(id);
    const emailLimpo = String(email || '').trim().toLowerCase();

    if (!idLimpo || !emailLimpo) return res.status(400).json({ error: 'ID e email são obrigatórios.' });

    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return res.status(400).json({ error: listError.message });

    const authUser = (usersData?.users || []).find((user) => String(user.email || '').trim().toLowerCase() === emailLimpo);

    if (authUser?.id) {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUser.id);
      if (deleteAuthError) return res.status(400).json({ error: deleteAuthError.message });
    }

    const { error: deleteTableError } = await supabase.from('usuarios_painel').delete().eq('id', idLimpo);
    if (deleteTableError) return res.status(400).json({ error: deleteTableError.message });

    return res.status(200).json({ success: true, message: 'Utilizador excluído com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
  }
}