// 1. Responsabilité : Modale de création et d'édition d'un compte administrateur / équipe éducative
// 2. Dépendances clés : react, lucide-react, src/types/api, src/components/ui/*
// 3. Mots-clés métier : admin_user_modal, user_form, password_reset, role_management

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Shield, KeyRound, AlertCircle } from 'lucide-react';
import { AdminUser, AdminUserCreatePayload, AdminUserUpdatePayload } from '@/types/api';
import { Button } from '@/components/ui/Button';

interface AdminUserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: AdminUser | null;
  isLoading: boolean;
  currentUserId?: number;
  onSubmit: (data: { isEdit: boolean; userId?: number; payload: AdminUserCreatePayload | AdminUserUpdatePayload }) => Promise<void>;
}

export const AdminUserFormModal: React.FC<AdminUserFormModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  isLoading,
  currentUserId,
  onSubmit,
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (userToEdit) {
      setUsername(userToEdit.username);
      setEmail(userToEdit.email);
      setFullName(userToEdit.full_name);
      setPassword('');
      setIsActive(userToEdit.is_active);
    } else {
      setUsername('');
      setEmail('');
      setFullName('');
      setPassword('');
      setIsActive(true);
    }
    setFormError(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const isSelf = Boolean(userToEdit && currentUserId === userToEdit.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !username.trim() || !email.trim()) {
      setFormError('Veuillez renseigner le nom, l’identifiant et l’adresse email.');
      return;
    }

    if (!userToEdit && (!password || password.length < 6)) {
      setFormError('Le mot de passe initial doit contenir au moins 6 caractères.');
      return;
    }

    if (userToEdit && password && password.length < 6) {
      setFormError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      if (userToEdit) {
        const payload: AdminUserUpdatePayload = {
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          is_active: isSelf ? true : isActive,
          ...(password.trim() ? { password: password.trim() } : {}),
        };
        await onSubmit({ isEdit: true, userId: userToEdit.id, payload });
      } else {
        const payload: AdminUserCreatePayload = {
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        };
        await onSubmit({ isEdit: false, payload });
      }
      onClose();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Une erreur est survenue.';
      setFormError(msg);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* En-tête */}
        <div className="p-6 bg-[#272154] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#EB5E57]">
              {userToEdit ? <Shield className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                {userToEdit ? 'Modifier le compte' : 'Créer un compte équipe'}
              </h3>
              <p className="text-xs text-white/70">
                {userToEdit
                  ? `Gestion de l’accès pour ${userToEdit.full_name}`
                  : 'Autorisez un membre de l’équipe éducative à administrer le forum'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nom complet & Fonction <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Claire Morel — CPE Lycée"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Identifiant (login) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: cpe_morel"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Adresse email académique <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Ex: claire.morel@etablissement.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#312783]" />
                <span>
                  {userToEdit ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe initial'}
                </span>
                {!userToEdit && <span className="text-rose-500">*</span>}
              </label>
            </div>
            <input
              type="password"
              placeholder={userToEdit ? 'Laisser vide pour ne pas modifier' : 'Minimum 6 caractères'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]"
              required={!userToEdit}
            />
            {userToEdit && (
              <p className="text-[11px] text-gray-400 mt-1">
                Remplissez ce champ uniquement si vous souhaitez redéfinir le mot de passe de l’utilisateur.
              </p>
            )}
          </div>

          {userToEdit && (
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-800">Statut du compte</span>
                <p className="text-[11px] text-gray-400">
                  {isSelf
                    ? 'Vous ne pouvez pas désactiver votre propre compte connecté.'
                    : 'Un compte désactivé ne peut plus se connecter à l’administration.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={isSelf}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 disabled:opacity-50"></div>
              </label>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              {userToEdit ? 'Enregistrer les modifications' : 'Créer l’accès administrateur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
