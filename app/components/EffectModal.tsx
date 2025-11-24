import React, { useState } from 'react';
import { Card as CardType } from '../../server/game';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface EffectModalProps {
    card: CardType;
    onConfirm: (options: any) => void;
    onCancel: () => void;
}

const EffectModal: React.FC<EffectModalProps> = ({ card, onConfirm, onCancel }) => {
    const [jValue, setJValue] = useState<number>(99);

    const ModalWrapper = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-sm bg-slate-900 border-slate-800 text-slate-50 shadow-2xl animate-in zoom-in-95 duration-200">
                <CardHeader>
                    <CardTitle className="text-center text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {children}
                    <Button onClick={onCancel} variant="secondary" className="w-full">Cancel</Button>
                </CardContent>
            </Card>
        </div>
    );

    if (card.value === '9') {
        return (
            <ModalWrapper title="Select Effect for 9">
                <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => onConfirm({ value: 9 })} className="h-20 text-2xl bg-indigo-600 hover:bg-indigo-700">+9</Button>
                    <Button onClick={() => onConfirm({ value: -9 })} className="h-20 text-2xl bg-pink-600 hover:bg-pink-700">-9</Button>
                </div>
            </ModalWrapper>
        );
    }

    if (card.value === '10') {
        return (
            <ModalWrapper title="Select Effect for 10">
                <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => onConfirm({ value: 10 })} className="h-20 text-2xl bg-indigo-600 hover:bg-indigo-700">+10</Button>
                    <Button onClick={() => onConfirm({ value: -10 })} className="h-20 text-2xl bg-pink-600 hover:bg-pink-700">-10</Button>
                </div>
            </ModalWrapper>
        );
    }

    if (card.value === '0') {
        return (
            <ModalWrapper title="Select Effect for 0">
                <div className="grid gap-4">
                    <Button onClick={() => onConfirm({ direction: 'keep' })} className="h-16 text-lg bg-slate-700 hover:bg-slate-600">Keep Direction</Button>
                    <Button onClick={() => onConfirm({ direction: 'change' })} className="h-16 text-lg bg-indigo-600 hover:bg-indigo-700">Change Direction</Button>
                </div>
            </ModalWrapper>
        );
    }

    if (card.value === 'J') {
        return (
            <ModalWrapper title="Set Total (60-99)">
                <div className="space-y-4">
                    <Input
                        type="number"
                        min="60"
                        max="99"
                        value={jValue}
                        onChange={(e) => setJValue(Number(e.target.value))}
                        className="text-center text-4xl h-20 bg-slate-950 border-slate-800 text-white font-black"
                    />
                    <Button
                        onClick={() => {
                            if (jValue >= 60 && jValue <= 99) onConfirm({ value: jValue });
                        }}
                        className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                    >
                        Confirm
                    </Button>
                </div>
            </ModalWrapper>
        );
    }

    return null;
};

export default EffectModal;
