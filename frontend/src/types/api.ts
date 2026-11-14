// 1. Responsabilité : Interfaces des enveloppes et payloads de l'API REST
// 2. Dépendances clés : src/types/domain.ts
// 3. Mots-clés métier : api_interfaces, payloads, stats, responses, dynamic_rotations

import { AssignmentBrief, FormationItem, StudentItem, StudentLevel, WishDetail } from './domain';

export interface FormationListResponse {
  items: FormationItem[];
  total: number;
}

export interface StudentListResponse {
  items: StudentItem[];
  total: number;
  page: number;
  size: number;
}

export interface StudentPortalResponse {
  id: number;
  first_name: string;
  last_name: string;
  class_name: string;
  level: StudentLevel;
  required_wishes_count: number;
  required_formations_count: number;
  has_specialty_rotations: boolean;
  specialty_rotations_label: string;
  wishes_submitted_at?: string | null;
  wishes: WishDetail[];
  assignments: AssignmentBrief[];
}

export interface SatisfactionBreakdown {
  rank_1_count: number;
  rank_2_count: number;
  rank_3_count: number;
  rank_4_plus_count: number;
  unassigned_or_fallback_count: number;
  specialty_count: number;
  total_assignments: number;
  satisfaction_rate_percent: number;
}

export interface FormationTensionItem {
  formation_id: number;
  code: string;
  name: string;
  domain: string;
  capacity_total: number;
  wishes_rank1: number;
  wishes_total: number;
  tension_ratio: number;
  assigned_total: number;
  occupancy_r1: number;
  occupancy_r2: number;
  occupancy_r3: number;
  occupancy_r4: number;
  occupancy_r5?: number;
  occupancy_r6?: number;
}

export interface AllocationStatsResponse {
  total_students: number;
  students_with_wishes: number;
  students_without_wishes?: number;
  students_pending_allocation?: number;
  students_fully_allocated?: number;
  unassigned_wishes_total?: number;
  response_rate_percent: number;
  total_formations: number;
  total_seats_capacity: number;
  total_assigned_seats: number;
  overall_fill_rate_percent: number;
  satisfaction: SatisfactionBreakdown;
  tensions: FormationTensionItem[];
  rotations_occupancy: Record<string, number>;
}

export interface CSVImportResultResponse {
  success: boolean;
  imported_count: number;
  updated_count: number;
  errors: string[];
}

export interface RotationTimeSlot {
  rotation: number;
  start_time: string;
  end_time: string;
  label: string;
}

export interface EventConfig {
  id: number;
  event_title: string;
  event_date: string;
  event_date_label: string;
  location: string;
  school_name: string;
  school_subtitle: string;
  school_logo_url: string;
  school_website_url: string;
  ent_name: string;
  home_access_instructions?: string;
  theme_primary_color?: string;
  theme_secondary_color?: string;
  theme_accent_color?: string;
  rotations_count?: number;
  seconde_specialty_slots?: number;
  rotations: RotationTimeSlot[];
  wishes_open: boolean;
  default_capacity: number;
  contact_email: string;
  updated_at?: string | null;
}

export interface EventConfigUpdatePayload {
  event_title?: string;
  event_date?: string;
  event_date_label?: string;
  location?: string;
  school_name?: string;
  school_subtitle?: string;
  school_logo_url?: string;
  school_website_url?: string;
  ent_name?: string;
  home_access_instructions?: string;
  theme_primary_color?: string;
  theme_secondary_color?: string;
  theme_accent_color?: string;
  rotations_count?: number;
  seconde_specialty_slots?: number;
  r1_start?: string;
  r1_end?: string;
  r2_start?: string;
  r2_end?: string;
  r3_start?: string;
  r3_end?: string;
  r4_start?: string;
  r4_end?: string;
  r5_start?: string;
  r5_end?: string;
  r6_start?: string;
  r6_end?: string;
  wishes_open?: boolean;
  default_capacity?: number;
  contact_email?: string;
}

export interface LoginPayload {
  username_or_email: string;
  password: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at?: string | null;
  last_login?: string | null;
}

export interface AdminUserCreatePayload {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

export interface AdminUserUpdatePayload {
  username?: string;
  email?: string;
  full_name?: string;
  is_active?: boolean;
  password?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AdminUser;
}

export interface PurgeForumDataPayload {
  purge_wishes: boolean;
  purge_students: boolean;
  purge_formations: boolean;
}

export interface PurgeForumDataResponse {
  deleted_formations: number;
  deleted_students: number;
  deleted_classes: number;
  deleted_wishes: number;
  deleted_assignments: number;
  message: string;
}
