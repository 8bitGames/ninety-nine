import React from 'react';
import { Card as CardType } from '../lib/GameLogic';
import { cn } from '../lib/utils';
import {
  Sword, Shield, Zap, Skull, Ghost, Crown, Star, Heart,
  Flame, Droplets, Wind, Mountain, Sparkles, AlertTriangle,
  ArrowUpCircle, RefreshCw, XCircle
} from 'lucide-react';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  isDangerous?: boolean;
  className?: string;
  readOnly?: boolean;
  size?: 'normal' | 'large';
}

const getCardVisuals = (card: CardType) => {
  const val = String(card.value);

  switch (val) {
    case '1': return { icon: Sword, name: '전사', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
    case '2': return { icon: Shield, name: '가디언', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
    case '3': return { icon: Wind, name: '궁수', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
    case '4': return { icon: Mountain, name: '골렘', color: 'text-stone-500', bg: 'bg-stone-50', border: 'border-stone-200' };
    case '5': return { icon: Flame, name: '화염법사', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
    case '6': return { icon: Droplets, name: '물정령', color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-200' };
    case '7': return { icon: Zap, name: '번개술사', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    case '8': return { icon: Star, name: '성직자', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' };
    case '9': return { icon: Ghost, name: '유령', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    case '10': return { icon: Crown, name: '영웅', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
    case '0': return { icon: RefreshCw, name: '트릭스터', color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200' };
    case 'J': return { icon: Sparkles, name: '마법사', color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200' };
    case 'Q': return { icon: Heart, name: '여왕', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' };
    case 'K': return { icon: Crown, name: '왕', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-400' };
    default: return { icon: Star, name: '용병', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' };
  }
};

const Card: React.FC<CardProps> = ({ card, onClick, disabled, isDangerous, className, readOnly, size = 'normal' }) => {
  const isRainbow = card.type === 'rainbow';
  const { icon: Icon, name, color, bg, border } = getCardVisuals(card);
  const isLarge = size === 'large';

  return (
    <div
      onClick={!disabled && !readOnly ? onClick : undefined}
      className={cn(
        "relative w-24 h-36 sm:w-28 sm:h-40 rounded-xl border-2 transition-all duration-300 select-none flex flex-col shadow-md overflow-hidden group",
        bg, border,
        !disabled && !readOnly && "cursor-pointer hover:-translate-y-3 hover:shadow-xl hover:scale-105 active:scale-95 z-0 hover:z-10",
        disabled && "opacity-50 cursor-not-allowed grayscale",
        readOnly && "cursor-default",
        isDangerous && "border-red-500 ring-4 ring-red-500/30 animate-pulse",
        // Rainbow card special styling
        isRainbow && "bg-gradient-to-br from-violet-50 via-pink-50 to-amber-50 border-transparent",
        isRainbow && "ring-2 ring-offset-1 ring-gradient-to-r from-violet-400 via-pink-400 to-amber-400",
        isRainbow && !isDangerous && "shadow-[0_0_15px_rgba(167,139,250,0.4)]",
        className
      )}
    >
      {/* Rainbow Border Glow Effect */}
      {isRainbow && (
        <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 -z-10 opacity-70" />
      )}

      {/* Card Header */}
      <div className={cn(
        "flex justify-between items-center border-b border-black/5",
        isLarge ? "px-3 py-2" : "px-2 py-1",
        isRainbow ? "bg-gradient-to-r from-violet-100/80 via-pink-100/80 to-amber-100/80" : "bg-white/50"
      )}>
        <span className={cn(
          "font-black",
          isLarge ? "text-4xl sm:text-5xl" : "text-base sm:text-lg",
          color
        )}>{card.value}</span>
        <div className="flex items-center gap-1">
          {isRainbow && <span className={isLarge ? "text-base" : "text-[10px]"}>🌈</span>}
          <span className={cn(
            "text-slate-500 font-medium tracking-tighter",
            isLarge ? "text-sm sm:text-base" : "text-[10px]"
          )}>{name}</span>
        </div>
      </div>

      {/* Card Image Area */}
      <div className="flex-1 flex items-center justify-center relative bg-white/30">
        <div className={cn(
          "absolute inset-0 opacity-10 bg-current",
          color
        )} />
        <Icon className={cn(
          "drop-shadow-sm transition-transform duration-300 group-hover:scale-110",
          isLarge ? "w-16 h-16 sm:w-20 sm:h-20" : "w-10 h-10 sm:w-12 sm:h-12",
          color
        )} />
      </div>


      {/* Rainbow Effect Overlay */}
      {isRainbow && (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-violet-200/20 via-pink-200/20 to-amber-200/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
        </>
      )}

      {/* Danger Badge */}
      {isDangerous && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-bl-lg font-bold shadow-sm z-20">
          <AlertTriangle className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

export default Card;
