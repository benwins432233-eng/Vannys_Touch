import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productsApi } from '@/api/products.api';
import type { ProductFilters } from '@/types';

export const PRODUCTS_KEY = 'products';

export const useProducts = (filters: ProductFilters = {}) =>
  useQuery({
    queryKey: [PRODUCTS_KEY, filters],
    queryFn: () => productsApi.getAll(filters),
    staleTime: 2 * 60 * 1000,
  });

export const useProduct = (slug: string) =>
  useQuery({
    queryKey: [PRODUCTS_KEY, slug],
    queryFn: () => productsApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      toast.success('Produit créé avec succès !');
    },
    onError: () => toast.error('Erreur lors de la création du produit'),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      toast.success('Produit mis à jour !');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      toast.success('Produit supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
};
