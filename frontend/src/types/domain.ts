// 1. Responsabilité : Types et constantes de domaine pour la plateforme Forum des Métiers
// 2. Dépendances clés : aucune
// 3. Mots-clés métier : domain_types, levels, rotations, student, formation, assignment, wish

export const STUDENT_LEVELS = ['2NDE', '1ERE', 'TERM'] as const;
export type StudentLevel = (typeof STUDENT_LEVELS)[number];

export const ROTATION_NUMBERS = [1, 2, 3, 4, 5, 6] as const;
export type RotationNumber = (typeof ROTATION_NUMBERS)[number];

export const ASSIGNMENT_TYPES = ['FORMATION', 'SPECIALTY'] as const;
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];

export const SPECIALTY_ROTATION_MODES = ['AUTO', '1,2', '3,4', '1,3', '2,4', 'NONE'] as const;
export type SpecialtyRotationMode = (typeof SPECIALTY_ROTATION_MODES)[number];

export interface FormationItem {
  id: number;
  code: string;
  name: string;
  domain: string;
  description: string;
  speaker_name?: string;
  room?: string;
  target_levels: string;
  capacity_per_rotation: number;
  active_rotations: string;
  wishes_count_rank1: number;
  wishes_count_total: number;
  assigned_count: number;
  occupancy_r1: number;
  occupancy_r2: number;
  occupancy_r3: number;
  occupancy_r4: number;
  occupancy_r5?: number;
  occupancy_r6?: number;
}

export interface AssignmentBrief {
  rotation: number;
  assignment_type: AssignmentType;
  formation_id?: number | null;
  formation_name?: string | null;
  formation_room?: string | null;
  speaker_name?: string | null;
  wish_rank_obtained?: number | null;
  is_locked: boolean;
}

export interface StudentItem {
  id: number;
  token: string;
  first_name: string;
  last_name: string;
  class_name: string;
  level: StudentLevel;
  email?: string | null;
  wishes_submitted_at?: string | null;
  wishes_count: number;
  assignments: AssignmentBrief[];
}

export interface WishDetail {
  id: number;
  formation_id: number;
  formation_name: string;
  formation_domain: string;
  rank: number;
}

export interface ClassConfigItem {
  id: number;
  class_name: string;
  level: StudentLevel;
  specialty_rotations: string;
  students_count: number;
}
