import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Locacao, StatusLocacao, StatusPagamento } from '../types';

export const useRentals = (organizationId: string | undefined, page: number = 1, pageSize: number = 10) => {
    const [rentals, setRentals] = useState<Locacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchRentals = useCallback(async () => {
        if (!organizationId) return;

        setLoading(true);
        setError(null);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from('locacoes')
                .select(`
                    *,
                    cliente:clientes (nome_completo, nome_fantasia, tipo)
                `, { count: 'exact' })
                .eq('organization_id', organizationId)
                .order('data_inicio', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const formattedData = data.map((item: any) => ({
                ...item,
                cliente_nome: item.cliente?.nome_completo || item.cliente?.nome_fantasia || 'Cliente Desconhecido'
            }));

            setRentals(formattedData);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error('Error fetching rentals:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [organizationId, page, pageSize]);

    useEffect(() => {
        fetchRentals();
    }, [fetchRentals]);

    const updateRentalStatus = async (id: string, newStatus: StatusLocacao) => {
        const { error } = await supabase.from('locacoes').update({ status: newStatus }).eq('id', id);
        if (error) throw error;
        fetchRentals();
    };

    const updatePaymentStatus = async (id: string, newStatus: StatusPagamento) => {
        const { error } = await supabase.from('locacoes').update({ status_pagamento: newStatus }).eq('id', id);
        if (error) throw error;
        fetchRentals();
    };

    return {
        rentals,
        loading,
        error,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        refreshRentals: fetchRentals,
        updateRentalStatus,
        updatePaymentStatus
    };
};
