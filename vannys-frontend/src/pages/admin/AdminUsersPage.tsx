import { useState } from 'react';
import { Search, ShieldCheck, UserX, UserCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/api/client';
import { formatDate, getErrorMessage } from '@/utils';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  SkeletonList,
  Table,
  Td,
  Tr,
} from '@/components/ui';
import type { PaginatedResponse, User } from '@/types';

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<User> }>(
        `/users?page=${page}&limit=20`,
      );
      return res.data.data;
    },
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/users/${id}/toggle-active`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Statut modifié');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const { mutate: setRole } = useMutation({
    // Valeurs minuscules correspondant à l'enum MySQL users_role
    mutationFn: ({ id, role }: { id: string; role: 'admin' | 'user' }) =>
      apiClient.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rôle mis à jour');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const filtered =
    data?.data?.filter(
      (u) =>
        !search ||
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Utilisateurs</h1>

      <div className="relative mb-5 max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Rechercher un utilisateur"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 py-2.5"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-5">
            <SkeletonList count={5} label="Chargement des utilisateurs" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'Aucun utilisateur ne correspond' : 'Aucun utilisateur'}
            description={
              search ? 'Essayez un autre nom ou une autre adresse email.' : undefined
            }
            action={
              search ? (
                <Button variant="outline" onClick={() => setSearch('')}>
                  Effacer la recherche
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table
            caption="Liste des comptes clients et administrateurs"
            columns={[
              'Utilisateur',
              'Email',
              'Téléphone',
              'Rôle',
              'Statut',
              'Inscription',
              'Actions',
            ]}
          >
            {filtered.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                 bg-primary text-primary-foreground text-sm font-bold"
                      aria-hidden="true"
                    >
                      {user.firstName[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground whitespace-nowrap">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </Td>
                <Td>{user.email}</Td>
                <Td>{user.phone ?? '—'}</Td>
                <Td>
                  <Badge tone={user.role === 'admin' ? 'gold' : 'neutral'}>
                    {user.role === 'admin' ? 'Admin' : 'Client'}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={user.isActive ? 'success' : 'destructive'}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </Td>
                <Td className="whitespace-nowrap">{formatDate(user.createdAt)}</Td>
                <Td>
                  <div className="flex gap-1">
                    <IconButton
                      label={
                        user.isActive
                          ? `Suspendre le compte de ${user.firstName} ${user.lastName}`
                          : `Réactiver le compte de ${user.firstName} ${user.lastName}`
                      }
                      tone={user.isActive ? 'destructive' : 'success'}
                      icon={
                        user.isActive ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )
                      }
                      onClick={() => toggleActive(user.id)}
                    />
                    <IconButton
                      label={
                        user.role === 'admin'
                          ? `Retirer le rôle administrateur à ${user.firstName}`
                          : `Donner le rôle administrateur à ${user.firstName}`
                      }
                      tone="primary"
                      icon={<ShieldCheck className="w-4 h-4" />}
                      onClick={() =>
                        setRole({ id: user.id, role: user.role === 'admin' ? 'user' : 'admin' })
                      }
                    />
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      {data && data.meta.lastPage > 1 && (
        <nav className="flex justify-end items-center gap-2 mt-4" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span className="px-3 text-sm text-muted-foreground" aria-live="polite">
            Page {page} sur {data.meta.lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.meta.lastPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </nav>
      )}
    </div>
  );
}
