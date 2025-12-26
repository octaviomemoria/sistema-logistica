import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Equipamento } from '../types';

export const useEquipments = (organizationId: string | undefined, page: number = 1, pageSize: number = 10) => {
    const [equipments, setEquipments] = useState<Equipamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchEquipments = useCallback(async () => {
        if (!organizationId) return;

        setLoading(true);
        setError(null);
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await supabase
                .from('equipamentos')
                .select('*, periodos_locacao(*)', { count: 'exact' })
                .eq('organization_id', organizationId)
                .order('criado_em', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setEquipments(data || []);
            setTotalCount(count || 0);
        } catch (err: any) {
            console.error('Error fetching equipments:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [organizationId, page, pageSize]);

    useEffect(() => {
        fetchEquipments();
    }, [fetchEquipments]);

    return {
        equipments,
        loading,
        error,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        refreshEquipments: fetchEquipments
    };
};
