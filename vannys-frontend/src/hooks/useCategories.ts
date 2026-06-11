import { useState, useEffect } from 'react';
import { categoriesService } from '@/api/services';
import type { Category } from '@/types';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        categoriesService.list()
            .then(setCategories)
            .catch(() => setError('Impossible de charger les catégories'))
            .finally(() => setLoading(false));
    }, []);

    return { categories, loading, error };
}