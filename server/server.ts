import { Server } from 'socket.io';
import { createServer } from 'http';
import { Game99 } from './game';
import * as fs from 'fs';

const log = (msg: string) => {
    fs.appendFileSync('server.log', `${new Date().toISOString()} - ${msg}\n`);
    console.log(msg);
};

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        cors: {
            origin: process.env.CORS_ORIGIN || "*", // Allow all for dev, restrict in prod
            methods: ["GET", "POST"]
        }
    }
});

const games = new Map<string, Game99>();

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('createRoom', (data: { playerName: string }) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const game = new Game99();
        games.set(roomId, game);

        socket.join(roomId);
        game.addPlayer(socket.id, data.playerName);

        socket.emit('roomCreated', { roomId });
        io.to(roomId).emit('gameState', game.getState());
        socket.emit('hand', game.getPlayerHand(socket.id));
    });

    socket.on('createSinglePlayerGame', (data: { playerName: string, botCount: number, difficulty: 'easy' | 'normal' | 'hard' }) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const game = new Game99();
        games.set(roomId, game);

        socket.join(roomId);
        game.addPlayer(socket.id, data.playerName);

        // Add Bots
        log(`Creating Single Player Game: Player=${data.playerName}, Bots=${data.botCount}, Diff=${data.difficulty}`);
        for (let i = 0; i < data.botCount; i++) {
            const added = game.addBot(data.difficulty);
            log(`Added Bot ${i + 1}: ${added}`);
        }
        log(`Total Players: ${game.players.length}`);

        socket.emit('roomCreated', { roomId });
        io.to(roomId).emit('gameState', game.getState());
        socket.emit('hand', game.getPlayerHand(socket.id));

        // System Message: Game Created
        io.to(roomId).emit('chatMessage', {
            sender: 'System',
            message: `Single Player Game Created with ${data.botCount} ${data.difficulty} bots.`,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('joinRoom', (data: { roomId: string, playerName: string }) => {
        const { roomId, playerName } = data;
        const game = games.get(roomId);

        if (!game) {
            socket.emit('error', 'Room not found');
            return;
        }

        if (game.status !== 'WAITING') {
            socket.emit('error', 'Game already started');
            return;
        }

        if (game.players.length >= 4) {
            socket.emit('error', 'Room full');
            return;
        }

        socket.join(roomId);
        game.addPlayer(socket.id, playerName);

        socket.emit('roomJoined', { roomId });
        io.to(roomId).emit('gameState', game.getState());
        socket.emit('hand', game.getPlayerHand(socket.id));

        // System Message: Join
        io.to(roomId).emit('chatMessage', {
            sender: 'System',
            message: `${playerName} joined the room.`,
            timestamp: new Date().toISOString()
        });
    });

    // Helper to process bot turns
    const processBotTurn = (roomId: string, game: Game99) => {
        if (game.status !== 'PLAYING') return;

        const currentPlayer = game.players[game.turnIndex];
        if (currentPlayer && currentPlayer.isBot && currentPlayer.isAlive) {
            setTimeout(() => {
                // Check if game is still going and it's still bot's turn (race conditions)
                if (game.status !== 'PLAYING' || game.players[game.turnIndex].id !== currentPlayer.id) return;

                const move = game.getBotMove(currentPlayer.id);
                if (move) {
                    const result = game.playCard(currentPlayer.id, move.cardId, move.options);
                    if (result.success) {
                        io.to(roomId).emit('gameState', game.getState());
                        // No need to send hand updates for bots

                        if (result.message === 'Player eliminated') {
                            io.to(roomId).emit('log', `${currentPlayer.name} eliminated!`);
                            io.to(roomId).emit('chatMessage', {
                                sender: 'System',
                                message: `${currentPlayer.name} eliminated!`,
                                timestamp: new Date().toISOString()
                            });
                        }

                        if (game.winner) {
                            io.to(roomId).emit('chatMessage', {
                                sender: 'System',
                                message: `${game.winner.name} wins the game!`,
                                timestamp: new Date().toISOString()
                            });
                        } else {
                            // Process next turn (could be another bot)
                            processBotTurn(roomId, game);
                        }
                    }
                }
            }
            }, Math.random() * 2000 + 1000); // 1s - 3s random delay
        }
    };

socket.on('start', (data: { roomId: string }) => {
    log(`Start request for room ${data.roomId} from ${socket.id}`);
    const game = games.get(data.roomId);
    if (!game) {
        log('Game not found');
        return;
    }
    log(`Game players: ${game.players.length}, Host: ${game.players[0]?.id}`);

    if (game && game.players.length > 0 && game.players[0].id === socket.id) {
        log('Starting game...');
        game.startGame();
        io.to(data.roomId).emit('gameState', game.getState());
        game.players.forEach(p => {
            if (!p.isBot) {
                io.to(p.id).emit('hand', p.hand);
            }
        });

        // System Message: Start
        io.to(data.roomId).emit('chatMessage', {
            sender: 'System',
            message: 'Game started!',
            timestamp: new Date().toISOString()
        });

        // Check if first player is bot
        processBotTurn(data.roomId, game);
    }
});

socket.on('restartGame', (data: { roomId: string }) => {
    const game = games.get(data.roomId);
    if (game && game.players[0].id === socket.id) { // Only host can restart
        game.restartGame();
        io.to(data.roomId).emit('gameState', game.getState());
        game.players.forEach(p => {
            if (!p.isBot) {
                io.to(p.id).emit('hand', p.hand);
            }
        });

        io.to(data.roomId).emit('chatMessage', {
            sender: 'System',
            message: 'Game restarted!',
            timestamp: new Date().toISOString()
        });

        processBotTurn(data.roomId, game);
    }
});

socket.on('play', (data: { roomId: string, cardId: string, options?: any }) => {
    const game = games.get(data.roomId);
    if (!game) return;

    const result = game.playCard(socket.id, data.cardId, data.options);
    if (result.success) {
        io.to(data.roomId).emit('gameState', game.getState());
        socket.emit('hand', game.getPlayerHand(socket.id));

        if (result.message === 'Player eliminated') {
            const eliminatedPlayer = game.players.find(p => p.id === socket.id)?.name;
            io.to(data.roomId).emit('log', `${eliminatedPlayer} eliminated!`);

            // System Message: Elimination
            io.to(data.roomId).emit('chatMessage', {
                sender: 'System',
                message: `${eliminatedPlayer} eliminated!`,
                timestamp: new Date().toISOString()
            });
        }

        if (game.winner) {
            // System Message: Win
            io.to(data.roomId).emit('chatMessage', {
                sender: 'System',
                message: `${game.winner.name} wins the game!`,
                timestamp: new Date().toISOString()
            });
        } else {
            // Check if next player is bot
            processBotTurn(data.roomId, game);
        }
    } else {
        socket.emit('error', result.message);
    }
});

socket.on('chatMessage', (data: { roomId: string, message: string, playerName: string }) => {
    log(`Chat from ${data.playerName} in ${data.roomId}: ${data.message}`);
    io.to(data.roomId).emit('chatMessage', {
        sender: data.playerName,
        message: data.message,
        timestamp: new Date().toISOString()
    });
});

socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Find which room the player was in
    for (const [roomId, game] of games.entries()) {
        const player = game.players.find(p => p.id === socket.id);
        if (player) {
            game.removePlayer(socket.id);
            io.to(roomId).emit('gameState', game.getState());

            // System Message: Leave
            io.to(roomId).emit('chatMessage', {
                sender: 'System',
                message: `${player.name} left the room.`,
                timestamp: new Date().toISOString()
            });

            if (game.players.length === 0) {
                games.delete(roomId);
            }
            break;
        }
    }
});
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});
