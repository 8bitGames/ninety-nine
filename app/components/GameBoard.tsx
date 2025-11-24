import React, { useEffect, useState } from 'react';
import Card from './Card';
import EffectModal from './EffectModal';
import { Card as CardType, GameLogic } from '../lib/GameLogic';
import { soundManager } from '../utils/SoundManager';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RotateCw, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface GameBoardProps {
    game: GameLogic;
    gameState: any;
    myHand: CardType[];
    logs: string[];
    playerName: string;
    playerId: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ game, gameState, myHand, logs, playerName, playerId }) => {
    const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

    // Sound Effects based on state changes
    useEffect(() => {
        // We can't easily detect changes here without previous state, 
        // but the GameLogic could trigger sounds or we can just rely on the fact that 
        // actions trigger sounds in the logic or we just play them on interaction.
        // For simplicity, let's play sounds on click for now to save complexity, 
        // or rely on logs for elimination sounds.

        const lastLog = logs[logs.length - 1];
        if (lastLog && lastLog.includes('eliminated')) {
            soundManager.eliminate();
        }
        if (gameState.winner) {
            soundManager.win();
        }
    }, [logs, gameState.winner]);

    const handleCardClick = (card: CardType) => {
        if (gameState.status !== 'PLAYING') return;

        const myIndex = gameState.players.findIndex((p: any) => p.id === playerId);
        if (myIndex !== gameState.turnIndex) {
            return;
        }

        if (card.type === 'rainbow') {
            setSelectedCard(card);
        } else {
            const result = game.playCard(playerId, card.id);
            if (result.success) {
                soundManager.playCard();
            } else {
                soundManager.error();
            }
        }
    };

    const handleEffectConfirm = (options: any) => {
        if (selectedCard) {
            const result = game.playCard(playerId, selectedCard.id, options);
            if (result.success) {
                soundManager.playCard();
            } else {
                soundManager.error();
            }
            setSelectedCard(null);
        }
    };

    const myPlayer = gameState.players.find((p: any) => p.id === playerId);
    const isMyTurn = gameState.turnIndex !== -1 && gameState.players[gameState.turnIndex]?.id === playerId;

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-50 relative overflow-hidden">
            {/* Top Bar: Opponents */}
            <div className="p-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 z-10">
                <div className="flex justify-between items-center mb-4">
                    <Badge variant="outline" className="text-slate-400 border-slate-700">Single Player</Badge>
                </div>

                {/* Opponents Scroll */}
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {gameState.players.filter((p: any) => p.id !== playerId).map((p: any) => {
                        const isTurn = gameState.turnIndex !== -1 && gameState.players[gameState.turnIndex]?.id === p.id;
                        return (
                            <div key={p.id} className={cn(
                                "flex flex-col items-center min-w-[80px] p-2 rounded-lg transition-all",
                                isTurn ? "bg-indigo-500/20 border border-indigo-500/50" : "bg-slate-900 border border-slate-800",
                                !p.isAlive && "opacity-50 grayscale"
                            )}>
                                <div className="text-xs font-bold truncate w-full text-center">{p.name}</div>
                                <div className="text-[10px] text-slate-400">{p.cardCount} Cards</div>
                                {!p.isAlive && <div className="text-[10px] text-red-500 font-bold">OUT</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Center: Game Stats */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Direction Indicator */}
                <div className="absolute top-4 right-4 animate-pulse text-slate-600">
                    {gameState.direction === 1 ? <RotateCw className="h-12 w-12 opacity-20" /> : <RotateCcw className="h-12 w-12 opacity-20" />}
                </div>

                {/* Total Score */}
                <div className="relative z-0 flex flex-col items-center">
                    <div className="text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent drop-shadow-2xl">
                        {gameState.currentTotal}
                    </div>
                    <div className="text-sm text-slate-500 font-medium uppercase tracking-widest mt-2">Current Total</div>
                </div>

                {/* Game Status */}
                {gameState.status === 'ENDED' && (
                    <div className="mt-8 text-center animate-in zoom-in duration-500">
                        <div className="text-3xl font-black text-yellow-400 mb-2">GAME OVER</div>
                        <div className="text-xl text-white mb-6">Winner: {gameState.winner?.name}</div>

                        <Button
                            onClick={() => game.restartGame()}
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 font-bold animate-pulse"
                        >
                            Play Again
                        </Button>
                    </div>
                )}

                {/* Logs Overlay */}
                <div className="absolute bottom-4 left-0 right-0 px-4 flex flex-col items-center pointer-events-none">
                    {logs.map((log, i) => (
                        <div key={i} className="text-xs text-slate-400 bg-black/50 px-2 py-1 rounded mb-1 animate-out fade-out duration-1000 delay-2000 fill-mode-forwards">
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom: Player Hand */}
            <div className={cn(
                "p-4 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 transition-all duration-300",
                isMyTurn ? "pb-8 border-indigo-500/50 shadow-[0_-4px_20px_rgba(99,102,241,0.2)]" : "pb-6"
            )}>
                <div className="flex justify-between items-center mb-3 px-2">
                    <div className="text-sm font-bold text-slate-200">{playerName} (You)</div>
                    {isMyTurn && <Badge className="bg-indigo-500 animate-pulse">YOUR TURN</Badge>}
                    {!myPlayer?.isAlive && <Badge variant="destructive">ELIMINATED</Badge>}
                </div>

                <div className="flex justify-center gap-2 sm:gap-4 overflow-x-visible px-2 py-2">
                    {myHand.map((card, i) => {
                        let isDangerous = false;
                        if (gameState.status === 'PLAYING' && isMyTurn) {
                            let potentialValue = 0;
                            if (card.type === 'normal') potentialValue = Number(card.value);
                            if (card.type === 'rainbow' && card.value !== '9') { // Simplified check
                                if (gameState.currentTotal + potentialValue > 99) isDangerous = true;
                            } else if (card.type === 'normal') {
                                if (gameState.currentTotal + potentialValue > 99) isDangerous = true;
                            }
                        }

                        return (
                            <div key={card.id} style={{ transform: `rotate(${(i - (myHand.length - 1) / 2) * 5}deg) translateY(${isMyTurn ? '-10px' : '0'})` }} className="transition-transform origin-bottom">
                                <Card
                                    card={card}
                                    onClick={() => handleCardClick(card)}
                                    disabled={!isMyTurn || !myPlayer?.isAlive}
                                    isDangerous={isDangerous}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals */}
            {selectedCard && (
                <EffectModal
                    card={selectedCard}
                    onConfirm={handleEffectConfirm}
                    onCancel={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
};

export default GameBoard;
