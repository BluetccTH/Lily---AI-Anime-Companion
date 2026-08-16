// Web Audio API Synthesizer & Speech Controller for Perla

class SoundManager {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMouthSyncing = false;
  private mouthValueCallback: ((val: number) => void) | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Register listener for mouth animation (0.0 to 1.0)
  public setMouthCallback(cb: (val: number) => void) {
    this.mouthValueCallback = cb;
  }

  public clearMouthCallback() {
    this.mouthValueCallback = null;
  }

  // Play a soft angelic chime
  public playChime(enabled = true) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Celestial Chord)

      freqs.forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.06);

        gain.gain.setValueAtTime(0, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 1.3);
      });
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Play sparkling starlight sound
  public playStarSparkle(enabled = true) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [1318.5, 1567.98, 1760.0, 2093.0, 2637.0]; // E6, G6, A6, C7, E7

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.45);
      });
    } catch {}
  }

  // Halo resonant sound
  public playHaloSound(enabled = true) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.6);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.1);
    } catch {}
  }

  // Pop sound on click
  public playPop(enabled = true) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  // Send sound
  public playSendSound(enabled = true) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  public unlockAudio() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Speak text using Browser Web Speech API with simulated lip sync
  public speakWithWebSpeech(
    text: string,
    options: {
      pitch?: number;
      rate?: number;
      volume?: number;
      voiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ): boolean {
    if (!('speechSynthesis' in window)) {
      return false;
    }

    this.unlockAudio();
    try {
      window.speechSynthesis.cancel();
    } catch {}

    // Clean brackets, asterisks, English action tags and emojis from speech
    const cleanText = text
      .replace(/\*[^*]*\*/g, '') // remove *actions*
      .replace(/\([^)]*\)/g, '')  // remove (parentheses)
      .replace(/[\*\_~`]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'th-TH';
    // Cute, high-pitched sweet anime girl tone
    utterance.pitch = options.pitch ?? 1.55;
    utterance.rate = options.rate ?? 1.05;
    utterance.volume = options.volume ?? 1.0;

    // Pick best Thai female voice
    const voices = window.speechSynthesis.getVoices();
    if (options.voiceName) {
      const matched = voices.find((v) => v.name === options.voiceName);
      if (matched) utterance.voice = matched;
    } else {
      // Find a natural Thai voice
      const preferredThai = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith('th') ||
          v.lang.toLowerCase().includes('th-th') ||
          v.lang.toLowerCase().includes('th_th') ||
          v.name.toLowerCase().includes('thai') ||
          v.name.toLowerCase().includes('ไทย') ||
          v.name.toLowerCase().includes('kanya') ||
          v.name.toLowerCase().includes('narisa') ||
          v.name.toLowerCase().includes('premwadee') ||
          v.name.toLowerCase().includes('siri')
      );
      if (preferredThai) {
        utterance.voice = preferredThai;
      }
    }

    let lipSyncInterval: any = null;

    utterance.onstart = () => {
      options.onStart?.();
      this.isMouthSyncing = true;
      let step = 0;
      lipSyncInterval = setInterval(() => {
        if (!this.isMouthSyncing) return;
        step += 0.3;
        const open = Math.max(0, Math.sin(step) * 0.7 + Math.sin(step * 2.3) * 0.3);
        this.mouthValueCallback?.(open);
      }, 50);
    };

    utterance.onend = () => {
      this.isMouthSyncing = false;
      if (lipSyncInterval) clearInterval(lipSyncInterval);
      this.mouthValueCallback?.(0);
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error:", e);
      this.isMouthSyncing = false;
      if (lipSyncInterval) clearInterval(lipSyncInterval);
      this.mouthValueCallback?.(0);
      options.onEnd?.();
    };

    // Chrome workaround for paused speech engine
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }

  // Stop all speaking and reset mouth
  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {}
      this.currentSource = null;
    }
    this.isMouthSyncing = false;
    this.mouthValueCallback?.(0);
  }

  // Play audio payload (PCM 24k or MP3 base64) with live FFT Analyser lip syncing
  public async playAudioPayload(
    base64Data: string,
    format: 'pcm' | 'mp3' = 'mp3',
    sampleRate = 24000,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    try {
      this.unlockAudio();
      if (!this.ctx) return false;

      this.stopSpeaking();

      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      let audioBuffer: AudioBuffer;

      if (format === 'mp3') {
        // Standard compressed audio decoding via Web Audio
        audioBuffer = await this.ctx.decodeAudioData(bytes.buffer.slice(0));
      } else {
        // Raw 16-bit PCM (from Gemini)
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }
        audioBuffer = this.ctx.createBuffer(1, float32Array.length, sampleRate);
        audioBuffer.copyToChannel(float32Array, 0);
      }

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      // Cute anime girl pitch & speed lift (1.14x gives youthful anime heroine sparkle)
      source.playbackRate.value = 1.14;

      // Anime Vocal Audio Enhancement Filter Chain
      // 1. Highpass filter to eliminate low mud and keep voice light & youthful
      const highPass = this.ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 140;

      // 2. Peaking filter for voice clarity & anime charm resonance (3.2kHz boost)
      const vocalClarity = this.ctx.createBiquadFilter();
      vocalClarity.type = 'peaking';
      vocalClarity.frequency.value = 3200;
      vocalClarity.Q.value = 1.2;
      vocalClarity.gain.value = 3.5;

      // 3. High shelf filter for airy, sparkling breathiness (6.5kHz sparkle)
      const airSparkle = this.ctx.createBiquadFilter();
      airSparkle.type = 'highshelf';
      airSparkle.frequency.value = 6500;
      airSparkle.gain.value = 3.0;

      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 256;
      this.analyser = analyser;

      // Connect DSP chain: source -> highPass -> vocalClarity -> airSparkle -> analyser -> destination
      source.connect(highPass);
      highPass.connect(vocalClarity);
      vocalClarity.connect(airSparkle);
      airSparkle.connect(analyser);
      analyser.connect(this.ctx.destination);
      this.currentSource = source;

      onStart?.();
      this.isMouthSyncing = true;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.isMouthSyncing || !this.analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const mouthOpen = Math.min(1.0, (avg / 128.0) * 1.6);
        this.mouthValueCallback?.(mouthOpen);

        requestAnimationFrame(checkVolume);
      };

      requestAnimationFrame(checkVolume);

      source.onended = () => {
        this.isMouthSyncing = false;
        this.mouthValueCallback?.(0);
        this.currentSource = null;
        onEnd?.();
      };

      source.start(0);
      return true;
    } catch (e) {
      console.warn("Audio payload playback failed:", e);
      return false;
    }
  }

  // Play Gemini PCM audio with real-time FFT Analyser lip syncing (backward compat)
  public async playPcmAudio(
    base64Data: string,
    sampleRate = 24000,
    onStart?: () => void,
    onEnd?: () => void
  ) {
    return this.playAudioPayload(base64Data, 'pcm', sampleRate, onStart, onEnd);
  }

  // Celestial Ambient Music Synthesizer
  private bgmGain: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmTimer: any = null;

  public toggleBgm(volume = 0.15): boolean {
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm(volume);
      return true;
    }
  }

  public getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  public setBgmVolume(volume: number) {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setTargetAtTime(Math.max(0, Math.min(0.5, volume)), this.ctx.currentTime, 0.2);
    }
  }

  public startBgm(volume = 0.15) {
    try {
      this.initContext();
      if (!this.ctx) return;
      if (this.isBgmPlaying) return;

      this.isBgmPlaying = true;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 2.0);
      masterGain.connect(this.ctx.destination);
      this.bgmGain = masterGain;

      // Soft warm root chord drone (C major 9th / Lydian)
      const droneFreqs = [130.81, 196.00, 261.63, 329.63, 392.00]; // C3, G3, C4, E4, G4
      droneFreqs.forEach((f) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        g.gain.setValueAtTime(0.02, this.ctx.currentTime);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
      });

      // Procedural starry harp arpeggio generator
      const notes = [
        523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98
      ]; // Pentatonic starlight scales (C5, D5, E5, G5, A5, C6, D6, E6, G6)

      const playNextArp = () => {
        if (!this.isBgmPlaying || !this.ctx) return;
        const note = notes[Math.floor(Math.random() * notes.length)];
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = Math.random() > 0.4 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(note, now);

        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.04, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

        osc.connect(g);
        g.connect(masterGain);

        osc.start(now);
        osc.stop(now + 2.5);

        const nextDelay = 800 + Math.random() * 1200;
        this.bgmTimer = setTimeout(playNextArp, nextDelay);
      };

      playNextArp();
    } catch {}
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 1.0);
      setTimeout(() => {
        try {
          this.bgmGain?.disconnect();
        } catch {}
        this.bgmGain = null;
      }, 1100);
    }
  }
}

export const soundManager = new SoundManager();
