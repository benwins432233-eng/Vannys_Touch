import { useState, useEffect } from 'react';
import { productsService } from '@/api/services';
import type { Product } from '@/types';

export function useProduct(slug: string | undefined) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;

        setLoading(true);
        setError(null);

        productsService.show(slug)
            .then(data => { if (!cancelled) setProduct(data); })
            .catch(err => { if (!cancelled) setError(err?.message ?? 'Produit introuvable'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [slug]);

    return { product, loading, error };
}