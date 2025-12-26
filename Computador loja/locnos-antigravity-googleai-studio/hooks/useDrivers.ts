import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Motorista } from '../types';

export const useDrivers = (organizationId: string | undefined) => {
    const [drivers, setDrivers] = useState<Motorista[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDrivers = useCallback(async () => {
        if (!organizationId) return;

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('motoristas')
                .select('*')
                .eq('organization_id', organizationId)
                .order('nome', { ascending: true });

            if (error) throw error;
            setDrivers(data || []);
        } catch (err: any) {
            console.error('Error fetching drivers:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    return {
        drivers,
        loading,
        error,
        refreshDrivers: fetchDrivers
    };
};
