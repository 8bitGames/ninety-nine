'use client';

import { useState, useEffect, useRef } from 'react';
import GameBoard from './components/GameBoard';
import MobileLayout from './components/MobileLayout';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { User, Bot, Gamepad2 } from 'lucide-react';
import { GameLogic } from './lib/GameLogic';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  // Game State
  const gameRef = useRef<GameLogic | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [myHand, setMyHand] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const [botCount, setBotCount] = useState(1);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [mode, setMode] = useState<'lobby' | 'single'>('lobby');

  const startGame = () => {
    if (!playerName.trim()) return;

    const game = new GameLogic(
      (state) => {
        setGameState({ ...state }); // Force new object reference
        // Update hand
        const me = game.getPlayerHand('player-1');
        setMyHand([...me]);
      },
      (msg) => {
        setLogs(prev => [...prev, msg].slice(-3));
      }
    );

    game.addPlayer('player-1', playerName);

    for (let i = 0; i < botCount; i++) {
      game.addPlayer(`bot-${i}`, `Bot ${i + 1}`, true, difficulty);
    }

    game.startGame();
    gameRef.current = game;
    setGameStarted(true);
  };

  if (gameStarted && gameRef.current && gameState) {
    return (
      <MobileLayout>
        <GameBoard
          game={gameRef.current}
          gameState={gameState}
          myHand={myHand}
          logs={logs}
          playerName={playerName}
          playerId="player-1"
        />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col h-full p-6 space-y-8 justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            99 GAME
          </h1>
          <p className="text-slate-500 text-sm">Survival Card Game</p>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Welcome</CardTitle>
            <CardDescription className="text-center">Enter your name to start</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {mode === 'lobby' && (
          <div className="grid gap-4">
            <Button
              onClick={() => setMode('single')}
              disabled={!playerName}
              className="h-24 text-lg bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Gamepad2 className="h-8 w-8" />
                <span>Single Player</span>
              </div>
            </Button>
          </div>
        )}

        {mode === 'single' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-indigo-500" />
                  Game Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Opponents</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(count => (
                      <Button
                        key={count}
                        variant={botCount === count ? 'default' : 'outline'}
                        onClick={() => setBotCount(count)}
                        className="flex-1"
                      >
                        {count} Bot{count > 1 ? 's' : ''}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulty</label>
                  <div className="flex gap-2">
                    {['easy', 'normal', 'hard'].map(diff => (
                      <Button
                        key={diff}
                        variant={difficulty === diff ? 'default' : 'outline'}
                        onClick={() => setDifficulty(diff as any)}
                        className="flex-1 capitalize"
                      >
                        {diff}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button onClick={() => setMode('lobby')} variant="ghost" className="flex-1">Back</Button>
              <Button onClick={startGame} className="flex-[2] bg-indigo-600 hover:bg-indigo-700">Start Game</Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
