// Web Audio API Synthesizer & Speech Controller for Lily

class SoundManager {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMouthSyncing = false;
  private mouthValueCallback: ((val: number) => void) | null = null;
  private speechUnlocked = false;
  private speechVoices: SpeechSynthesisVoice[] = [];
  private speechQueueToken = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  private refreshSpeechVoices() {
    if (!('speechSynthesis' in window)) return [];
    try {
      this.speechVoices = window.speechSynthesis.getVoices();
    } catch {
      this.speechVoices = [];
    }
    return this.speechVoices;
  }

  private ensureSpeechVoiceEvents() {
    if (!('speechSynthesis' in window)) return;
    this.refreshSpeechVoices();

    if (!(window.speechSynthesis as any).__lilyVoiceListenerInstalled) {
      const speech = window.speechSynthesis;
      const handler = () => this.refreshSpeechVoices();
      speech.addEventListener?.('voiceschanged', handler);
      (speech as any).__lilyVoiceListenerInstalled = true;
    }
  }

  /**
   * iOS Safari requires speech to be primed from a real user gesture.
   * We call this from touch/click/keydown handlers before any async request.
   */
  public unlockSpeech() {
    if (!('speechSynthesis' in window)) return false;

    this.ensureSpeechVoiceEvents();

    try {
      const speech = window.speechSynthesis;
      speech.cancel();

      // Prime the speech engine with a tiny muted utterance.
      // Do not use an empty string because Safari may optimize it away.
      const primer = new SpeechSynthesisUtterance('\u200b');
      primer.lang = 'th-TH';
      primer.volume = 0;
      primer.rate = 10;
      primer.pitch = 1;
      primer.onend = () => {};
      primer.onerror = () => {};
      speech.speak(primer);
      this.speechUnlocked = true;
      setTimeout(() => {
        try {
          speech.cancel();
        } catch {}
      }, 80);
      return true;
    } catch (err) {
      console.warn('Speech unlock failed:', err);
      return false;
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
      const freqs = [523.25, 659.25, 783.99, 1046.5];

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
    } catch {}
  }

