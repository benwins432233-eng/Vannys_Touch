import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/api/services';
import type { Product, PaginatedResponse, ProductFilters } from '@/types';

export function useProducts(filters?: ProductFilters) {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Omit<PaginatedResponse<Product>, 'data'> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trigger, setTrigger] = useState(0);

    const refetch = useCallback(() => setTrigger(t => t + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        productsService.list(filters)
            .then(response => {
                if (cancelled) return;
                const { data, ...meta } = response;
                setProducts(data);
                setPagination(meta);
            })
            .catch(err => {
                if (cancelled) return;
                setError(err?.message ?? 'Erreur de chargement');
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters), trigger]);

    return { products, pagination, loading, error, refetch };
}