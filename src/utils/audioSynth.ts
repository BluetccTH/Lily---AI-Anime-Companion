class SoundManager {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isMouthSyncing = false;
  private mouthValueCallback: ((val: number) => void) | null = null;
  private speechUnlocked = false;
  private speechVoices: SpeechSynthesisVoice[] = [];
  private speechQueueToken = 0;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying = false;
  private bgmTimer: ReturnType<typeof setTimeout> | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx?.state === 'suspended') void this.ctx.resume().catch(() => {});
  }

  private refreshSpeechVoices() {
    if (!('speechSynthesis' in window)) return [];
    try { this.speechVoices = window.speechSynthesis.getVoices(); } catch { this.speechVoices = []; }
    return this.speechVoices;
  }

  private installVoiceListener() {
    if (!('speechSynthesis' in window)) return;
    this.refreshSpeechVoices();
    const speech = window.speechSynthesis as any;
    if (!speech.__lilyVoiceListenerInstalled) {
      window.speechSynthesis.addEventListener?.('voiceschanged', () => this.refreshSpeechVoices());
      speech.__lilyVoiceListenerInstalled = true;
    }
  }

  public unlockSpeech() {
    if (this.speechUnlocked || !('speechSynthesis' in window)) return this.speechUnlocked;
    this.installVoiceListener();
    try {
      const speech = window.speechSynthesis;
      speech.cancel();
      const primer = new SpeechSynthesisUtterance('\u200b');
      primer.lang = 'th-TH';
      primer.volume = 0;
      primer.rate = 10;
      primer.pitch = 1;
      speech.speak(primer);
      this.speechUnlocked = true;
      window.setTimeout(() => { try { speech.cancel(); } catch {} }, 60);
      return true;
    } catch (e) {
      console.warn('Speech unlock failed:', e);
      return false;
    }
  }

  public setMouthCallback(cb: (val: number) => void) { this.mouthValueCallback = cb; }
  public clearMouthCallback() { this.mouthValueCallback = null; }

  private synth(freq: number, duration: number, type: OscillatorType = 'sine', gainValue = 0.06) {
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {}
  }

  public playChime(enabled = true) {
    if (!enabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      window.setTimeout(() => this.synth(f, 1.2, 'sine', 0.08), i * 60);
    });
  }

  public playStarSparkle(enabled = true) {
    if (!enabled) return;
    [1318.5, 1567.98, 1760, 2093, 2637].forEach((f, i) => {
      window.setTimeout(() => this.synth(f, 0.4, 'triangle', 0.05), i * 40);
    });
  }

  public playHaloSound(enabled = true) {
    if (!enabled) return;
    this.synth(880, 1.0, 'sine', 0.08);
  }

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
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.07);
    } catch {}
  }

  public playSendSound(enabled = true) { if (enabled) this.synth(440, 0.15, 'sine', 0.06); }

  // IMPORTANT: this is called from click/touch handlers. Do not re-run the iOS primer later after fetch().
  public unlockAudio() {
    this.initContext();
    if (!this.speechUnlocked) this.unlockSpeech();
    if (this.ctx?.state === 'suspended') void this.ctx.resume().catch(() => {});
  }

  private cleanSpeechText(text: string) {
    return text
      .replace(/\*[^*]*\*/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/[\*_~`]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private splitSpeechText(text: string, maxLength = 160) {
    if (text.length <= maxLength) return [text];
    const parts = text.split(/(?<=[.!?。！？ๆ])\s*/u).filter(Boolean);
    const chunks: string[] = [];
    let current = '';
    for (const part of parts) {
      if ((current + (current ? ' ' : '') + part).length <= maxLength) {
        current += (current ? ' ' : '') + part;
      } else {
        if (current) chunks.push(current);
        if (part.length <= maxLength) current = part;
        else {
          for (let i = 0; i < part.length; i += maxLength) chunks.push(part.slice(i, i + maxLength));
          current = '';
        }
      }
    }
    if (current) chunks.push(current);
    return chunks.length ? chunks : [text.slice(0, maxLength)];
  }

  private findThaiVoice(name?: string) {
    const voices = this.refreshSpeechVoices();
    if (name) {
      const exact = voices.find(v => v.name === name);
      if (exact) return exact;
    }
    return voices.find(v => {
      const lang = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      return lang.startsWith('th') || n.includes('thai') || n.includes('ไทย') || n.includes('kanya') || n.includes('narisa') || n.includes('premwadee');
    });
  }

  public speakWithWebSpeech(text: string, options: {
    pitch?: number; rate?: number; volume?: number; voiceName?: string; onStart?: () => void; onEnd?: () => void;
  } = {}): boolean {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return false;
    const cleanText = this.cleanSpeechText(text);
    if (!cleanText) return false;
    this.installVoiceListener();

    try { window.speechSynthesis.cancel(); } catch {}
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();

    const token = ++this.speechQueueToken;
    const chunks = this.splitSpeechText(cleanText);
    let index = 0;
    let started = false;
    let lipTimer: ReturnType<typeof setInterval> | null = null;

    const stopLip = () => {
      this.isMouthSyncing = false;
      if (lipTimer) clearInterval(lipTimer);
      lipTimer = null;
      this.mouthValueCallback?.(0);
    };

    const next = () => {
      if (token !== this.speechQueueToken) return;
      if (index >= chunks.length) { stopLip(); options.onEnd?.(); return; }
      const u = new SpeechSynthesisUtterance(chunks[index]);
      u.lang = 'th-TH';
      u.pitch = options.pitch ?? 1.45;
      u.rate = options.rate ?? 0.98;
      u.volume = options.volume ?? 1;
      const voice = this.findThaiVoice(options.voiceName);
      if (voice) u.voice = voice;

      u.onstart = () => {
        if (!started) { started = true; options.onStart?.(); }
        this.isMouthSyncing = true;
        if (lipTimer) clearInterval(lipTimer);
        let step = 0;
        lipTimer = setInterval(() => {
          if (!this.isMouthSyncing || token !== this.speechQueueToken) return;
          step += 0.32;
          this.mouthValueCallback?.(Math.max(0, Math.min(1, 0.3 + Math.sin(step) * 0.42 + Math.sin(step * 2.1) * 0.28)));
        }, 55);
      };
      u.onend = () => { if (token === this.speechQueueToken) { index++; window.setTimeout(next, 30); } };
      u.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e.error || e);
        stopLip();
        if (token === this.speechQueueToken) options.onEnd?.();
      };
      try { window.speechSynthesis.speak(u); } catch { stopLip(); options.onEnd?.(); }
    };

    if (!this.refreshSpeechVoices().length) window.setTimeout(next, 120); else next();
    return true;
  }

  public stopSpeaking() {
    this.speechQueueToken++;
    try { if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); window.speechSynthesis.resume(); } } catch {}
    if (this.currentSource) { try { this.currentSource.stop(); } catch {} this.currentSource = null; }
    this.isMouthSyncing = false;
    this.mouthValueCallback?.(0);
  }

  public async playAudioPayload(base64Data: string, format: 'pcm' | 'mp3' = 'mp3', sampleRate = 24000, onStart?: () => void, onEnd?: () => void): Promise<boolean> {
    try {
      this.initContext();
      if (!this.ctx) return false;
      this.stopSpeaking();
      const binary = atob(base64Data);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      let audioBuffer: AudioBuffer;
      if (format === 'mp3') audioBuffer = await this.ctx.decodeAudioData(bytes.buffer.slice(0));
      else {
        const pcm = new Int16Array(bytes.buffer);
        const f32 = new Float32Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 32768;
        audioBuffer = this.ctx.createBuffer(1, f32.length, sampleRate);
        audioBuffer.copyToChannel(f32, 0);
      }
      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer; source.playbackRate.value = 1.14;
      const high = this.ctx.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 140;
      const clarity = this.ctx.createBiquadFilter(); clarity.type = 'peaking'; clarity.frequency.value = 3200; clarity.Q.value = 1.2; clarity.gain.value = 3.5;
      const air = this.ctx.createBiquadFilter(); air.type = 'highshelf'; air.frequency.value = 6500; air.gain.value = 3;
      const analyser = this.ctx.createAnalyser(); analyser.fftSize = 256; this.analyser = analyser;
      source.connect(high); high.connect(clarity); clarity.connect(air); air.connect(analyser); analyser.connect(this.ctx.destination);
      this.currentSource = source; this.isMouthSyncing = true; onStart?.();
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => { if (!this.isMouthSyncing || this.analyser !== analyser) return; analyser.getByteFrequencyData(data); const avg = data.reduce((a,b)=>a+b,0)/data.length; this.mouthValueCallback?.(Math.min(1, avg/128*1.6)); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      source.onended = () => { this.isMouthSyncing = false; this.mouthValueCallback?.(0); this.currentSource = null; onEnd?.(); };
      source.start(0); return true;
    } catch (e) { console.warn('Audio payload playback failed:', e); return false; }
  }

  public playPcmAudio(base64Data: string, sampleRate = 24000, onStart?: () => void, onEnd?: () => void) { return this.playAudioPayload(base64Data, 'pcm', sampleRate, onStart, onEnd); }

  public toggleBgm(volume = 0.15) { if (this.isBgmPlaying) { this.stopBgm(); return false; } this.startBgm(volume); return true; }
  public getIsBgmPlaying() { return this.isBgmPlaying; }
  public setBgmVolume(volume: number) { if (this.bgmGain && this.ctx) this.bgmGain.gain.setTargetAtTime(Math.max(0, Math.min(0.5, volume)), this.ctx.currentTime, 0.2); }
  public startBgm(volume = 0.15) {
    try {
      this.initContext(); if (!this.ctx || this.isBgmPlaying) return;
      this.isBgmPlaying = true;
      const master = this.ctx.createGain(); master.gain.setValueAtTime(0.001, this.ctx.currentTime); master.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 2); master.connect(this.ctx.destination); this.bgmGain = master;
      [130.81,196,261.63,329.63,392].forEach(f=>{ if(!this.ctx)return; const o=this.ctx.createOscillator(); const g=this.ctx.createGain(); o.type='sine'; o.frequency.value=f; g.gain.value=.02; o.connect(g); g.connect(master); o.start(); });
      const notes=[523.25,587.33,659.25,783.99,880,1046.5,1174.66,1318.51,1567.98];
      const arp=()=>{ if(!this.isBgmPlaying||!this.ctx)return; const o=this.ctx.createOscillator(); const g=this.ctx.createGain(); const now=this.ctx.currentTime; o.type=Math.random()>.4?'sine':'triangle'; o.frequency.value=notes[Math.floor(Math.random()*notes.length)]; g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(.04,now+.05); g.gain.exponentialRampToValueAtTime(.0001,now+2.4); o.connect(g); g.connect(master); o.start(now); o.stop(now+2.5); this.bgmTimer=setTimeout(arp,800+Math.random()*1200);};
      arp();
    } catch {}
  }
  public stopBgm() { this.isBgmPlaying=false; if(this.bgmTimer){clearTimeout(this.bgmTimer);this.bgmTimer=null;} if(this.bgmGain&&this.ctx){this.bgmGain.gain.linearRampToValueAtTime(.0001,this.ctx.currentTime+1);setTimeout(()=>{try{this.bgmGain?.disconnect();}catch{} this.bgmGain=null;},1100);} }
}

export const soundManager = new SoundManager();
