// 1. Responsabilité : Page d'administration des comptes multi-utilisateurs de l'équipe éducative
// 2. Dépendances clés : react, lucide-react, src/hooks/useAdminUsers, src/lib/api/auth.api
// 3. Mots-clés métier : admin_users_page, team_accounts, user_crud, permissions

import { useState } from 'react';
import { UserPlus, CheckCircle2, XCircle, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAdminUserMutations, useAdminUsersList } from '@/hooks/useAdminUsers';
import { getStoredAdminUser } from '@/lib/api/auth.api';
import { AdminUser, AdminUserCreatePayload } from '@/types/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdminUserFormModal } from '@/components/auth/AdminUserFormModal';

export default function AdminUsersPage() {
  useDocumentTitle('Comptes Équipe');
  const { data: users, isLoading, isError, error } = useAdminUsersList();
  const { createMutation, updateMutation, deleteMutation } = useAdminUserMutations();
  const currentUser = getStoredAdminUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: AdminUser) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${user.full_name} (${user.username}) ?`)) {
      try {
        await deleteMutation.mutateAsync(user.id);
      } catch (err) {
        const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Erreur lors de la suppression.';
        alert(msg);
      }
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'Jamais connecté';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#272154]">
            Gestion des Comptes Équipe
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Gérez les accès de l’équipe éducative (direction, CPE, professeurs principaux, coordinateurs).
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenCreate}>
          <UserPlus className="w-4 h-4" />
          <span>Ajouter un compte</span>
        </Button>
      </div>

      {/* Grille ou Tableau des utilisateurs */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500 animate-pulse bg-white rounded-2xl border border-gray-100">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#312783] border-t-transparent mb-4" />
          <p className="text-sm font-medium">Chargement des comptes...</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
          <h3 className="font-semibold text-base">Erreur de chargement</h3>
          <p className="text-xs mt-1 text-rose-600">
            {error instanceof Error ? error.message : 'Impossible de récupérer la liste des comptes.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#272154] text-white">
              <tr>
                <th className="py-3 px-4 font-semibold">Nom complet & Fonction</th>
                <th className="py-3 px-3 font-semibold">Identifiant</th>
                <th className="py-3 px-3 font-semibold">Email</th>
                <th className="py-3 px-3 font-semibold text-center">Statut</th>
                <th className="py-3 px-3 font-semibold">Dernière connexion</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users || []).map((u) => {
                const isCurrent = currentUser?.id === u.id;

                return (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#312783]/10 text-[#312783] flex items-center justify-center font-bold text-xs shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-[#272154] text-sm flex items-center gap-1.5">
                            <span>{u.full_name}</span>
                            {isCurrent && (
                              <Badge size="sm" variant="purple">
                                Vous
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-gray-700 font-medium">
                      {u.username}
                    </td>

                    <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">
                      {u.email}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Actif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-medium">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Suspendu</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-gray-500 text-[11px]">
                      {formatDate(u.last_login)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#312783] hover:bg-gray-100 transition-colors"
                          title="Modifier le compte ou réinitialiser le mot de passe"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(u)}
                          disabled={isCurrent}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400"
                          title={isCurrent ? 'Impossible de supprimer votre propre compte' : 'Supprimer ce compte'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale d'ajout ou modification */}
      <AdminUserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        currentUserId={currentUser?.id}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSubmit={async ({ isEdit, userId, payload }) => {
          if (isEdit && userId) {
            await updateMutation.mutateAsync({ userId, payload });
          } else {
            await createMutation.mutateAsync(payload as AdminUserCreatePayload);
          }
        }}
      />
    </div>
  );
}
