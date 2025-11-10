class CasinoSoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.8; // Increased from 0.5 to 0.8

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSounds();
    }
  }

  private initializeSounds() {
    const savedEnabled = localStorage.getItem('casinoSoundsEnabled');
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true';
    }

    const savedVolume = localStorage.getItem('casinoSoundsVolume');
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  playCoinDrop() {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400,
      audioContext.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(this.volume * 0.7, audioContext.currentTime); // Increased from 0.3
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }

  playSpinSound() {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(
      100,
      audioContext.currentTime + 0.5
    );

    gainNode.gain.setValueAtTime(this.volume * 0.5, audioContext.currentTime); // Increased from 0.2
    gainNode.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  playBigWin() {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    const frequencies = [523.25, 659.25, 783.99];

    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

      gainNode.gain.setValueAtTime(
        this.volume * 0.8,
        audioContext.currentTime + index * 0.1
      ); // Increased from 0.3
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 1.5 + index * 0.1
      );

      oscillator.start(audioContext.currentTime + index * 0.1);
      oscillator.stop(audioContext.currentTime + 1.5 + index * 0.1);
    });

    setTimeout(() => {
      const riseOsc = audioContext.createOscillator();
      const riseGain = audioContext.createGain();

      riseOsc.connect(riseGain);
      riseGain.connect(audioContext.destination);

      riseOsc.frequency.setValueAtTime(400, audioContext.currentTime);
      riseOsc.frequency.exponentialRampToValueAtTime(
        1200,
        audioContext.currentTime + 0.5
      );

      riseGain.gain.setValueAtTime(this.volume * 0.9, audioContext.currentTime); // Increased from 0.4
      riseGain.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      riseOsc.start(audioContext.currentTime);
      riseOsc.stop(audioContext.currentTime + 0.5);
    }, 500);
  }

  playLoss() {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      100,
      audioContext.currentTime + 0.5
    );

    gainNode.gain.setValueAtTime(this.volume * 0.6, audioContext.currentTime); // Increased from 0.2
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  playChipClick() {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);

    gainNode.gain.setValueAtTime(this.volume * 0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.05
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  }

  playCardShuffle() {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(
          200 + i * 50,
          audioContext.currentTime
        );
        oscillator.frequency.linearRampToValueAtTime(
          100 + i * 30,
          audioContext.currentTime + 0.1
        );

        gainNode.gain.setValueAtTime(
          this.volume * 0.15,
          audioContext.currentTime
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }, i * 50);
    }
  }

  playCardFlip() {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400,
      audioContext.currentTime + 0.08
    );

    gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.08
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  }

  playRouletteBall() {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(
          800 - i * 50,
          audioContext.currentTime
        );

        gainNode.gain.setValueAtTime(
          this.volume * 0.2,
          audioContext.currentTime
        );
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.05
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
      }, i * 100);
    }
  }

  playAmbientCasino(duration: number = 2000) {
    if (!this.enabled) return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);

    gainNode.gain.setValueAtTime(this.volume * 0.05, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration / 1000
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }

  toggleSound(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem('casinoSoundsEnabled', String(this.enabled));
    return this.enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('casinoSoundsVolume', String(this.volume));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }
}

export const casinoSounds = new CasinoSoundManager();
