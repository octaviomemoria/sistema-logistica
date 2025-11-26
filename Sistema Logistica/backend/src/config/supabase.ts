import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role para operações no backend

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Credenciais do Supabase não configuradas. Verifique as variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env');
}

// Cliente Supabase para uso no backend
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Cliente para operações que necessitam do contexto do usuário autenticado
export const createUserSupabaseClient = (accessToken: string) => {
    if (!supabaseUrl || !process.env.SUPABASE_ANON_KEY) {
        throw new Error('Credenciais do Supabase não configuradas');
    }

    return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
};

export default supabase;
