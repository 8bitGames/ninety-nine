export type CardType = 'start' | 'normal' | 'rainbow';

export interface Card {
    id: string;
    type: CardType;
    value: number | string;
    label: string;
    description: string;
}

export interface Player {
    id: string;
    name: string;
    hand: Card[];
    isAlive: boolean;
    isBot?: boolean;
    difficulty?: 'easy' | 'normal' | 'hard';
    avatar?: string; // URL to avatar image
    cardCount?: number; // For UI consistency
}

export type GameStatus = 'WAITING' | 'PLAYING' | 'ENDED';
export type BotState = 'idle' | 'thinking' | 'playing';

export class GameLogic {
    deck: Card[] = [];
    players: Player[] = [];
    currentTotal: number = 0;
    direction: 1 | -1 = 1;
    turnIndex: number = 0;
    status: GameStatus = 'WAITING';
    discardPile: Card[] = [];
    winner: Player | null = null;

    // Bot animation states
    botState: BotState = 'idle';
    lastPlayedBy: string | null = null;
    scoreChange: number = 0;

    // Callback for state updates
    private onStateChange: ((state: any) => void) | null = null;
    private onLog: ((msg: string) => void) | null = null;

    constructor(onStateChange?: (state: any) => void, onLog?: (msg: string) => void) {
        if (onStateChange) this.onStateChange = onStateChange;
        if (onLog) this.onLog = onLog;
        this.initializeDeck();
    }

    subscribe(callback: (state: any) => void) {
        this.onStateChange = callback;
    }

    setLogCallback(callback: (msg: string) => void) {
        this.onLog = callback;
    }

    private emitState() {
        if (this.onStateChange) {
            this.onStateChange(this.getState());
        }
    }

    private log(msg: string) {
        if (this.onLog) {
            this.onLog(msg);
        }
    }

    private initializeDeck() {
        this.deck = [];
        let idCounter = 1;

        const addCard = (type: CardType, value: number | string, label: string, desc: string, count: number) => {
            for (let i = 0; i < count; i++) {
                this.deck.push({
                    id: `card-${idCounter++}`,
                    type,
                    value,
                    label,
                    description: desc
                });
            }
        };

        addCard('normal', 1, 'A (+1)', '+1 더하기', 3);
        addCard('normal', 2, '2 (+2)', '+2 더하기', 3);
        addCard('normal', 3, '3 (+3)', '+3 더하기', 3);
        addCard('normal', 4, '4 (+4)', '+4 더하기', 3);
        addCard('normal', 5, '5 (+5)', '+5 더하기', 3);
        addCard('normal', 6, '6 (+6)', '+6 더하기', 3);
        addCard('normal', 7, '7 (+7)', '+7 더하기', 3);
        addCard('normal', 8, '8 (+8)', '+8 더하기', 3);
        addCard('normal', 10, '10 (+10)', '+10 더하기', 10);
        addCard('rainbow', '9', '9 (±9)', '+9 또는 -9', 5);
        addCard('rainbow', '10', '10 (±10)', '+10 또는 -10', 6);
        addCard('rainbow', '0', '0 (점프/반대)', '그대로 유지, 점프 또는 반대 방향', 3);
        addCard('rainbow', 'J', 'J (변신)', '숫자를 60~99로 바꾸기', 1);
    }

    private shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    addPlayer(id: string, name: string, isBot: boolean = false, difficulty?: 'easy' | 'normal' | 'hard', avatar?: string): boolean {
        if (this.status !== 'WAITING') return false;
        if (this.players.length >= 4) return false;
        this.players.push({ id, name, hand: [], isAlive: true, isBot, difficulty, avatar });
        this.emitState();
        return true;
    }

    startGame() {
        if (this.players.length < 2) return;
        this.status = 'PLAYING';
        this.initializeDeck();
        this.shuffleDeck();

        const count = this.players.length;
        if (count === 4) this.currentTotal = 0;
        else if (count === 3) this.currentTotal = 20;
        else if (count === 2) this.currentTotal = 40;

        this.players.forEach(p => {
            p.hand = this.deck.splice(0, 5);
            p.isAlive = true;
        });

        this.turnIndex = Math.floor(Math.random() * this.players.length);
        this.direction = 1;
        this.winner = null;

        this.emitState();
        this.log('게임이 시작되었습니다!');

        this.checkBotTurn();
    }

