// 1. Responsabilité : Page d'administration pour la configuration globale, marque blanche, couleurs et rotations
// 2. Dépendances clés : react, lucide-react, src/hooks/useEventConfig, src/components/config/*
// 3. Mots-clés métier : config_admin_page, forum_date, rotation_times, theme_colors, home_access_instructions

import React, { useState, useEffect } from 'react';
import { Calendar, Save, CheckCircle2, AlertCircle, Sliders, Building, Mail, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnnualMaintenanceCard } from '@/components/config/AnnualMaintenanceCard';
import { RotationSlotsConfigCard, RotationTimesState } from '@/components/config/RotationSlotsConfigCard';
import { SchoolBrandingConfigCard, SchoolBrandingState } from '@/components/config/SchoolBrandingConfigCard';
import { DEFAULT_THEME_COLORS, useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useEventConfig, useUpdateEventConfig } from '@/hooks/useEventConfig';
import { DEFAULT_BRANDING } from '@/lib/constants';

export default function ForumConfigAdminPage() {
  const { data: config, isLoading } = useEventConfig();
  useDocumentTitle('Configuration Globale', config?.school_name);
  const updateMutation = useUpdateEventConfig();

  const [general, setGeneral] = useState({
    eventTitle: '', eventDate: '2027-01-20', eventDateLabel: DEFAULT_BRANDING.EVENT_DATE_LABEL as string,
    location: '', contactEmail: '', defaultCapacity: 20, wishesOpen: true,
    rotationsCount: 4, secondeSpecialtySlots: 2, homeAccessInstructions: '',
  });

  const [branding, setBranding] = useState<SchoolBrandingState>({
    schoolName: DEFAULT_BRANDING.SCHOOL_NAME, schoolSubtitle: DEFAULT_BRANDING.SCHOOL_SUBTITLE,
    schoolLogoUrl: '', schoolWebsiteUrl: DEFAULT_BRANDING.SCHOOL_WEBSITE_URL, entName: DEFAULT_BRANDING.ENT_NAME,
    themePrimaryColor: DEFAULT_THEME_COLORS.PRIMARY,
    themeSecondaryColor: DEFAULT_THEME_COLORS.SECONDARY,
    themeAccentColor: DEFAULT_THEME_COLORS.ACCENT,
  });

  const [rotTimes, setRotTimes] = useState<RotationTimesState>({
    r1Start: '08:30', r1End: '09:20', r2Start: '09:20', r2End: '10:10',
    r3Start: '10:20', r3End: '11:10', r4Start: '11:10', r4End: '12:00',
    r5Start: '13:30', r5End: '14:20', r6Start: '14:30', r6End: '15:20',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setGeneral({
      eventTitle: config.event_title, eventDate: config.event_date, eventDateLabel: config.event_date_label,
      location: config.location, contactEmail: config.contact_email, defaultCapacity: config.default_capacity,
      wishesOpen: config.wishes_open, rotationsCount: config.rotations_count ?? config.rotations?.length ?? 4,
      secondeSpecialtySlots: config.seconde_specialty_slots ?? 2,
      homeAccessInstructions: config.home_access_instructions ?? '',
    });
    setBranding({
      schoolName: config.school_name || DEFAULT_BRANDING.SCHOOL_NAME,
      schoolSubtitle: config.school_subtitle ?? DEFAULT_BRANDING.SCHOOL_SUBTITLE,
      schoolLogoUrl: config.school_logo_url ?? '', schoolWebsiteUrl: config.school_website_url ?? '',
      entName: config.ent_name || DEFAULT_BRANDING.ENT_NAME,
      themePrimaryColor: config.theme_primary_color || DEFAULT_THEME_COLORS.PRIMARY,
      themeSecondaryColor: config.theme_secondary_color || DEFAULT_THEME_COLORS.SECONDARY,
      themeAccentColor: config.theme_accent_color || DEFAULT_THEME_COLORS.ACCENT,
    });
    if (config.rotations && config.rotations.length > 0) {
      setRotTimes((prev) => ({
        r1Start: config.rotations[0]?.start_time || prev.r1Start, r1End: config.rotations[0]?.end_time || prev.r1End,
        r2Start: config.rotations[1]?.start_time || prev.r2Start, r2End: config.rotations[1]?.end_time || prev.r2End,
        r3Start: config.rotations[2]?.start_time || prev.r3Start, r3End: config.rotations[2]?.end_time || prev.r3End,
        r4Start: config.rotations[3]?.start_time || prev.r4Start, r4End: config.rotations[3]?.end_time || prev.r4End,
        r5Start: config.rotations[4]?.start_time || prev.r5Start, r5End: config.rotations[4]?.end_time || prev.r5End,
        r6Start: config.rotations[5]?.start_time || prev.r6Start, r6End: config.rotations[5]?.end_time || prev.r6End,
      }));
    }
  }, [config]);

  const handleDateChange = (newDate: string) => {
    let nextLabel = general.eventDateLabel;
    try {
      const parsed = new Date(newDate + 'T12:00:00');
      const formatted = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      }).format(parsed);
      nextLabel = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch { /* Ignorer si date partielle */ }
    setGeneral((prev) => ({ ...prev, eventDate: newDate, eventDateLabel: nextLabel }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    setSaveError(null);
    try {
      await updateMutation.mutateAsync({
        event_title: general.eventTitle, event_date: general.eventDate, event_date_label: general.eventDateLabel,
        location: general.location, contact_email: general.contactEmail, default_capacity: general.defaultCapacity,
        wishes_open: general.wishesOpen, rotations_count: general.rotationsCount,
        seconde_specialty_slots: general.secondeSpecialtySlots, home_access_instructions: general.homeAccessInstructions,
        school_name: branding.schoolName, school_subtitle: branding.schoolSubtitle,
        school_logo_url: branding.schoolLogoUrl, school_website_url: branding.schoolWebsiteUrl,
        ent_name: branding.entName, theme_primary_color: branding.themePrimaryColor,
        theme_secondary_color: branding.themeSecondaryColor, theme_accent_color: branding.themeAccentColor,
        r1_start: rotTimes.r1Start, r1_end: rotTimes.r1End, r2_start: rotTimes.r2Start, r2_end: rotTimes.r2End,
        r3_start: rotTimes.r3Start, r3_end: rotTimes.r3End, r4_start: rotTimes.r4Start, r4_end: rotTimes.r4End,
        r5_start: rotTimes.r5Start, r5_end: rotTimes.r5End, r6_start: rotTimes.r6Start, r6_end: rotTimes.r6End,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : "Impossible d'enregistrer la configuration.";
      setSaveError(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#312783] border-t-transparent mb-4" />
        <p className="text-sm font-medium text-gray-600">Chargement de la configuration...</p>
      </div>
    );
  }

  const inputCls = 'w-full text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]';

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#272154]">Configuration Globale du Forum</h2>
          <p className="text-xs text-gray-500 mt-1">
            Définissez l'identité de l'établissement, les couleurs, la date et le format des rotations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Modifications enregistrées !</span>
            </div>
          )}
          <Button type="submit" variant="primary" isLoading={updateMutation.isPending} className="shadow-sm">
            <Save className="w-4 h-4" />
            <span>Enregistrer la configuration</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 bg-white border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Calendar className="w-4 h-4 text-[#EB5E57]" />
              <h3 className="font-heading font-bold text-sm text-[#272154]">Date & Informations de l'Événement</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#272154] mb-1">Titre officiel de l'événement</label>
              <input type="text" required value={general.eventTitle} onChange={(e) => setGeneral((p) => ({ ...p, eventTitle: e.target.value }))} className={inputCls} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#272154] mb-1">Date exacte du forum</label>
                <input type="date" required value={general.eventDate} onChange={(e) => handleDateChange(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#272154] mb-1">Libellé affiché sur les plannings</label>
                <input type="text" required value={general.eventDateLabel} onChange={(e) => setGeneral((p) => ({ ...p, eventDateLabel: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#272154] mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-gray-400" />
                <span>Lieu / Adresse affichée</span>
              </label>
              <input type="text" required value={general.location} onChange={(e) => setGeneral((p) => ({ ...p, location: e.target.value }))} className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#272154] mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Email de contact (orientation)</span>
              </label>
              <input type="email" required value={general.contactEmail} onChange={(e) => setGeneral((p) => ({ ...p, contactEmail: e.target.value }))} className={inputCls} />
            </div>
          </Card>

          <Card className="p-6 bg-white border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Sliders className="w-4 h-4 text-[#312783]" />
              <h3 className="font-heading font-bold text-sm text-[#272154]">Règles de Collecte & Accueil Élèves</h3>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F3F1F0]/60 border border-gray-200">
              <div>
                <p className="text-xs font-semibold text-[#272154]">Ouverture de la saisie des vœux</p>
                <p className="text-[11px] text-gray-500">Permet aux élèves de modifier leurs choix sur le portail individuel</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={general.wishesOpen} onChange={(e) => setGeneral((p) => ({ ...p, wishesOpen: e.target.checked }))} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#EB5E57]" />
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#272154] mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span>Capacité maximale standard par atelier (par rotation)</span>
              </label>
              <div className="flex items-center gap-3">
                <input type="number" min="5" max="100" value={general.defaultCapacity} onChange={(e) => setGeneral((p) => ({ ...p, defaultCapacity: Number(e.target.value) }))} className="w-24 text-xs p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#312783]" />
                <span className="text-xs text-gray-500">élèves par salle par rotation</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#272154]">
                  Consignes « Comment accéder à votre espace élève ? » (Page d'accueil /)
                </label>
                {general.homeAccessInstructions && (
                  <button type="button" onClick={() => setGeneral((p) => ({ ...p, homeAccessInstructions: '' }))} className="text-[10px] font-semibold text-[#312783] hover:underline">
                    Texte automatique par défaut
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={general.homeAccessInstructions}
                onChange={(e) => setGeneral((p) => ({ ...p, homeAccessInstructions: e.target.value }))}
                placeholder={`1 ligne = 1 étape numérotée. Laissez vide pour utiliser les consignes automatiques (${branding.entName}).`}
                className={inputCls}
              />
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <SchoolBrandingConfigCard
            branding={branding}
            onChange={(key, val) => setBranding((prev) => ({ ...prev, [key]: val }))}
          />
          <RotationSlotsConfigCard
            rotationsCount={general.rotationsCount}
            secondeSpecialtySlots={general.secondeSpecialtySlots}
            times={rotTimes}
            onChangeRotationsCount={(cnt) => setGeneral((prev) => ({ ...prev, rotationsCount: cnt }))}
            onChangeSecondeSpecialtySlots={(slots) => setGeneral((prev) => ({ ...prev, secondeSpecialtySlots: slots }))}
            onChange={(key, val) => setRotTimes((prev) => ({ ...prev, [key]: val }))}
          />
        </div>
      </div>

      <AnnualMaintenanceCard eventDate={general.eventDate} />
    </form>
  );
}
