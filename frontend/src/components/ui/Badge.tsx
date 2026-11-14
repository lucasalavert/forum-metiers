// 1. Responsabilité : Badge de statut, niveau ou domaine aux couleurs du forum
// 2. Dépendances clés : react, clsx
// 3. Mots-clés métier : badge, pill, tag, level_indicator, domain_label

import React from 'react';
import clsx from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const base = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    primary: 'bg-[#EB5E57]/15 text-[#EB5E57] border border-[#EB5E57]/30',
    secondary: 'bg-[#312783]/15 text-[#312783] border border-[#312783]/30',
    success: 'bg-[#00A68D]/15 text-[#00A68D] border border-[#00A68D]/30',
    warning: 'bg-amber-100 text-amber-800 border border-amber-300',
    danger: 'bg-[#E62154]/15 text-[#E62154] border border-[#E62154]/30',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
    purple: 'bg-[#9E2986]/15 text-[#9E2986] border border-[#9E2986]/30',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return <span className={clsx(base, variants[variant], sizes[size], className)}>{children}</span>;
};
