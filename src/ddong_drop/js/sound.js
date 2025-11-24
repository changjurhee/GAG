export default class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(frequency, type, duration) {
        if (this.isMuted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playStart() {
        this.playTone(440, 'square', 0.1);
        setTimeout(() => this.playTone(554, 'square', 0.1), 100);
        setTimeout(() => this.playTone(659, 'square', 0.2), 200);
    }

    playGameOver() {
        this.playTone(300, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(250, 'sawtooth', 0.2), 200);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.4), 400);
    }

    playLevelUp() {
        this.playTone(523, 'sine', 0.1);
        setTimeout(() => this.playTone(659, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(784, 'sine', 0.2), 200);
    }

    playItemPickup() {
        this.playTone(880, 'sine', 0.1);
        setTimeout(() => this.playTone(1100, 'sine', 0.1), 100);
    }

    playHit() {
        this.playTone(100, 'sawtooth', 0.1);
    }

    playBGM(type = 'exciting') {
        if (this.isMuted || !this.ctx || this.bgmInterval) return;

        let melody = [];
        let tempo = 250; // ms per note

        if (type === 'exciting') {
            melody = [
                { freq: 261.63, dur: 0.2 }, // C4
                { freq: 329.63, dur: 0.2 }, // E4
                { freq: 392.00, dur: 0.2 }, // G4
                { freq: 523.25, dur: 0.4 }, // C5
                { freq: 392.00, dur: 0.2 }, // G4
                { freq: 329.63, dur: 0.2 }, // E4
            ];
            tempo = 200;
        } else if (type === 'sad') {
            melody = [
                { freq: 220.00, dur: 0.4 }, // A3
                { freq: 261.63, dur: 0.4 }, // C4
                { freq: 329.63, dur: 0.4 }, // E4
                { freq: 293.66, dur: 0.8 }, // D4
                { freq: 220.00, dur: 0.4 }, // A3
            ];
            tempo = 400;
        } else if (type === 'epic') {
            melody = [
                { freq: 196.00, dur: 0.2 }, // G3
                { freq: 196.00, dur: 0.2 }, // G3
                { freq: 196.00, dur: 0.2 }, // G3
                { freq: 261.63, dur: 0.6 }, // C4
                { freq: 392.00, dur: 0.6 }, // G4
                { freq: 349.23, dur: 0.2 }, // F4
                { freq: 329.63, dur: 0.2 }, // E4
                { freq: 293.66, dur: 0.2 }, // D4
                { freq: 523.25, dur: 0.6 }, // C5
            ];
            tempo = 300;
        }

        let noteIndex = 0;

        const playNextNote = () => {
            if (!this.isRunningBGM) return;

            const note = melody[noteIndex];
            // Use different waveforms for variety
            const waveform = type === 'sad' ? 'sine' : (type === 'epic' ? 'sawtooth' : 'triangle');
            this.playTone(note.freq, waveform, 0.1);

            noteIndex = (noteIndex + 1) % melody.length;

            this.bgmTimeout = setTimeout(playNextNote, tempo);
        };

        this.isRunningBGM = true;
        playNextNote();
    }

    stopBGM() {
        this.isRunningBGM = false;
        if (this.bgmTimeout) {
            clearTimeout(this.bgmTimeout);
            this.bgmTimeout = null;
        }
    }
}
