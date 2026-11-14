// 1. Responsabilité : Conteneur de carte stylisé avec bordures arrondies et ombres douces
// 2. Dépendances clés : react, clsx
// 3. Mots-clés métier : card, container, surface, rounded_card, layout

import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-[1.25rem] border border-gray-100/80 shadow-sm p-6 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
