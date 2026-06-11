import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '@/api/services';
import type { Order } from '@/types';

export function useMyOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(() => {
        setLoading(true);
        ordersService.myOrders()
            .then(res => setOrders(res.data))
            .catch(err => setError(err?.message ?? 'Erreur'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    return { orders, loading, error, refetch: fetchOrders };
}

export function useAdminOrders(params?: { status?: string; search?: string; page?: number }) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    const refetch = useCallback(() => setTrigger(t => t + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        ordersService.adminList(params)
            .then(res => { if (!cancelled) setOrders(res.data); })
            .catch(err => { if (!cancelled) setError(err?.message ?? 'Erreur'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params), trigger]);

    return { orders, loading, error, refetch };
}