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
    cardCount?: number; // For UI consistency
}

export type GameStatus = 'WAITING' | 'PLAYING' | 'ENDED';

export class GameLogic {
    deck: Card[] = [];
    players: Player[] = [];
    currentTotal: number = 0;
    direction: 1 | -1 = 1;
    turnIndex: number = 0;
    status: GameStatus = 'WAITING';
    discardPile: Card[] = [];
    winner: Player | null = null;

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

        addCard('normal', 1, 'A (+1)', '+1 to Total', 3);
        addCard('normal', 2, '2 (+2)', '+2 to Total', 3);
        addCard('normal', 3, '3 (+3)', '+3 to Total', 3);
        addCard('normal', 4, '4 (+4)', '+4 to Total', 3);
        addCard('normal', 5, '5 (+5)', '+5 to Total', 3);
        addCard('normal', 6, '6 (+6)', '+6 to Total', 3);
        addCard('normal', 7, '7 (+7)', '+7 to Total', 3);
        addCard('normal', 8, '8 (+8)', '+8 to Total', 3);
        addCard('normal', 10, '10 (+10)', '+10 to Total', 10);
        addCard('rainbow', '9', '9 (±9)', '+9 or -9', 5);
        addCard('rainbow', '10', '10 (±10)', '+10 or -10', 6);
        addCard('rainbow', '0', '0 (Skip/Rev)', 'Keep Total, Skip or Reverse', 3);
        addCard('rainbow', 'J', 'J (Set 60-99)', 'Set Total to 60-99', 1);
    }

    private shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    addPlayer(id: string, name: string, isBot: boolean = false, difficulty?: 'easy' | 'normal' | 'hard'): boolean {
        if (this.status !== 'WAITING') return false;
        if (this.players.length >= 4) return false;
        this.players.push({ id, name, hand: [], isAlive: true, isBot, difficulty });
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
        this.log('Game started!');

        this.checkBotTurn();
    }

    restartGame() {
        this.status = 'WAITING'; // Briefly reset to waiting or just re-run start logic
        // Actually, just re-running start logic is enough but we need to keep players
        this.startGame();
        this.log('Game restarted!');
    }

    playCard(playerId: string, cardId: string, options?: { value?: number, direction?: 'keep' | 'change' }): { success: boolean, message?: string } {
        if (this.status !== 'PLAYING') return { success: false, message: 'Game not active' };

        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return { success: false, message: 'Player not found' };
        if (playerIndex !== this.turnIndex) return { success: false, message: 'Not your turn' };

        const player = this.players[playerIndex];
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return { success: false, message: 'Card not in hand' };

        const card = player.hand[cardIndex];
        let newTotal = this.currentTotal;

        if (card.type === 'normal') {
            newTotal += (card.value as number);
        } else if (card.type === 'rainbow') {
            if (card.value === '9') {
                if (options?.value === 9 || options?.value === -9) {
                    newTotal += options.value;
                } else {
                    return { success: false, message: 'Must select +9 or -9' };
                }
            } else if (card.value === '10') {
                if (options?.value === 10 || options?.value === -10) {
                    newTotal += options.value;
                } else {
                    return { success: false, message: 'Must select +10 or -10' };
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
                    return { success: false, message: 'Must select value between 60 and 99' };
                }
            }
        }

        if (newTotal > 99) {
            this.eliminatePlayer(playerIndex);
            return { success: true, message: 'Player eliminated' };
        }

        this.currentTotal = newTotal;
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
        this.log(`${player.name} eliminated!`);

        const survivors = this.players.filter(p => p.isAlive);
        if (survivors.length === 1) {
            this.winner = survivors[0];
            this.status = 'ENDED';
            this.log(`${this.winner.name} wins!`);
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
            setTimeout(() => {
                if (this.status !== 'PLAYING' || this.players[this.turnIndex].id !== currentPlayer.id) return;
                this.playBotMove(currentPlayer);
            }, Math.random() * 2000 + 1000);
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
        const validMoves: { cardId: string, options?: any, newTotal: number }[] = [];
        const hand = bot.hand;

        // Simulate all moves
        for (const card of hand) {
            if (card.type === 'normal') {
                const val = card.value as number;
                validMoves.push({ cardId: card.id, newTotal: this.currentTotal + val });
            } else if (card.type === 'rainbow') {
                if (card.value === '9') {
                    validMoves.push({ cardId: card.id, options: { value: 9 }, newTotal: this.currentTotal + 9 });
                    validMoves.push({ cardId: card.id, options: { value: -9 }, newTotal: this.currentTotal - 9 });
                } else if (card.value === '10') {
                    validMoves.push({ cardId: card.id, options: { value: 10 }, newTotal: this.currentTotal + 10 });
                    validMoves.push({ cardId: card.id, options: { value: -10 }, newTotal: this.currentTotal - 10 });
                } else if (card.value === '0') {
                    validMoves.push({ cardId: card.id, options: { direction: 'keep' }, newTotal: this.currentTotal });
                    validMoves.push({ cardId: card.id, options: { direction: 'change' }, newTotal: this.currentTotal });
                } else if (card.value === 'J') {
                    // Bot strategy for J: Set to 99 if safe, or 60
                    validMoves.push({ cardId: card.id, options: { value: 99 }, newTotal: 99 });
                    validMoves.push({ cardId: card.id, options: { value: 60 }, newTotal: 60 });
                }
            }
        }

        const safeMoves = validMoves.filter(m => m.newTotal <= 99);

        if (safeMoves.length === 0) {
            // No safe moves, just die
            return validMoves[0] || null;
        }

        // Difficulty Logic
        if (bot.difficulty === 'easy') {
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }

        if (bot.difficulty === 'normal') {
            // Avoid 99 if possible, otherwise random safe
            const not99 = safeMoves.filter(m => m.newTotal < 99);
            if (not99.length > 0) return not99[Math.floor(Math.random() * not99.length)];
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }

        if (bot.difficulty === 'hard') {
            // Save special cards (K, 10, 4, 0, 9) for later
            // K=10(normal), 4=0(normal), 0=0(rainbow), 9=9(rainbow), 10=10(rainbow)
            // Actually in this deck: 
            // Normal: 10 (+10)
            // Rainbow: 9, 10, 0, J
            // "Savers": 0, 10(rainbow), 9(rainbow), J

            const savers = ['0', '10', '9', 'J'];
            const nonSavers = safeMoves.filter(m => {
                const card = hand.find(c => c.id === m.cardId);
                return card && !savers.includes(String(card.value));
            });

            if (this.currentTotal < 85 && nonSavers.length > 0) {
                return nonSavers[Math.floor(Math.random() * nonSavers.length)];
            }

            // If high total or only savers left, use best saver
            // Prioritize keeping total low or skipping
            // Simple hard logic: just pick random safe move for now, but could be smarter
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }

        return safeMoves[0];
    }

    getState() {
        return {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                cardCount: p.hand.length,
                isAlive: p.isAlive,
                isBot: p.isBot,
                // For local game, we might want to see bot hands for debugging, but usually hide them
                // But since this is client-side, we technically have access. 
                // We'll filter in the UI or here. Let's send everything and filter in UI for "My Hand"
            })),
            currentTotal: this.currentTotal,
            turnIndex: this.turnIndex,
            direction: this.direction,
            deckCount: this.deck.length,
            status: this.status,
            winner: this.winner ? { name: this.winner.name } : null
        };
    }

    getPlayerHand(playerId: string) {
        const p = this.players.find(p => p.id === playerId);
        return p ? p.hand : [];
    }
}
