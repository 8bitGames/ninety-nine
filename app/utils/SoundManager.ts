class SoundManager {
    private audioCtx: AudioContext | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    playCard() {
        this.playTone(600, 'sine', 0.1);
    }

    drawCard() {
        this.playTone(400, 'triangle', 0.1);
    }

    error() {
        this.playTone(150, 'sawtooth', 0.3);
    }

    win() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'square', 0.2), i * 200);
        });
    }

    eliminate() {
        this.playTone(100, 'sawtooth', 0.5);
    }
}

export const soundManager = new SoundManager();