    restartGame() {
        this.status = 'WAITING'; // Briefly reset to waiting or just re-run start logic
        // Actually, just re-running start logic is enough but we need to keep players
        this.startGame();
        this.log('게임이 다시 시작되었습니다!');
    }

    playCard(playerId: string, cardId: string, options?: { value?: number, direction?: 'keep' | 'change' }): { success: boolean, message?: string } {
        if (this.status !== 'PLAYING') return { success: false, message: '게임이 진행 중이 아닙니다' };

        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return { success: false, message: '플레이어를 찾을 수 없습니다' };
        if (playerIndex !== this.turnIndex) return { success: false, message: '당신의 차례가 아닙니다' };

        const player = this.players[playerIndex];
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return { success: false, message: '손에 없는 카드입니다' };

        const card = player.hand[cardIndex];
        let newTotal = this.currentTotal;

        if (card.type === 'normal') {
            newTotal += (card.value as number);
        } else if (card.type === 'rainbow') {
            if (card.value === '9') {
                if (options?.value === 9 || options?.value === -9) {
                    newTotal += options.value;
                } else {
                    return { success: false, message: '+9 또는 -9를 선택해야 합니다' };
                }
            } else if (card.value === '10') {
                if (options?.value === 10 || options?.value === -10) {
                    newTotal += options.value;
                } else {
                    return { success: false, message: '+10 또는 -10을 선택해야 합니다' };
                }
            } else if (card.value === '0') {
                newTotal += 0;
                if (options?.direction === 'change') {
                    this.direction *= -1;
                }
            } else if (card.value === 'J') {
                if (options?.value && options.value >= 60 && options.value <= 99) {
                    newTotal = options.value;
                } else {
                    return { success: false, message: '60에서 99 사이의 숫자를 선택해야 합니다' };
                }
            }
        }

        if (newTotal > 99) {
            this.eliminatePlayer(playerIndex);
            return { success: true, message: '플레이어 탈락' };
        }

        // Track score change for animation
        this.scoreChange = newTotal - this.currentTotal;
        this.lastPlayedBy = playerId;

        this.currentTotal = Math.max(0, newTotal);
        player.hand.splice(cardIndex, 1);
        this.discardPile.push(card);

        if (this.deck.length > 0) {
            const newCard = this.deck.pop();
            if (newCard) player.hand.push(newCard);
        } else {
            if (this.discardPile.length > 0) {
                this.deck = this.discardPile;
                this.discardPile = [];
                this.shuffleDeck();
                const newCard = this.deck.pop();
                if (newCard) player.hand.push(newCard);
            }
        }

        this.nextTurn();
        this.emitState();

        return { success: true };
    }

    private nextTurn() {
        let nextIndex = this.turnIndex;
        let loopCount = 0;
        do {
            nextIndex = (nextIndex + this.direction + this.players.length) % this.players.length;
            loopCount++;
        } while (!this.players[nextIndex].isAlive && loopCount < this.players.length);

        this.turnIndex = nextIndex;
        this.checkBotTurn();
    }

    private eliminatePlayer(index: number) {
        const player = this.players[index];
        player.isAlive = false;
        this.discardPile.push(...player.hand);
        player.hand = [];
        this.log(`${player.name} 탈락!`);

        const survivors = this.players.filter(p => p.isAlive);
        if (survivors.length === 1) {
            this.winner = survivors[0];
            this.status = 'ENDED';
            this.log(`${this.winner.name} 승리!`);
            this.emitState();
        } else {
            this.nextTurn();
            this.emitState();
        }
    }

