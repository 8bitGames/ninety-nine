export type CardType = 'start' | 'normal' | 'rainbow';

export interface Card {
  id: string;
  type: CardType;
  value: number | string; // 'K', 'Q', 'J' or number
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
}

export class Game99 {
  deck: Card[] = [];
  players: Player[] = [];
  currentTotal: number = 0;
  direction: 1 | -1 = 1; // 1: Clockwise, -1: Counter-Clockwise
  turnIndex: number = 0;
  status: 'WAITING' | 'PLAYING' | 'ENDED' = 'WAITING';
  discardPile: Card[] = [];
  winner: Player | null = null;

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck() {
    this.deck = [];
    let idCounter = 1;

    // Helper to add cards
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

    // Normal Cards
    addCard('normal', 1, 'A (+1)', '+1 to Total', 3);
    addCard('normal', 2, '2 (+2)', '+2 to Total', 3);
    addCard('normal', 3, '3 (+3)', '+3 to Total', 3);
    addCard('normal', 4, '4 (+4)', '+4 to Total', 3);
    addCard('normal', 5, '5 (+5)', '+5 to Total', 3);
    addCard('normal', 6, '6 (+6)', '+6 to Total', 3);
    addCard('normal', 7, '7 (+7)', '+7 to Total', 3);
    addCard('normal', 8, '8 (+8)', '+8 to Total', 3);
    // Total 8 * 3 = 24 cards.

    // Normal 10 (+10)
    addCard('normal', 10, '10 (+10)', '+10 to Total', 10); // 10 cards

    // Rainbow Cards
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

  addPlayer(id: string, name: string): boolean {
    if (this.status !== 'WAITING') return false;
    if (this.players.length >= 4) return false;
    this.players.push({ id, name, hand: [], isAlive: true, isBot: false });
    return true;
  }

  addBot(difficulty: 'easy' | 'normal' | 'hard'): boolean {
    if (this.status !== 'WAITING') return false;
    if (this.players.length >= 4) return false;
    const botId = `bot-${Date.now()}-${Math.random()}`;
    const botName = `Bot (${difficulty})`;
    this.players.push({ id: botId, name: botName, hand: [], isAlive: true, isBot: true, difficulty });
    return true;
  }

  removePlayer(id: string) {
    this.players = this.players.filter(p => p.id !== id);
    if (this.players.length < 2 && this.status === 'PLAYING') {
      this.endGame();
    }
  }

  startGame() {
    if (this.players.length < 2) return; // Need at least 2 players
    this.status = 'PLAYING';
    this.initializeDeck();
    this.shuffleDeck();

    // P-05 Initial Number
    const count = this.players.length;
    if (count === 4) this.currentTotal = 0;
    else if (count === 3) this.currentTotal = 20;
    else if (count === 2) this.currentTotal = 40;

    // P-03 Distribute Cards
    this.players.forEach(p => {
      p.hand = this.deck.splice(0, 5);
      p.isAlive = true;
    });

    // P-06 Random Start Player
    this.turnIndex = Math.floor(Math.random() * this.players.length);
    this.direction = 1;
    this.winner = null;
  }

  // Returns true if play was successful
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

    // Logic to calculate new total
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

    // Valid move
    this.currentTotal = newTotal;

    // Remove card from hand
    player.hand.splice(cardIndex, 1);
    this.discardPile.push(card);

    // T-03 Draw Card
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

    let loopCount = 0;
    do {
      nextIndex = (nextIndex + this.direction + this.players.length) % this.players.length;
      loopCount++;
    } while (!this.players[nextIndex].isAlive && loopCount < this.players.length);

    this.turnIndex = nextIndex;

    // Check if only 1 survivor
    const survivors = this.players.filter(p => p.isAlive);
    if (survivors.length === 1) {
      this.winner = survivors[0];
      this.status = 'ENDED';
    }
  }

  private eliminatePlayer(index: number) {
    const player = this.players[index];
    player.isAlive = false;
    // E-03 Discard hand
    this.discardPile.push(...player.hand);
    player.hand = [];

    // E-04 Total remains same. Next turn.
    this.nextTurn();
  }

  private endGame() {
    this.status = 'ENDED';
  }

  getState() {
    return {
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        cardCount: p.hand.length,
        isAlive: p.isAlive,
        isBot: p.isBot,
        // Don't send other players' hands
      })),
      currentTotal: this.currentTotal,
      turnIndex: this.turnIndex,
      direction: this.direction,
      deckCount: this.deck.length,
      status: this.status,
      winner: this.winner ? this.winner.name : null
    };
  }

  getPlayerHand(playerId: string) {
    const p = this.players.find(p => p.id === playerId);
    return p ? p.hand : [];
  }
}
