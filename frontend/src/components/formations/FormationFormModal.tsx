// 1. Responsabilité : Modale de création et modification d'une formation
// 2. Dépendances clés : react, src/components/ui/Modal, src/components/ui/Button, src/types/domain.ts
// 3. Mots-clés métier : formation_modal, form_validation, target_levels, capacity_edit

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormationItem } from '@/types/domain';

export interface FormationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formation?: FormationItem | null;
  onSave: (payload: Partial<FormationItem>) => Promise<void>;
  isLoading: boolean;
}

export const FormationFormModal: React.FC<FormationFormModalProps> = ({
  isOpen,
  onClose,
  formation,
  onSave,
  isLoading,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [room, setRoom] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [levels, setLevels] = useState<string[]>(['2NDE', '1ERE', 'TERM']);

  useEffect(() => {
    if (formation) {
      setCode(formation.code);
      setName(formation.name);
      setDomain(formation.domain);
      setDescription(formation.description || '');
      setSpeakerName(formation.speaker_name || '');
      setRoom(formation.room || 'Salle standard');
      setCapacity(formation.capacity_per_rotation);
      setLevels(formation.target_levels.split(',').map((l) => l.trim()));
    } else {
      setCode('');
      setName('');
      setDomain('Sciences & Ingénierie');
      setDescription('');
      setSpeakerName('');
      setRoom('Salle standard');
      setCapacity(20);
      setLevels(['2NDE', '1ERE', 'TERM']);
    }
  }, [formation, isOpen]);

  const toggleLevel = (lvl: string) => {
    setLevels((prev) => (prev.includes(lvl) ? prev.filter((l) => l !== lvl) : [...prev, lvl]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || levels.length === 0) return;

    await onSave({
      code,
      name,
      domain,
      description,
      speaker_name: speakerName,
      room,
      capacity_per_rotation: Number(capacity),
      target_levels: levels.join(','),
      active_rotations: '1,2,3,4',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formation ? `Modifier la formation : ${formation.code}` : 'Ajouter une nouvelle formation'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ex: FOR-41"
              className="w-full px-3 py-2 border rounded-xl font-mono uppercase focus:ring-2 focus:ring-[#312783]"
            />
          </div>
          <div className="col-span-2">
            <label className="block font-medium text-gray-700 mb-1">Intitulé de la formation</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Études d'Architecture & Urbanisme"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#312783]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Domaine</label>
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="ex: Santé, Droit, Ingénierie..."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#312783]"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Capacité max par rotation</label>
            <input
              type="number"
              min={5}
              max={60}
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#312783]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Intervenant / Organisme</label>
            <input
              type="text"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="ex: Mme Laurent (ENSMM)"
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#312783]"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Salle attribuée</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="ex: B104, Amphi..."
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#312783]"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Niveaux scolaires autorisés</label>
          <div className="flex gap-4">
            {['2NDE', '1ERE', 'TERM'].map((lvl) => (
              <label key={lvl} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={levels.includes(lvl)}
                  onChange={() => toggleLevel(lvl)}
                  className="rounded text-[#EB5E57] focus:ring-[#EB5E57]"
                />
                <span className="font-semibold">{lvl}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-medium text-gray-700 mb-1">Description sommaire</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Objectifs de la formation, débouchés..."
            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#312783]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {formation ? 'Enregistrer les modifications' : 'Créer la formation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
