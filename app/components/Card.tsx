import React from 'react';
import { Card as CardType } from '../../server/game';
import { cn } from '../lib/utils';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isDangerous?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled, isDangerous, className }) => {
  const isRainbow = card.type === 'rainbow';

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "relative w-20 h-28 sm:w-24 sm:h-32 rounded-xl border-2 transition-all duration-200 select-none flex flex-col items-center justify-center shadow-md",
        "bg-white text-slate-900",
        !disabled && "cursor-pointer hover:-translate-y-2 hover:shadow-lg active:scale-95",
        disabled && "opacity-50 cursor-not-allowed grayscale",
        isDangerous && "border-red-500 ring-2 ring-red-200 animate-pulse",
        !isDangerous && "border-slate-200",
        isRainbow && "border-transparent bg-gradient-to-br from-white to-slate-50",
        className
      )}
      style={isRainbow ? {
        backgroundClip: 'padding-box',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      } : undefined}
    >
      {isRainbow && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400 -z-10 m-[-2px]" />
      )}

      <div className="text-2xl sm:text-3xl font-bold tracking-tighter">
        {card.value}
      </div>
      <div className="text-[10px] sm:text-xs text-center px-1 leading-tight text-slate-500 mt-1 font-medium">
        {card.label.replace(/\(.*\)/, '')}
      </div>
      {isDangerous && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
          !
        </div>
      )}
    </div>
  );
};

export default Card;
