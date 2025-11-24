import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);
    console.log('Creating single player game...');
    socket.emit('createSinglePlayerGame', { playerName: 'TestBot', botCount: 1, difficulty: 'normal' });
});

socket.on('roomCreated', ({ roomId }) => {
    console.log('Room created:', roomId);

    // Wait a bit then start
    setTimeout(() => {
        console.log(`Starting game for room ${roomId}...`);
        socket.emit('chatMessage', { roomId, message: 'TEST START SCRIPT', playerName: 'TestBot' });
        socket.emit('start', { roomId });
    }, 1000);
});

socket.on('gameState', (state) => {
    console.log('GameState received. Status:', state.status);
    if (state.status === 'PLAYING') {
        console.log('SUCCESS: Game started!');
        process.exit(0);
    }
});

socket.on('chatMessage', (msg) => {
    console.log('Chat:', msg.message);
});

socket.on('error', (err) => {
    console.error('Error:', err);
});

setTimeout(() => {
    console.log('Timeout waiting for game start.');
    process.exit(1);
}, 5000);
