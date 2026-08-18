import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { addressesApi, type AddressPayload } from '@/api/addresses.api';
import { useAuthStore } from '@/store/auth.store';
import { getErrorMessage } from '@/utils';

export const ADDRESSES_KEY = 'addresses';

export const useAddresses = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: [ADDRESSES_KEY],
    queryFn: addressesApi.getAll,
    enabled: isAuthenticated,
  });
};

/** Toutes les écritures relisent le carnet : l'adresse par défaut peut changer. */
const useAddressMutation = <TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
  successMessage: string,
) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ADDRESSES_KEY] });
      toast.success(successMessage);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
};

export const useCreateAddress = () =>
  useAddressMutation((data: AddressPayload) => addressesApi.create(data), 'Adresse ajoutée.');

export const useUpdateAddress = () =>
  useAddressMutation(
    ({ id, ...data }: { id: string } & Partial<AddressPayload>) =>
      addressesApi.update(id, data),
    'Adresse mise à jour.',
  );

export const useSetDefaultAddress = () =>
  useAddressMutation((id: string) => addressesApi.setDefault(id), 'Adresse par défaut modifiée.');

export const useDeleteAddress = () =>
  useAddressMutation((id: string) => addressesApi.remove(id), 'Adresse supprimée.');