    private checkBotTurn() {
        if (this.status !== 'PLAYING') return;
        const currentPlayer = this.players[this.turnIndex];
        if (currentPlayer && currentPlayer.isBot && currentPlayer.isAlive) {
            // Phase 1: Start thinking
            this.botState = 'thinking';
            this.emitState();

            // Phase 2: Think for a while (1.5-3 seconds based on difficulty)
            const thinkTime = currentPlayer.difficulty === 'hard' ? 2500 + Math.random() * 1000
                            : currentPlayer.difficulty === 'normal' ? 1800 + Math.random() * 800
                            : 1200 + Math.random() * 600;

            setTimeout(() => {
                if (this.status !== 'PLAYING' || this.players[this.turnIndex].id !== currentPlayer.id) {
                    this.botState = 'idle';
                    return;
                }

                // Phase 3: Show "playing" state briefly
                this.botState = 'playing';
                this.emitState();

                // Phase 4: Actually play the card after a brief pause
                setTimeout(() => {
                    if (this.status !== 'PLAYING' || this.players[this.turnIndex].id !== currentPlayer.id) return;
                    this.playBotMove(currentPlayer);
                    this.botState = 'idle';
                }, 500);
            }, thinkTime);
        }
    }

    private playBotMove(bot: Player) {
        const move = this.getBotMove(bot);
        if (move) {
            this.playCard(bot.id, move.cardId, move.options);
        } else {
            // Should not happen if getBotMove is correct, but if no move possible (e.g. all cards > 99), 
            // getBotMove usually returns a move that kills them.
            // If logic fails, just pick first card to force elimination
            if (bot.hand.length > 0) {
                this.playCard(bot.id, bot.hand[0].id);
            }
        }
    }

    private getBotMove(bot: Player): { cardId: string, options?: any } | null {
        const hand = bot.hand;
        const current = this.currentTotal;

        // Build all possible moves with metadata
        interface Move {
            cardId: string;
            card: Card;
            options?: any;
            newTotal: number;
            isSaver: boolean;
        }

        const allMoves: Move[] = [];
        const saverValues = ['0', '9', '10', 'J']; // Rainbow cards that can save you

        for (const card of hand) {
            const isSaver = card.type === 'rainbow' && saverValues.includes(String(card.value));

            if (card.type === 'normal') {
                const val = card.value as number;
                allMoves.push({ cardId: card.id, card, newTotal: current + val, isSaver: false });
            } else if (card.type === 'rainbow') {
                if (card.value === '9') {
                    allMoves.push({ cardId: card.id, card, options: { value: 9 }, newTotal: current + 9, isSaver });
                    allMoves.push({ cardId: card.id, card, options: { value: -9 }, newTotal: current - 9, isSaver });
                } else if (card.value === '10') {
                    allMoves.push({ cardId: card.id, card, options: { value: 10 }, newTotal: current + 10, isSaver });
                    allMoves.push({ cardId: card.id, card, options: { value: -10 }, newTotal: current - 10, isSaver });
                } else if (card.value === '0') {
                    allMoves.push({ cardId: card.id, card, options: { direction: 'keep' }, newTotal: current, isSaver });
                    allMoves.push({ cardId: card.id, card, options: { direction: 'change' }, newTotal: current, isSaver });
                } else if (card.value === 'J') {
                    // J card options: strategic values
                    allMoves.push({ cardId: card.id, card, options: { value: 99 }, newTotal: 99, isSaver });
                    allMoves.push({ cardId: card.id, card, options: { value: 60 }, newTotal: 60, isSaver });
                    allMoves.push({ cardId: card.id, card, options: { value: 89 }, newTotal: 89, isSaver });
                }
            }
        }

        const safeMoves = allMoves.filter(m => m.newTotal >= 0 && m.newTotal <= 99);

        if (safeMoves.length === 0) {
            return allMoves[0] || null; // Forced to die
        }

        // === EASY: Random safe move ===
        if (bot.difficulty === 'easy') {
            return this.pickRandom(safeMoves);
        }

        // === NORMAL: Avoid 99, prefer middle range ===
        if (bot.difficulty === 'normal') {
            const not99 = safeMoves.filter(m => m.newTotal < 99);
            if (not99.length === 0) return this.pickRandom(safeMoves);

            // Prefer moves that keep total in 40-85 range
            const comfortable = not99.filter(m => m.newTotal >= 30 && m.newTotal <= 85);
            if (comfortable.length > 0) return this.pickRandom(comfortable);

            // Otherwise just avoid 99
            return this.pickRandom(not99);
        }

        // === HARD: Advanced strategic AI ===
        return this.getHardBotMove(bot, safeMoves, current);
    }