  // Play sparkling starlight sound
  public playStarSparkle(enabled = true) {
    if (!enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [1318.5, 1567.98, 1760.0, 2093.0, 2637.0];

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
    this.unlockSpeech();
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  private cleanSpeechText(text: string) {
    return text
      .replace(/\*[^*]*\*/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/[\*\_~`]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private splitSpeechText(text: string, maxLength = 180): string[] {
    if (text.length <= maxLength) return [text];

    const sentences = text.split(/(?<=[.!?。！？ๆ])\s*/u).filter(Boolean);
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + (current ? ' ' : '') + sentence).length <= maxLength) {
        current += (current ? ' ' : '') + sentence;
        continue;
      }

      if (current) chunks.push(current);

      if (sentence.length <= maxLength) {
        current = sentence;
      } else {
        for (let i = 0; i < sentence.length; i += maxLength) {
          chunks.push(sentence.slice(i, i + maxLength));
        }
        current = '';
      }
    }

    if (current) chunks.push(current);
    return chunks.length ? chunks : [text.slice(0, maxLength)];
  }

  private findThaiVoice(voiceName?: string): SpeechSynthesisVoice | undefined {
    const voices = this.refreshSpeechVoices();
    if (voiceName) {
      const exact = voices.find((v) => v.name === voiceName);
      if (exact) return exact;
    }

    return voices.find((v) => {
      const lang = (v.lang || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      return lang === 'th-th' || lang.startsWith('th') || name.includes('thai') || name.includes('ไทย') || name.includes('kanya') || name.includes('narisa') || name.includes('premwadee');
    });
  }

  // Speak text using Browser Web Speech API with simulated lip sync.
  // Designed to work reliably after a user gesture on iOS/iPadOS Safari.
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
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      return false;
    }

    const cleanText = this.cleanSpeechText(text);
    if (!cleanText) return false;

    this.ensureSpeechVoiceEvents();
    this.unlockAudio();

    try {
      window.speechSynthesis.cancel();
    } catch {}

    const token = ++this.speechQueueToken;
    const chunks = this.splitSpeechText(cleanText);
    let chunkIndex = 0;
    let started = false;
    let lipSyncInterval: ReturnType<typeof setInterval> | null = null;

    const stopLipSync = () => {
      this.isMouthSyncing = false;
      if (lipSyncInterval) {
        clearInterval(lipSyncInterval);
        lipSyncInterval = null;
      }
      this.mouthValueCallback?.(0);
    };

    const speakNext = () => {
      if (token !== this.speechQueueToken) return;
      if (chunkIndex >= chunks.length) {
        stopLipSync();
        options.onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utterance.lang = 'th-TH';
      utterance.pitch = options.pitch ?? 1.45;
      utterance.rate = options.rate ?? 0.98;
      utterance.volume = options.volume ?? 1.0;

      const voice = this.findThaiVoice(options.voiceName);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => {
        if (!started) {
          started = true;
          options.onStart?.();
        }
        this.isMouthSyncing = true;
        if (lipSyncInterval) clearInterval(lipSyncInterval);
        let step = 0;
        lipSyncInterval = setInterval(() => {
          if (!this.isMouthSyncing || token !== this.speechQueueToken) return;
          step += 0.32;
          const open = Math.max(0, Math.min(1, Math.sin(step) * 0.42 + Math.sin(step * 2.1) * 0.28 + 0.3));
          this.mouthValueCallback?.(open);
        }, 55);
      };

      utterance.onend = () => {
        if (token !== this.speechQueueToken) return;
        chunkIndex += 1;
        // Yield one frame between chunks. Safari is more stable than immediately queueing everything.
        window.setTimeout(speakNext, 30);
      };

      utterance.onerror = (event) => {
        console.warn('SpeechSynthesis error:', event.error || event);
        stopLipSync();
        if (token !== this.speechQueueToken) return;

        // Retry once with the default system voice if the selected Thai voice fails.
        if (utterance.voice) {
          const retry = new SpeechSynthesisUtterance(chunks[chunkIndex]);
          retry.lang = 'th-TH';
          retry.pitch = options.pitch ?? 1.45;
          retry.rate = options.rate ?? 0.98;
          retry.volume = options.volume ?? 1.0;
          retry.onstart = utterance.onstart;
          retry.onend = utterance.onend;
          retry.onerror = () => {
            stopLipSync();
            options.onEnd?.();
          };
          try {
            window.speechSynthesis.speak(retry);
            return;
          } catch {}
        }

        options.onEnd?.();
      };

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('speechSynthesis.speak failed:', err);
        stopLipSync();
        options.onEnd?.();
      }
    };

    // Safari may initially report no voices. Give voiceschanged a brief chance before speaking.
    const voices = this.refreshSpeechVoices();
    if (!voices.length) {
      window.setTimeout(() => {
        this.refreshSpeechVoices();
        speakNext();
      }, 120);
    } else {
      speakNext();
    }

    return true;
  }

  public stopSpeaking() {
    this.speechQueueToken += 1;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
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
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

      let audioBuffer: AudioBuffer;

      if (format === 'mp3') {
        audioBuffer = await this.ctx.decodeAudioData(bytes.buffer.slice(0));
      } else {
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
      source.playbackRate.value = 1.14;

      const highPass = this.ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 140;

      const vocalClarity = this.ctx.createBiquadFilter();
      vocalClarity.type = 'peaking';
      vocalClarity.frequency.value = 3200;
      vocalClarity.Q.value = 1.2;
      vocalClarity.gain.value = 3.5;

      const airSparkle = this.ctx.createBiquadFilter();
      airSparkle.type = 'highshelf';
      airSparkle.frequency.value = 6500;
      airSparkle.gain.value = 3.0;

      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 256;
      this.analyser = analyser;

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
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        this.mouthValueCallback?.(Math.min(1.0, (avg / 128.0) * 1.6));
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
      console.warn('Audio payload playback failed:', e);
      return false;
    }
  }

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
  private bgmTimer: ReturnType<typeof setTimeout> | null = null;

  public toggleBgm(volume = 0.15): boolean {
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    }
    this.startBgm(volume);
    return true;
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
      if (!this.ctx || this.isBgmPlaying) return;

      this.isBgmPlaying = true;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 2.0);
      masterGain.connect(this.ctx.destination);
      this.bgmGain = masterGain;

      const droneFreqs = [130.81, 196.0, 261.63, 329.63, 392.0];
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

      const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98];
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
        this.bgmTimer = setTimeout(playNextArp, 800 + Math.random() * 1200);
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
