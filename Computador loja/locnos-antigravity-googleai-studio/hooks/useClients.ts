import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Cliente } from '../types';

export const useClients = (organizationId: string | undefined, page: number = 1, pageSize: number = 10) => {
    const [clients, setClients] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchClients = useCallback(async () => {
        if (!organizationId) return;

        setLoading(true);
        setError(null);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from('clientes')
                .select('*, locacoes(count)', { count: 'exact' })
                .eq('organization_id', organizationId)
                .order('nome_completo', { ascending: true })
                .order('nome_fantasia', { ascending: true })
                .range(from, to);

            if (error) throw error;

            const formattedData = (data || []).map((client: any) => ({
                ...client,
                total_locacoes: client.locacoes && client.locacoes[0] ? client.locacoes[0].count : 0
            }));

            setClients(formattedData);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error('Error fetching clients:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [organizationId, page, pageSize]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    return {
        clients,
        loading,
        error,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        refreshClients: fetchClients
    };
};