    private getHardBotMove(bot: Player, safeMoves: { cardId: string; card: Card; options?: any; newTotal: number; isSaver: boolean }[], current: number): { cardId: string; options?: any } {
        const not99 = safeMoves.filter(m => m.newTotal < 99);
        const nonSaverMoves = safeMoves.filter(m => !m.isSaver);
        const saverMoves = safeMoves.filter(m => m.isSaver);

        // Count alive players to determine aggression
        const alivePlayers = this.players.filter(p => p.isAlive).length;
        const isEndGame = alivePlayers <= 2;

        // Strategy 1: Low total (0-50) - Use high value normal cards to build up
        if (current < 50) {
            const highValueMoves = nonSaverMoves
                .filter(m => m.newTotal > current && m.newTotal <= 85)
                .sort((a, b) => b.newTotal - a.newTotal);
            if (highValueMoves.length > 0) {
                return this.pickRandom(highValueMoves.slice(0, 2)); // Pick from top 2
            }
        }

        // Strategy 2: Mid range (50-80) - Play conservatively, save special cards
        if (current >= 50 && current < 80) {
            const midRangeMoves = nonSaverMoves.filter(m => m.newTotal >= 50 && m.newTotal <= 89);
            if (midRangeMoves.length > 0) {
                return this.pickRandom(midRangeMoves);
            }
        }

        // Strategy 3: High range (80-89) - Start using savers if needed
        if (current >= 80 && current < 90) {
            // Try to use low value normal cards first
            const lowMoves = nonSaverMoves.filter(m => m.newTotal <= 95 && m.newTotal < 99);
            if (lowMoves.length > 0) {
                return this.pickRandom(lowMoves);
            }
            // Use minus options from savers
            const minusMoves = saverMoves.filter(m => m.newTotal < current);
            if (minusMoves.length > 0) {
                return this.pickRandom(minusMoves);
            }
        }

        // Strategy 4: Critical zone (90-99) - Use savers strategically
        if (current >= 90) {
            // Priority: -9, -10, 0, then J to set lower
            const escapeMoves = safeMoves.filter(m => m.newTotal < 90).sort((a, b) => a.newTotal - b.newTotal);
            if (escapeMoves.length > 0) {
                // In endgame, try to set to 99 to pressure opponent
                if (isEndGame && current < 99) {
                    const set99 = safeMoves.find(m => m.newTotal === 99 && m.card.value === 'J');
                    if (set99 && Math.random() > 0.3) return set99; // 70% chance to be aggressive
                }
                return escapeMoves[0]; // Safest escape
            }
            // Use 0 card to maintain
            const zeroMoves = safeMoves.filter(m => m.card.value === '0');
            if (zeroMoves.length > 0) {
                // Change direction if next player might have advantage
                return Math.random() > 0.5
                    ? zeroMoves.find(m => m.options?.direction === 'change') || zeroMoves[0]
                    : zeroMoves[0];
            }
        }

        // Strategy 5: Aggressive J card usage in endgame
        if (isEndGame && current < 85) {
            const jCard = safeMoves.find(m => m.card.value === 'J' && m.newTotal === 99);
            if (jCard && Math.random() > 0.6) { // 40% chance to be aggressive
                return jCard;
            }
        }

        // Fallback: Pick best available move avoiding 99
        if (not99.length > 0) {
            // Prefer moves in comfortable range (60-89)
            const comfortable = not99.filter(m => m.newTotal >= 60 && m.newTotal <= 89);
            if (comfortable.length > 0) return this.pickRandom(comfortable);
            return this.pickRandom(not99);
        }

        return this.pickRandom(safeMoves);
    }

    private pickRandom<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    getState() {
        return {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.hand.length,
                isAlive: p.isAlive,
                isBot: p.isBot,
                avatar: p.avatar,
            })),
            currentTotal: this.currentTotal,
            turnIndex: this.turnIndex,
            direction: this.direction,
            deckCount: this.deck.length,
            status: this.status,
            lastCard: this.discardPile.length > 0 ? this.discardPile[this.discardPile.length - 1] : null,
            winner: this.winner ? { name: this.winner.name } : null,
            // Animation states
            botState: this.botState,
            lastPlayedBy: this.lastPlayedBy,
            scoreChange: this.scoreChange,
        };
    }

    getPlayerHand(playerId: string) {
        const p = this.players.find(p => p.id === playerId);
        return p ? p.hand : [];
    }
}
