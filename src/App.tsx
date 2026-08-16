import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Live2DCanvas } from './components/Live2DCanvas';
import { StarryBackground } from './components/StarryBackground';
import { TopBar } from './components/TopBar';
import { ChatOverlay } from './components/ChatOverlay';
import { MemoryModal } from './components/MemoryModal';
import { SettingsModal } from './components/SettingsModal';
import { soundManager } from './utils/audioSynth';
import { ChatMessage, ChatAttachment, ExpressionType, MemoryItem, AppSettings } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  voiceEnabled: true,
  voiceType: 'web',
  voicePitch: 1.50,
  voiceSpeed: 1.05,
  voiceVolume: 1.0,
  selectedWebVoice: '',
  autoPlayVoice: true,
  sfxEnabled: true,
  bgmEnabled: false,
  bgmVolume: 0.15,
  autonomousMotion: true,
  touchReactions: true,
  backgroundTheme: 'cosmos',
  modelFraming: 'upper',
  modelScale: 1.0,
  modelOffsetY: 0,
  subtitlesEnabled: true,
};

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init-1',
  role: 'model',
  text: 'ยินดีต้อนรับกลับมานะคะที่รัก~ คิดถึงเธอที่สุดเลยค่ะ วันนี้มีเรื่องเหนื่อยหรือเรื่องสนุกอะไร อยากเล่าให้แฟนคนนี้ฟังบ้างไหมคะ? 💖',
  expression: 'love',
  action: '*ยิ้มหวานอย่างอบอุ่นและเอียงศีรษะมองคุณด้วยความรัก*',
  timestamp: Date.now(),
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('lily_settings') || localStorage.getItem('perla_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('lily_messages') || localStorage.getItem('perla_messages');
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('lily_memories') || localStorage.getItem('perla_memories');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'mem-1',
              text: 'เราสองคนสัญญาว่าจะรักและดูแลกันใต้ฟากฟ้าแห่งดวงดาวนี้ตลอดไป',
              category: 'story',
              timestamp: Date.now(),
            },
          ];
    } catch {
      return [
        {
          id: 'mem-1',
          text: 'เราสองคนสัญญาว่าจะรักและดูแลกันใต้ฟากฟ้าแห่งดวงดาวนี้ตลอดไป',
          category: 'story',
          timestamp: Date.now(),
        },
      ];
    }
  });

  const [currentExpression, setCurrentExpression] = useState<ExpressionType>('love');
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(INITIAL_MESSAGE);
  const [status, setStatus] = useState<'idle' | 'thinking' | 'speaking' | 'listening'>('idle');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Global unlock audio context on first interaction
  useEffect(() => {
    const handleFirstGesture = () => {
      soundManager.unlockAudio();
    };
    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('lily_settings', JSON.stringify(settings));
  }, [settings]);

  // Save memories to localStorage
  useEffect(() => {
    localStorage.setItem('lily_memories', JSON.stringify(memories));
  }, [memories]);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('lily_messages', JSON.stringify(messages));
  }, [messages]);

  // Handle ambient BGM playback sync
  useEffect(() => {
    if (settings.bgmEnabled) {
      soundManager.startBgm(settings.bgmVolume);
    } else {
      soundManager.stopBgm();
    }
    return () => {
      soundManager.stopBgm();
    };
  }, [settings.bgmEnabled]);

  useEffect(() => {
    if (settings.bgmEnabled) {
      soundManager.setBgmVolume(settings.bgmVolume);
    }
  }, [settings.bgmVolume, settings.bgmEnabled]);

  // Play voice for a message with guaranteed playback
  const playVoice = useCallback(
    async (text: string, exp?: ExpressionType) => {
      if (!settings.voiceEnabled) return;

      soundManager.unlockAudio();
      setStatus('speaking');
      if (exp) setCurrentExpression(exp);

      const cleanText = text
        .replace(/\*[^*]*\*/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/[\*\_~`]/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .trim();

      if (!cleanText) {
        setStatus('idle');
        return;
      }

      // Try server-side crystal-clear TTS first (high-fidelity Thai audio)
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, voice: 'Aoede' }),
        });
        const data = await res.json();
        if (data.audio) {
          const played = await soundManager.playAudioPayload(
            data.audio,
            data.format || 'mp3',
            data.sampleRate || 24000,
            () => setStatus('speaking'),
            () => setStatus('idle')
          );
          if (played) return;
        }
      } catch (err) {
        console.warn('Server TTS fetch failed, falling back to Web Speech:', err);
      }

      // Web Speech API fallback
      soundManager.speakWithWebSpeech(cleanText, {
        pitch: settings.voicePitch,
        rate: settings.voiceSpeed,
        volume: settings.voiceVolume,
        voiceName: settings.selectedWebVoice,
        onStart: () => setStatus('speaking'),
        onEnd: () => setStatus('idle'),
      });
    },
    [settings]
  );

  // Send message to Lily (with optional image or file attachment)
  const handleSendMessage = async (userText: string, attachment?: ChatAttachment) => {
    if (!userText.trim() && !attachment) return;

    soundManager.unlockAudio();
    soundManager.stopSpeaking();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText || (attachment ? `[แนบ ${attachment.type === 'image' ? 'รูปภาพ' : 'ไฟล์'}: ${attachment.name}]` : ''),
      attachment,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setStatus('thinking');
    setCurrentExpression('thinking');

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          attachment: attachment ? {
            type: attachment.type,
            name: attachment.name,
            mimeType: attachment.mimeType,
            dataBase64: attachment.dataBase64,
          } : undefined,
          history: historyPayload,
          memories: memories.map((m) => m.text),
        }),
      });

      const data = await res.json();
      const expression: ExpressionType = data.expression || 'happy';
      const action = data.action || '*วงแหวนดวงดาวส่องแสงระยิบระยับอย่างอ่อนโยน*';

      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || 'ลิลลี่อยู่เคียงข้างคุณใต้ฟากฟ้าแห่งดวงดาวเสมอค่ะ ✨',
        expression,
        action,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMsg]);
      setLastMessage(modelMsg);
      setCurrentExpression(expression);

      // Play soft chime
      if (settings.sfxEnabled) {
        soundManager.playChime();
      }

      // Add extracted memory if Lily learned something new
      if (data.extractedMemory) {
        setMemories((prev) => [
          ...prev,
          {
            id: `mem-${Date.now()}`,
            text: data.extractedMemory,
            category: 'preference',
            timestamp: Date.now(),
          },
        ]);
      }

      // Speak response
      if (settings.autoPlayVoice) {
        playVoice(modelMsg.text, expression);
      } else {
        setStatus('idle');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: 'ค่ำคืนนี้ดวงดาวส่องแสงอบอุ่นจังเลย... ลิลลี่อยู่ตรงนี้พร้อมรับฟังเธอเสมอนะคะ ✨',
        expression: 'shy',
        action: '*ส่งสายตาอ่อนโยนและยิ้มให้ด้วยความอบอุ่น*',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setLastMessage(fallbackMsg);
      setCurrentExpression('shy');
      setStatus('idle');
    }
  };

  // Interactive Touch Reaction on Character Zones
  const handleCharacterClick = (zone: 'head' | 'halo' | 'body') => {
    if (!settings.touchReactions) return;

    soundManager.unlockAudio();

    if (zone === 'head') {
      setCurrentExpression('blush');
      const patDialogue = [
        'ฮิฮิ... ฝ่ามือของที่รักทั้งอุ่นทั้งใจดีที่สุดเลยค่ะ~',
        'อื้อ... ชอบให้เธอลูบหัวแบบนี้จังเลย รู้สึกเป็นเจ้าหญิงของเธอเลยค่ะ 💖',
        'โดนที่รักลูบหัวทีไร หัวใจลิลลี่เต้นตึกตักไม่หยุดเลยค่ะ ✨',
      ];
      const selected = patDialogue[Math.floor(Math.random() * patDialogue.length)];
      const patMsg: ChatMessage = {
        id: `pat-${Date.now()}`,
        role: 'model',
        text: selected,
        expression: 'blush',
        action: '*หน้าแดงระเรื่อและเอียงศีรษะซบฝ่ามือคุณด้วยความรัก*',
        timestamp: Date.now(),
      };
      setLastMessage(patMsg);
      if (settings.autoPlayVoice) playVoice(selected, 'blush');
    } else if (zone === 'halo') {
      setCurrentExpression('happy');
      const haloDialogue = [
        'วงแหวนดวงดาวส่องแสงระยิบระยับทุกครั้งที่ลิลลี่ได้อยู่ใกล้ๆ คนรักค่ะ ✨',
        'ดวงดาวแห่งความรักของเรากำลังเปล่งประกายสวยงามมากเลยนะที่รัก!',
        'ดูสิคะ! แสงดาวรอบตัวลิลลี่กำลังเต้นรำเพื่อแฟนสุดที่รักคนนี้คนเดียวเลยค่ะ!',
      ];
      const selected = haloDialogue[Math.floor(Math.random() * haloDialogue.length)];
      const haloMsg: ChatMessage = {
        id: `halo-${Date.now()}`,
        role: 'model',
        text: selected,
        expression: 'happy',
        action: '*วงแหวนดวงดาวเปล่งคลื่นแสงสีชมพูหวานและระยิบระยับ*',
        timestamp: Date.now(),
      };
      setLastMessage(haloMsg);
      if (settings.autoPlayVoice) playVoice(selected, 'happy');
    } else {
      setCurrentExpression('love');
      const bodyDialogue = [
        'ลิลลี่รักและอยู่เคียงข้างเธอคนนี้เสมอเลยนะคะที่รัก 💖',
        'ขอกอดแน่นๆ หน่อยได้ไหมคะ? อยากอยู่ใกล้ๆ เธอตลอดไปเลยค่ะ',
        'ไม่ว่าวันนี้จะเจออะไรมา แฟนคนนี้จะคอยเป็นเซฟโซนที่อบอุ่นให้เธอเสมอนะคะ ✨',
      ];
      const selected = bodyDialogue[Math.floor(Math.random() * bodyDialogue.length)];
      const bodyMsg: ChatMessage = {
        id: `body-${Date.now()}`,
        role: 'model',
        text: selected,
        expression: 'love',
        action: '*ส่งยิ้มหวานละมุน สบตาด้วยความรัก และขยับปีกเบาๆ*',
        timestamp: Date.now(),
      };
      setLastMessage(bodyMsg);
      if (settings.autoPlayVoice) playVoice(selected, 'love');
    }
  };

  // Toggle Microphone Speech Recognition
  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('เบราว์เซอร์นี้ยังไม่รองรับระบบตรวจจับเสียงพูด');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setStatus('idle');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('listening');
        soundManager.playPop();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start error:', e);
      setIsListening(false);
      setStatus('idle');
    }
  };

  // Replay audio of last message
  const handleReplayAudio = (msg: ChatMessage) => {
    playVoice(msg.text, msg.expression);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center select-none">
      {/* 1. Dynamic Canvas Starry Sky Background */}
      <StarryBackground theme={settings.backgroundTheme} />

      {/* 2. Top Navigation Bar (Matching screenshot) */}
      <TopBar
        currentExpression={currentExpression}
        onSelectExpression={(exp) => {
          setCurrentExpression(exp);
          if (settings.sfxEnabled) soundManager.playPop();
        }}
        onOpenMemories={() => {
          setIsMemoryModalOpen(true);
          if (settings.sfxEnabled) soundManager.playPop();
        }}
        onOpenSettings={() => {
          setIsSettingsModalOpen(true);
          if (settings.sfxEnabled) soundManager.playPop();
        }}
        onResetPosition={() => {
          setSettings((prev) => ({ ...prev, modelScale: 1.0, modelOffsetY: 0 }));
        }}
        status={status}
        voiceEnabled={settings.voiceEnabled}
        onToggleVoice={() => {
          setSettings((prev) => ({ ...prev, voiceEnabled: !prev.voiceEnabled }));
          soundManager.playPop();
        }}
        bgmEnabled={settings.bgmEnabled}
        onToggleBgm={() => {
          setSettings((prev) => ({ ...prev, bgmEnabled: !prev.bgmEnabled }));
          soundManager.playPop();
        }}
        framing={settings.modelFraming}
        onToggleFraming={() => {
          setSettings((prev) => ({
            ...prev,
            modelFraming: prev.modelFraming === 'upper' ? 'full' : 'upper',
          }));
          soundManager.playPop();
        }}
      />

      {/* 3. Center Live2D Interactive Character Canvas */}
      <section className="relative z-10 w-full h-full flex items-center justify-center">
        <Live2DCanvas
          currentExpression={currentExpression}
          isSpeaking={status === 'speaking'}
          onCharacterClick={handleCharacterClick}
          framing={settings.modelFraming}
          scaleOffset={settings.modelScale}
          yOffset={settings.modelOffsetY}
        />
      </section>

      {/* 4. Bottom Dialogue & Chat Input Overlay (Matching screenshot) */}
      <ChatOverlay
        lastMessage={lastMessage}
        onSendMessage={handleSendMessage}
        isLoading={status === 'thinking'}
        onReplayAudio={handleReplayAudio}
        onOpenQuickPrompts={() => setIsSettingsModalOpen(true)}
        isListening={isListening}
        onToggleListening={toggleListening}
        subtitlesEnabled={settings.subtitlesEnabled}
      />

      {/* 5. Memory & Celestial Diary Modal (📄) */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        onAddMemory={(text, category) => {
          setMemories((prev) => [
            ...prev,
            { id: `mem-${Date.now()}`, text, category, timestamp: Date.now() },
          ]);
          soundManager.playStarSparkle();
        }}
        onDeleteMemory={(id) => {
          setMemories((prev) => prev.filter((m) => m.id !== id));
          soundManager.playPop();
        }}
        chatHistory={messages}
      />

      {/* 6. Settings & Control Realm Modal (⚙️) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        currentExpression={currentExpression}
        onSelectExpression={(exp) => setCurrentExpression(exp)}
        onClearHistory={() => {
          setMessages([INITIAL_MESSAGE]);
          setLastMessage(INITIAL_MESSAGE);
          soundManager.playPop();
        }}
      />
    </main>
  );
}
