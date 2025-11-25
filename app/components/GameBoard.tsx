import React, { useEffect, useState, useRef } from 'react';
import Card from './Card';
import EffectModal from './EffectModal';
import { Card as CardType, GameLogic } from '../lib/GameLogic';
import { soundManager } from '../utils/SoundManager';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Info, RefreshCw, ArrowRight, ArrowLeft, X, Brain, Zap, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface GameBoardProps {
    game: GameLogic;
    gameState: any;
    myHand: CardType[];
    logs: string[];
    playerName: string;
    playerId: string;
    onExit?: () => void;
    onRestartWithNewAvatars?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ game, gameState, myHand, logs, playerName, playerId, onExit, onRestartWithNewAvatars }) => {
    const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const [showScoreChange, setShowScoreChange] = useState(false);
    const [displayedScore, setDisplayedScore] = useState(gameState.currentTotal);
    const [cardPlayAnimation, setCardPlayAnimation] = useState(false);
    const prevScoreRef = useRef(gameState.currentTotal);

    // Animate score changes
    useEffect(() => {
        if (gameState.currentTotal !== prevScoreRef.current) {
            setShowScoreChange(true);
            setCardPlayAnimation(true);

            // Animate score counting
            const diff = gameState.currentTotal - prevScoreRef.current;
            const steps = 10;
            const stepValue = diff / steps;
            let currentStep = 0;

            const interval = setInterval(() => {
                currentStep++;
                if (currentStep >= steps) {
                    setDisplayedScore(gameState.currentTotal);
                    clearInterval(interval);
                } else {
                    setDisplayedScore(Math.round(prevScoreRef.current + stepValue * currentStep));
                }
            }, 30);

            setTimeout(() => setShowScoreChange(false), 1500);
            setTimeout(() => setCardPlayAnimation(false), 600);

            prevScoreRef.current = gameState.currentTotal;

            return () => clearInterval(interval);
        }
    }, [gameState.currentTotal]);

    // Sound Effects based on state changes
    useEffect(() => {
        const lastLog = logs[logs.length - 1];
        if (lastLog && lastLog.includes('탈락')) {
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
    const currentTurnPlayer = gameState.turnIndex !== -1 ? gameState.players[gameState.turnIndex] : null;
    const isBotThinking = gameState.botState === 'thinking';
    const isBotPlaying = gameState.botState === 'playing';

    // Danger level based on current total
    const dangerLevel = gameState.currentTotal >= 90 ? 'critical'
                      : gameState.currentTotal >= 80 ? 'high'
                      : gameState.currentTotal >= 70 ? 'medium'
                      : 'safe';

    return (
        <div className={cn(
            "flex flex-col h-full text-slate-50 relative overflow-hidden transition-all duration-500",
            dangerLevel === 'critical' && "bg-gradient-to-b from-red-950/50 via-slate-950 to-black",
            dangerLevel === 'high' && "bg-gradient-to-b from-orange-950/30 via-slate-950 to-black",
            dangerLevel === 'medium' && "bg-gradient-to-b from-yellow-950/20 via-slate-950 to-black",
            dangerLevel === 'safe' && "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"
        )}>
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-5"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* Floating particles */}
                {dangerLevel === 'critical' && (
                    <>
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500/30 rounded-full animate-ping" />
                        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-red-400/20 rounded-full animate-pulse" />
                        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-orange-500/30 rounded-full animate-ping animation-delay-500" />
                    </>
                )}

                {/* Glow effect when card is played */}
                {cardPlayAnimation && (
                    <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent animate-pulse" />
                )}
            </div>

            {/* Top Bar: Opponents */}
            <div className="p-4 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-10 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <Badge variant="outline" className={cn(
                        "border-slate-700 transition-colors",
                        dangerLevel === 'critical' && "text-red-400 border-red-800",
                        dangerLevel === 'high' && "text-orange-400 border-orange-800",
                        dangerLevel !== 'critical' && dangerLevel !== 'high' && "text-slate-400"
                    )}>
                        {dangerLevel === 'critical' ? '⚠️ 위험!' : dangerLevel === 'high' ? '🔥 주의' : '싱글 플레이'}
                    </Badge>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={() => setShowInfo(true)}
                        >
                            <Info className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                            onClick={onExit}
                        >
                            <RefreshCw className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Opponents Scroll */}
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {gameState.players.filter((p: any) => p.id !== playerId).map((p: any) => {
                        const isTurn = gameState.turnIndex !== -1 && gameState.players[gameState.turnIndex]?.id === p.id;
                        const isThinking = isTurn && isBotThinking;
                        const isPlaying = isTurn && isBotPlaying;

                        return (
                            <div key={p.id} className="flex flex-col items-center gap-2">
                                <div className={cn(
                                    "relative w-24 h-32 rounded-xl overflow-hidden border-2 transition-all duration-500 shadow-lg bg-slate-900",
                                    isTurn && !isThinking && !isPlaying && "border-indigo-500 ring-2 ring-indigo-500/50 scale-105 z-10 shadow-indigo-500/30",
                                    isThinking && "border-yellow-500 ring-4 ring-yellow-500/50 scale-110 z-10 shadow-yellow-500/40 animate-pulse",
                                    isPlaying && "border-green-500 ring-4 ring-green-500/50 scale-115 z-10 shadow-green-500/50",
                                    !isTurn && "border-slate-800",
                                    !p.isAlive && "grayscale opacity-50"
                                )}>
                                    {/* Avatar Image */}
                                    {p.avatar ? (
                                        <img
                                            src={p.avatar}
                                            alt={p.name}
                                            className={cn(
                                                "absolute inset-0 w-full h-full object-cover transition-all duration-300",
                                                isThinking && "brightness-110",
                                                isPlaying && "brightness-125"
                                            )}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                                            <span className="text-2xl text-slate-600">?</span>
                                        </div>
                                    )}

                                    {/* Thinking Overlay */}
                                    {isThinking && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-900/80 via-yellow-900/40 to-transparent flex flex-col items-center justify-end pb-3">
                                            <Brain className="w-6 h-6 text-yellow-400 animate-bounce mb-1" />
                                            <span className="text-xs text-yellow-300 font-bold animate-pulse">생각 중...</span>
                                        </div>
                                    )}

                                    {/* Playing Overlay */}
                                    {isPlaying && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 via-green-900/40 to-transparent flex flex-col items-center justify-end pb-3">
                                            <Zap className="w-6 h-6 text-green-400 animate-pulse" />
                                            <span className="text-xs text-green-300 font-bold">카드 선택!</span>
                                        </div>
                                    )}

                                    {/* Turn Indicator (when not thinking/playing) */}
                                    {isTurn && !isThinking && !isPlaying && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,1)] border border-white/20" />
                                    )}

                                    {/* Eliminated Overlay */}
                                    {!p.isAlive && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
                                            <span className="text-sm text-red-500 font-black rotate-[-15deg] border-2 border-red-500 px-3 py-1 rounded shadow-lg bg-black/70 animate-pulse">탈락</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info below card */}
                                <div className="flex flex-col items-center">
                                    <div className={cn(
                                        "text-xs font-bold truncate w-24 text-center transition-colors",
                                        isThinking && "text-yellow-400",
                                        isPlaying && "text-green-400",
                                        !isThinking && !isPlaying && "text-slate-200"
                                    )}>{p.name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{p.cardCount}장</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Center: Game Stats */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Direction Indicator */}
                <div className={cn(
                    "absolute top-4 right-4 flex flex-col items-center gap-1 transition-all duration-300 px-2 py-1 rounded-lg",
                    gameState.direction === 1 ? "animate-pulse" : "animate-bounce",
                    dangerLevel === 'critical' && "text-red-300 bg-red-950/50",
                    dangerLevel === 'high' && "text-orange-300 bg-orange-950/50",
                    dangerLevel === 'medium' && "text-yellow-300 bg-yellow-950/50",
                    dangerLevel === 'safe' && "text-slate-700 bg-white/60 shadow-sm"
                )}>
                    {gameState.direction === 1 ? <ArrowRight className="h-8 w-8" /> : <ArrowLeft className="h-8 w-8" />}
                    <span className="text-[10px] uppercase tracking-widest font-medium">진행 방향</span>
                </div>

                {/* Current Turn Display */}
                {currentTurnPlayer && gameState.status === 'PLAYING' && (
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-300 shadow-lg",
                            currentTurnPlayer.id === playerId
                                ? dangerLevel === 'safe'
                                    ? "bg-indigo-500 text-white border border-indigo-400"
                                    : "bg-indigo-500/30 text-indigo-200 border border-indigo-400/60 backdrop-blur-sm"
                                : isBotThinking
                                    ? dangerLevel === 'safe'
                                        ? "bg-yellow-500 text-white border border-yellow-400 animate-pulse"
                                        : "bg-yellow-500/30 text-yellow-200 border border-yellow-400/60 animate-pulse backdrop-blur-sm"
                                    : dangerLevel === 'safe'
                                        ? "bg-slate-600 text-white border border-slate-500"
                                        : "bg-slate-700/60 text-slate-200 border border-slate-500/50 backdrop-blur-sm"
                        )}>
                            {currentTurnPlayer.id === playerId ? (
                                <>
                                    <Sparkles className="w-3 h-3" />
                                    내 차례
                                </>
                            ) : isBotThinking ? (
                                <>
                                    <Brain className="w-3 h-3 animate-spin" />
                                    {currentTurnPlayer.name} 생각 중
                                </>
                            ) : (
                                <>
                                    {currentTurnPlayer.name}의 차례
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Last Played Card Display */}
                <div className={cn(
                    "relative z-0 flex flex-col items-center transition-all duration-500",
                    cardPlayAnimation && "scale-105"
                )}>
                    {gameState.lastCard ? (
                        <div className={cn(
                            "relative transition-all duration-500",
                            cardPlayAnimation && "animate-bounce"
                        )}>
                            {/* Card glow effect */}
                            <div className={cn(
                                "absolute -inset-4 rounded-3xl opacity-0 transition-opacity duration-500 blur-xl",
                                cardPlayAnimation && "opacity-100",
                                dangerLevel === 'critical' && "bg-red-500/30",
                                dangerLevel === 'high' && "bg-orange-500/30",
                                dangerLevel === 'medium' && "bg-yellow-500/20",
                                dangerLevel === 'safe' && "bg-indigo-500/20"
                            )} />

                            <Card
                                card={gameState.lastCard}
                                readOnly={true}
                                size="large"
                                className={cn(
                                    "w-40 h-60 sm:w-48 sm:h-72 shadow-2xl transition-all duration-300",
                                    dangerLevel === 'critical' && "ring-4 ring-red-500/50",
                                    dangerLevel === 'high' && "ring-4 ring-orange-500/40",
                                    dangerLevel !== 'critical' && dangerLevel !== 'high' && "ring-4 ring-white/10"
                                )}
                            />

                            {/* Score Display */}
                            <div className="absolute -bottom-24 left-0 right-0 text-center">
                                <div className={cn(
                                    "text-7xl sm:text-8xl font-black drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300",
                                    dangerLevel === 'critical' && "text-red-400 animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]",
                                    dangerLevel === 'high' && "text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.3)]",
                                    dangerLevel === 'medium' && "text-yellow-400",
                                    dangerLevel === 'safe' && "text-white"
                                )}>
                                    {displayedScore}
                                </div>

                                {/* Score change indicator */}
                                {showScoreChange && gameState.scoreChange !== 0 && (
                                    <div className={cn(
                                        "absolute -top-4 left-1/2 transform -translate-x-1/2 text-3xl sm:text-4xl font-black animate-bounce",
                                        gameState.scoreChange > 0 ? "text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                    )}>
                                        {gameState.scoreChange > 0 ? `+${gameState.scoreChange}` : gameState.scoreChange}
                                    </div>
                                )}

                                <div className="text-sm text-slate-400 font-medium uppercase tracking-widest mt-2">현재 점수</div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-40 h-60 sm:w-48 sm:h-72 border-4 border-dashed border-slate-400 rounded-xl flex items-center justify-center bg-white/30 backdrop-blur-sm">
                                <span className="text-slate-500 font-bold text-lg">게임 시작</span>
                            </div>
                            <div className="mt-8 text-center">
                                <div className="text-7xl sm:text-8xl font-black text-slate-700 drop-shadow-[0_2px_4px_rgba(255,255,255,0.5)]">{displayedScore}</div>
                                <div className="text-sm text-slate-600 font-medium uppercase tracking-widest mt-2">시작 점수</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Game Status */}
                {gameState.status === 'ENDED' && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500">
                        {gameState.winner?.name === playerName ? (
                            <div className="text-center">
                                <div className="text-8xl mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">🏆</div>
                                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 mb-4 animate-pulse">
                                    승리!
                                </div>
                                <div className="text-2xl text-yellow-100 mb-10 animate-in slide-in-from-bottom duration-700">최후의 생존자입니다!</div>

                                {/* Confetti-like sparkles */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {[...Array(20)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                top: `${Math.random() * 100}%`,
                                                animationDelay: `${Math.random() * 2}s`,
                                                animationDuration: `${1 + Math.random()}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center animate-in zoom-in duration-500">
                                <div className="text-8xl mb-6 animate-pulse opacity-50">💀</div>
                                <div className="text-6xl font-black text-slate-500 mb-4">
                                    패배
                                </div>
                                <div className="text-2xl text-slate-400 mb-10">승자: {gameState.winner?.name}</div>
                            </div>
                        )}

                        <Button
                            onClick={onRestartWithNewAvatars}
                            size="lg"
                            className={cn(
                                "font-bold text-xl px-10 py-7 shadow-2xl transition-all hover:scale-110 active:scale-95",
                                gameState.winner?.name === playerName
                                    ? "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white shadow-yellow-500/30"
                                    : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                            )}
                        >
                            🎮 다시 하기
                        </Button>
                    </div>
                )}

                {/* Logs Overlay */}
                <div className="absolute bottom-4 left-0 right-0 px-4 flex flex-col items-center pointer-events-none">
                    {logs.slice(-3).map((log, i) => (
                        <div
                            key={i}
                            className={cn(
                                "text-xs px-3 py-1.5 rounded-full mb-1 transition-all",
                                log.includes('탈락') ? "bg-red-900/80 text-red-300 animate-pulse" : "bg-black/60 text-slate-400"
                            )}
                        >
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom: Player Hand */}
            <div className={cn(
                "p-4 backdrop-blur-xl border-t transition-all duration-500",
                isMyTurn
                    ? "pb-8 bg-indigo-600/90 border-indigo-400 shadow-[0_-8px_30px_rgba(99,102,241,0.4)]"
                    : "pb-6 bg-slate-700/90 border-slate-500"
            )}>
                <div className="flex justify-between items-center mb-3 px-2">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "text-sm font-bold transition-colors",
                            isMyTurn ? "text-white" : "text-white"
                        )}>{playerName}</div>
                        <span className="text-xs text-white/70">(나)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isMyTurn && (
                            <Badge className="bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/30">
                                <Sparkles className="w-3 h-3 mr-1" />
                                내 차례
                            </Badge>
                        )}
                        {!myPlayer?.isAlive && <Badge variant="destructive" className="animate-pulse">탈락함</Badge>}
                    </div>
                </div>

                <div className="flex justify-center items-end w-full px-2 pb-4 overflow-visible">
                    <div className="flex justify-center items-end -space-x-2 sm:space-x-1">
                        {myHand.map((card, i) => {
                            let isDangerous = false;
                            if (gameState.status === 'PLAYING' && isMyTurn) {
                                let potentialValue = 0;
                                if (card.type === 'normal') potentialValue = Number(card.value);
                                if (card.type === 'rainbow' && card.value !== '9' && card.value !== '10' && card.value !== '0' && card.value !== 'J') {
                                    if (gameState.currentTotal + potentialValue > 99) isDangerous = true;
                                } else if (card.type === 'normal') {
                                    if (gameState.currentTotal + potentialValue > 99) isDangerous = true;
                                }
                            }

                            return (
                                <div
                                    key={card.id}
                                    style={{ transform: `rotate(${(i - (myHand.length - 1) / 2) * 5}deg)` }}
                                    className={cn(
                                        "transition-all duration-300 origin-bottom z-10 hover:z-20",
                                        isMyTurn && "hover:-translate-y-4 hover:scale-110"
                                    )}
                                >
                                    <Card
                                        card={card}
                                        onClick={() => handleCardClick(card)}
                                        disabled={!isMyTurn || !myPlayer?.isAlive}
                                        isDangerous={isDangerous}
                                        className={cn(
                                            "w-20 h-32 sm:w-24 sm:h-36 md:w-28 md:h-40 shadow-xl transition-shadow",
                                            isMyTurn && "hover:shadow-2xl hover:shadow-indigo-500/20"
                                        )}
                                    />
                                </div>
                            );
                        })}
                    </div>
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

            {/* Info Modal */}
            {showInfo && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-slate-900 border border-slate-800 text-slate-100 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Info className="w-5 h-5 text-indigo-400" />
                                    게임 규칙
                                </h2>
                                <p className="text-sm text-slate-400">99를 넘기지 않고 살아남으세요!</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white"
                                onClick={() => setShowInfo(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-4 space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="font-bold text-red-400">A</span>: +1
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="font-bold text-blue-400">2~8</span>: 숫자만큼 더하기
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="font-bold text-amber-400">10</span>: +10
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="font-bold text-indigo-400">9 🌈</span>: +9 또는 -9
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="font-bold text-amber-400">10 🌈</span>: +10 또는 -10
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                    <span className="font-bold text-pink-400">0 🌈</span>: 유지 또는 방향전환
                                </div>
                                <div className="p-2 bg-slate-800/50 rounded-lg border border-slate-700 col-span-2">
                                    <span className="font-bold text-violet-400">J 🌈</span>: 점수를 60~99 사이로 변경
                                </div>
                            </div>
                            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-400">
                                    ⚠️ 99를 초과하면 탈락합니다.
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    🌈 무지개 카드는 선택형입니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameBoard;
