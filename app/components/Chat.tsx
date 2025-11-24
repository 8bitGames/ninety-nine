import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatProps {
    socket: Socket;
    roomId: string;
    playerName: string;
}

interface Message {
    sender: string;
    message: string;
    timestamp: string;
}

const Chat: React.FC<ChatProps> = ({ socket, roomId, playerName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        socket.on('chatMessage', (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off('chatMessage');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            socket.emit('chatMessage', { roomId, message: input, playerName });
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => {
                    const isSystem = msg.sender === 'System';
                    const isMe = msg.sender === playerName;

                    return (
                        <div key={i} className={cn(
                            "flex flex-col max-w-[85%]",
                            isSystem ? "mx-auto items-center w-full" : (isMe ? "ml-auto items-end" : "mr-auto items-start")
                        )}>
                            {!isSystem && !isMe && <span className="text-[10px] text-slate-400 mb-1 ml-1">{msg.sender}</span>}

                            <div className={cn(
                                "px-3 py-2 rounded-lg text-sm break-words",
                                isSystem ? "bg-slate-800/50 text-yellow-400 text-xs py-1 px-2 rounded-full border border-yellow-500/20" :
                                    (isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-slate-800 text-slate-200 rounded-bl-none")
                            )}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-indigo-500"
                />
                <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-700">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
};

export default Chat;
