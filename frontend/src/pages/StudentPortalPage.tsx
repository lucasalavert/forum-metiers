// 1. Responsabilité : Page du portail élève accessible par lien unique pour formuler ses vœux et voir son planning
// 2. Dépendances clés : react, react-router-dom, src/hooks/*, src/components/portal/*
// 3. Mots-clés métier : student_portal, unique_token, wish_submission, catalog_picker, student_schedule

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { Calendar, ListOrdered, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePortalStudent, usePortalWishesMutation } from '@/hooks/usePortalStudent';
import { useFormationsList } from '@/hooks/useFormations';
import { FormationItem } from '@/types/domain';
import { FormationCatalogSelector } from '@/components/portal/FormationCatalogSelector';
import { WishOrderedList } from '@/components/portal/WishOrderedList';
import { StudentScheduleCard } from '@/components/portal/StudentScheduleCard';

export default function StudentPortalPage() {
  const { token } = useParams<{ token: string }>();
  const activeToken = token || '';

  const { data: student, isLoading, isError } = usePortalStudent(activeToken);
  const { data: formationsData } = useFormationsList(student?.level);
  const submitMutation = usePortalWishesMutation(activeToken);

  const [orderedWishes, setOrderedWishes] = useState<FormationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'wishes' | 'schedule'>('wishes');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  useDocumentTitle(student ? `${student.first_name} ${student.last_name}` : 'Portail Élève');

  useEffect(() => {
    if (student && formationsData?.items && student.wishes && student.wishes.length > 0) {
      const sortedExisting = [...student.wishes].sort((a, b) => a.rank - b.rank);
      const mapped = sortedExisting
        .map((w) => formationsData.items.find((f) => f.id === w.formation_id))
        .filter((f): f is FormationItem => !!f);
      setOrderedWishes(mapped);
    }
  }, [student, formationsData]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#312783] border-t-transparent mb-4" />
        <p className="text-sm font-medium text-gray-600">Chargement de votre dossier...</p>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-gray-200 text-center shadow-sm">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
        <h3 className="font-heading font-bold text-lg text-[#272154]">Lien d'accès invalide</h3>
        <p className="text-xs text-gray-500 mt-2">
          Le lien utilisé est incorrect ou a expiré. Veuillez contacter votre professeur principal ou vérifier le lien reçu par message.
        </p>
      </div>
    );
  }

  const handleAddWish = (formation: FormationItem) => {
    if (orderedWishes.length < student.required_wishes_count) {
      setOrderedWishes((prev) => [...prev, formation]);
      setIsSavedSuccess(false);
      setSubmitErrorMsg(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setOrderedWishes((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setIsSavedSuccess(false);
  };

  const handleMoveDown = (index: number) => {
    if (index === orderedWishes.length - 1) return;
    setOrderedWishes((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setIsSavedSuccess(false);
  };

  const handleRemove = (index: number) => {
    setOrderedWishes((prev) => prev.filter((_, i) => i !== index));
    setIsSavedSuccess(false);
    setSubmitErrorMsg(null);
  };

  const handleSubmitWishes = async () => {
    setSubmitErrorMsg(null);
    const payload = orderedWishes.map((f, idx) => ({
      formation_id: f.id,
      rank: idx + 1,
    }));
    try {
      await submitMutation.mutateAsync(payload);
      setIsSavedSuccess(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : "Impossible d'enregistrer vos vœux.";
      setSubmitErrorMsg(msg);
    }
  };

  const scrollToWishes = () => {
    const el = document.getElementById('student-wishes-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#312783]/10 text-[#312783]">
              {student.class_name} • {student.level}
            </span>
            {student.wishes_submitted_at && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vœux enregistrés
              </span>
            )}
          </div>
          <h2 className="font-heading font-bold text-2xl text-[#272154] mt-1">
            Bonjour {student.first_name} {student.last_name}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xl">
            {student.has_specialty_rotations ? (
              <>
                En classe de <b>Seconde</b>, formulez <b>{student.required_wishes_count} vœux par ordre de préférence</b>.
                Vous participerez à <b>{student.required_formations_count} formation(s)</b> et à la présentation des
                spécialités ({student.specialty_rotations_label}).
              </>
            ) : (
              <>
                En classe de <b>{student.level}</b>, classez <b>{student.required_wishes_count} vœux par ordre de préférence</b> pour
                vos <b>{student.required_formations_count} rotations</b> du forum.
              </>
            )}
          </p>
        </div>

        <div className="flex bg-[#F3F1F0] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('wishes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'wishes'
                ? 'bg-white text-[#272154] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Formuler mes vœux</span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'schedule'
                ? 'bg-white text-[#272154] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Mon planning final</span>
          </button>
        </div>
      </div>

      {submitErrorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{submitErrorMsg}</span>
        </div>
      )}

      {activeTab === 'wishes' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <FormationCatalogSelector
              formations={formationsData?.items || []}
              selectedFormationIds={orderedWishes.map((f) => f.id)}
              onAddWish={handleAddWish}
              maxWishesReached={orderedWishes.length >= student.required_wishes_count}
            />
          </div>

          <div id="student-wishes-section" className="lg:col-span-5 scroll-mt-20">
            <WishOrderedList
              wishes={orderedWishes}
              requiredCount={student.required_wishes_count}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onRemove={handleRemove}
              onSubmit={handleSubmitWishes}
              isSubmitting={submitMutation.isPending}
              isSaved={isSavedSuccess}
            />
          </div>
        </div>
      ) : (
        <StudentScheduleCard
          assignments={student.assignments}
          studentName={`${student.first_name} ${student.last_name}`}
          className={student.class_name}
        />
      )}

      {activeTab === 'wishes' &&
        (() => {
          const mobileBar = (
            <aside
              aria-label="Actions rapides pour mobile"
              className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    orderedWishes.length === student.required_wishes_count
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-[#312783]/10 text-[#312783]'
                  }`}
                >
                  {orderedWishes.length} / {student.required_wishes_count} vœux
                </span>
                {isSavedSuccess && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={scrollToWishes}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Voir ma liste
                </button>

                {orderedWishes.length === student.required_wishes_count && (
                  <button
                    type="button"
                    onClick={handleSubmitWishes}
                    disabled={submitMutation.isPending}
                    className="px-3.5 py-1.5 rounded-lg bg-[#EB5E57] hover:bg-[#d94f48] text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {submitMutation.isPending ? 'Enregistrement...' : 'Valider'}
                  </button>
                )}
              </div>
            </aside>
          );
          return typeof document !== 'undefined' ? createPortal(mobileBar, document.body) : mobileBar;
        })()}
    </div>
  );
}
