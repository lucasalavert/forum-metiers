// 1. Responsabilité : Bouton d'action standardisé aux couleurs de la plateforme
// 2. Dépendances clés : react, clsx
// 3. Mots-clés métier : button, cta, ui_primitive, variants, accessibility

import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#EB5E57] text-white hover:bg-[#d94f48] focus:ring-[#EB5E57] shadow-sm',
    secondary: 'bg-[#312783] text-white hover:bg-[#272154] focus:ring-[#312783] shadow-sm',
    outline: 'border border-gray-300 bg-white text-[#272154] hover:bg-gray-50 focus:ring-[#312783]',
    danger: 'bg-[#E62154] text-white hover:bg-[#c91844] focus:ring-[#E62154] shadow-sm',
    ghost: 'text-[#272154] hover:bg-black/5 focus:ring-gray-300',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};
