// 1. Responsabilité : Modale d'accès élève avec QR Code, copier/coller et lien direct vers le profil
// 2. Dépendances clés : react, qrcode, lucide-react, src/utils/clipboard
// 3. Mots-clés métier : student_qr_modal, student_share_link, qrcode, direct_access, copy_paste

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, ExternalLink, X, Settings2 } from 'lucide-react';
import {
  getStudentShareableUrl,
  copyTextToClipboard,
  isLocalhostEnvironment,
  getSavedLanHost,
  setSavedLanHost,
} from '@/utils/clipboard';

export interface StudentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentClass: string;
  token: string;
}

export const StudentQrModal: React.FC<StudentQrModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentClass,
  token,
}) => {
  const isLocal = isLocalhostEnvironment();
  const [customHost, setCustomHost] = useState(getSavedLanHost());
  const [showConfig, setShowConfig] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Détermine l'URL finale selon l'environnement (production vs localhost)
  const fullStudentUrl = useMemo(() => {
    if (isLocal && customHost.trim()) {
      const clean = customHost.trim().replace(/^https?:\/\//, '');
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
      return `${protocol}//${clean}/v/${token}`;
    }
    return getStudentShareableUrl(token);
  }, [token, isLocal, customHost]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    QRCode.toDataURL(fullStudentUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#272154',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setGenerationError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setGenerationError(err instanceof Error ? err.message : 'Erreur génération QR Code');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, fullStudentUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyTextToClipboard(fullStudentUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveHost = (newHost: string) => {
    setCustomHost(newHost);
    setSavedLanHost(newHost);
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-qr-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* En-tête */}
        <div className="bg-[#272154] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg text-[#EB5E57]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 id="student-qr-modal-title" className="text-base font-bold">
                Lien d'Accès Élève
              </h2>
              <p className="text-xs text-white/70">
                {studentName} • {studentClass}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-6 space-y-4">
          {/* Bloc QR Code */}
          <div className="flex flex-col items-center justify-center bg-gray-50/80 p-4 rounded-xl border border-gray-200/80">
            {generationError ? (
              <div className="text-center p-6 text-rose-600 text-xs">{generationError}</div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code pour le dossier élève de ${studentName}`}
                className="w-56 h-56 rounded-lg shadow-xs bg-white p-2 border border-gray-200"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-gray-400">
                <QrCode className="w-12 h-12 animate-pulse" />
              </div>
            )}
            <div className="mt-3 text-center text-xs text-gray-600 font-medium">
              Scannez ce QR Code pour ouvrir le portail sur smartphone ou tablette
            </div>
          </div>

          {/* Bloc Copier / Coller */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>Lien direct (sans mot de passe requis)</span>
              {isLocal && (
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="flex items-center gap-1 text-[#312783] hover:underline"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>{showConfig ? 'Masquer config LAN' : 'Option IP Wi-Fi locale'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullStudentUrl}
                className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-700 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#312783] hover:bg-[#272154] text-white text-xs font-semibold shadow-xs transition-colors"
                title="Copier le lien"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option de configuration LAN (en dev local uniquement) */}
          {isLocal && showConfig && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
              <label className="block font-semibold text-amber-900">
                IP locale pour tests smartphone (ex: 192.168.1.xxx:5190) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customHost}
                  onChange={(e) => handleSaveHost(e.target.value)}
                  placeholder="ex: 192.168.1.212:5190"
                  className="w-full text-xs font-mono bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-gray-800 focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleSaveHost('')}
                  className="px-2 py-1.5 text-[11px] font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Bouton vers le profil élève & Fermer */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 text-xs">
            <a
              href={fullStudentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EB5E57] hover:bg-[#d94f48] text-white font-semibold shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ouvrir le profil élève</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
