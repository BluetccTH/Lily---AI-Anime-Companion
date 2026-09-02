import React, { useEffect, useState } from 'react';
import {
  X,
  Volume2,
  Smile,
  Sliders,
  Sparkles,
  Palette,
  RotateCcw,
  Trash2,
  Check,
  Zap,
  Bot,
  Brain,
  MessageSquareHeart,
  Eye,
} from 'lucide-react';
import { AppSettings, ExpressionType } from '../types';
import { soundManager } from '../utils/audioSynth';
import { CHARACTER_MODELS } from './Live2DCanvas';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  currentExpression: ExpressionType;
  onSelectExpression: (exp: ExpressionType) => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentExpression,
  onSelectExpression,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'voice' | 'visual' | 'ai'>('avatar');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  if (!isOpen) return null;

  const expressions: { type: ExpressionType; label: string; icon: string }[] = [
    { type: 'normal', label: 'อ่อนโยน', icon: '✨' },
    { type: 'blush', label: 'เขินอาย', icon: '🌸' },
    { type: 'happy', label: 'ร่าเริง', icon: '💫' },
    { type: 'wink', label: 'ขยิบตา', icon: '⭐' },
    { type: 'surprised', label: 'ประหลาดใจ', icon: '🌌' },
    { type: 'thinking', label: 'ครุ่นคิด', icon: '💭' },
    { type: 'pout', label: 'แก้มป่อง', icon: '💢' },
    { type: 'shy', label: 'เหนียมอาย', icon: '🫧' },
    { type: 'love', label: 'หลงรัก', icon: '💖' },
  ];

  const themes = [
    { id: 'cosmos', name: 'ห้วงอวกาศลึก (Deep Cosmos)', desc: 'ทางช้างเผือกและเส้นขอบฟ้าแห่งดวงดาวอันเงียบสงบ' },
    { id: 'aurora', name: 'แสงเหนือออโรร่า (Celestial Aurora)', desc: 'ริ้วคลื่นแสงสีมรกตและประกายดาวสีฟ้าคราม' },
    { id: 'twilight', name: 'รัตติกาลสนธยา (Twilight Horizon)', desc: 'ท้องฟ้ายามค่ำคืนสีม่วงครามเข้มอันน่าหลงใหล' },
    { id: 'nebula', name: 'เนบิวลาดวงดาว (Ethereal Nebula)', desc: 'ละอองดาวสีชมพูมาเจนต้าและหมอกควันจักรวาล' },
  ];

  const testVoice = () => {
    soundManager.speakWithWebSpeech(
      'สวัสดีค่ะ! ฉันคือลิลลี่ สหายแห่งดวงดาวของคุณ ยินดีที่ได้พูดคุยกันนะคะ ✨',
      {
        pitch: settings.voicePitch,
        rate: settings.voiceSpeed,
        volume: settings.voiceVolume,
        voiceName: settings.selectedWebVoice,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[85vh] rounded-3xl bg-slate-950/90 border border-cyan-500/30 shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.2)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>ศูนย์ควบคุมและตั้งค่าลิลลี่</span>
                <span className="text-xs text-cyan-300">⚙️</span>
              </h2>
              <p className="text-xs text-slate-400">ปรับแต่งโมเดล Live2D เสียงพากย์ และสมอง Cloud AI Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('avatar')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'avatar'
                ? 'border-pink-400 text-pink-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile size={13} />
            <span>อวตารและมุมมอง</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'voice'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 size={13} />
            <span>เสียงพากย์</span>
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'visual'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette size={13} />
            <span>บรรยากาศและธีม</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={13} />
            <span>สมอง Cloud AI (Gemini)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              {/* Model Picker */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>เลือกโมเดลตัวละคร Live2D</span>
                  <span className="text-[11px] text-pink-300 font-normal">เปลี่ยนตัวละครได้ทันที</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHARACTER_MODELS.map((model) => {
                    const isSelected = (settings.characterModel || 'haru') === model.id;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ characterModel: model.id });
                          soundManager.playPop();
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-pink-500/20 border-pink-400 text-pink-100 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-pink-200">{model.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">
                            {model.type === 'cubism4' ? 'Cubism 4' : 'Cubism 2'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2">{model.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expression Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">ทดสอบการแสดงอารมณ์ Live2D</label>
                <div className="grid grid-cols-3 gap-2">
                  {expressions.map((exp) => (
                    <button
                      key={exp.type}
                      onClick={() => {
                        onSelectExpression(exp.type);
                        soundManager.playPop();
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        currentExpression === exp.type
                          ? 'bg-pink-500/20 border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.3)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-lg">{exp.icon}</div>
                      <div className="text-xs font-medium mt-1">{exp.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Framing Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">ระยะมุมมองตัวละคร (Camera Framing)</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ modelFraming: 'upper' });
                      soundManager.playPop();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      settings.modelFraming === 'upper'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-100 shadow-[0_0_12px_rgba(244,114,182,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">✨ มุมครึ่งตัวบน (Upper Body)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">เห็นสีหน้า แววตา และทรงผมชัดเจน เหมาะสำหรับพูดคุย</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ modelFraming: 'full' });
                      soundManager.playPop();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      settings.modelFraming === 'full'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-100 shadow-[0_0_12px_rgba(244,114,182,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-200">👗 มุมเต็มตัว (Full Body)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">เห็นตั้งแต่ศีรษะถึงปลายเท้าและชุดสวยงาม</div>
                  </button>
                </div>
              </div>

              {/* Advanced Sliders */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sliders size={13} />
                    <span>ปรับขนาดและตำแหน่งตัวละคร</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ modelScale: 1.0, modelOffsetY: 0 })}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> รีเซ็ตค่าเริ่มต้น
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>มาตราส่วนซูม (Scale Offset)</span>
                    <span className="font-mono text-cyan-300">{(settings.modelScale || 1.0).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.6"
                    step="0.05"
                    value={settings.modelScale || 1.0}
                    onChange={(e) => onUpdateSettings({ modelScale: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>ตำแหน่งแกน Y (Vertical Offset)</span>
                    <span className="font-mono text-cyan-300">{settings.modelOffsetY || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    step="5"
                    value={settings.modelOffsetY}
                    onChange={(e) => onUpdateSettings({ modelOffsetY: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-5">
              {/* Voice Enable Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-200">เปิดระบบเสียงพูดของลิลลี่ (Voice Audio)</div>
                  <div className="text-[11px] text-slate-400">เปล่งเสียงพูดภาษาไทยและขยับปากลิปซิงค์ตามจังหวะเสียง</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.voiceEnabled}
                  onChange={(e) => onUpdateSettings({ voiceEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </div>

              {/* Voice Engine */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">ระบบสร้างเสียงพูด (Voice Engine)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ voiceType: 'web' })}
                    className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                      settings.voiceType === 'web'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Web Speech Engine (ภาษาไทย)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ตอบสนองรวดเร็ว เสียงภาษาไทยมาตรฐาน</div>
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ voiceType: 'gemini' })}
                    className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                      settings.voiceType === 'gemini'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-100 shadow-[0_0_12px_rgba(244,114,182,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">Gemini Neural Voice</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ระบบเสียงสังเคราะห์อวกาศ</div>
                  </button>
                </div>
              </div>

              {/* Web Voice Selector */}
              {settings.voiceType === 'web' && availableVoices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">เลือกเสียงสังเคราะห์ (Voice Selection)</label>
                  <select
                    value={settings.selectedWebVoice}
                    onChange={(e) => onUpdateSettings({ selectedWebVoice: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">ค่าเริ่มต้นระบบ (ตรวจหาเสียงภาษาไทยอัตโนมัติ)</option>
                    {availableVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Anime Voice Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                  <span>✨ สไตล์เสียงพากย์อนิเมะน่ารัก (Anime Voice Presets)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ voicePitch: 1.55, voiceSpeed: 1.08 })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      Math.abs(settings.voicePitch - 1.55) < 0.05 && Math.abs(settings.voiceSpeed - 1.08) < 0.05
                        ? 'bg-pink-500/25 border-pink-400 text-pink-100 shadow-[0_0_10px_rgba(244,114,182,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-pink-500/40'
                    }`}
                  >
                    <div className="text-sm mb-0.5">🌸</div>
                    <div className="text-[11px] font-bold">สาวน้อยอนิเมะ</div>
                    <div className="text-[9px] text-pink-300/80">สดใส น่ารัก</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ voicePitch: 1.42, voiceSpeed: 0.96 })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      Math.abs(settings.voicePitch - 1.42) < 0.05 && Math.abs(settings.voiceSpeed - 0.96) < 0.05
                        ? 'bg-pink-500/25 border-pink-400 text-pink-100 shadow-[0_0_10px_rgba(244,114,182,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-pink-500/40'
                    }`}
                  >
                    <div className="text-sm mb-0.5">💖</div>
                    <div className="text-[11px] font-bold">แฟนสาวขี้อ้อน</div>
                    <div className="text-[9px] text-pink-300/80">หวานละมุน นุ่มนวล</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ voicePitch: 1.70, voiceSpeed: 1.15 })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      Math.abs(settings.voicePitch - 1.70) < 0.05 && Math.abs(settings.voiceSpeed - 1.15) < 0.05
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="text-sm mb-0.5">✨</div>
                    <div className="text-[11px] font-bold">อนิเมะเริงร่า</div>
                    <div className="text-[9px] text-cyan-300/80">เสียงใส ไฮเปอร์</div>
                  </button>
                </div>
              </div>

              {/* Sliders: Pitch & Speed */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>ระดับโทนเสียง (Pitch - เพิ่มเพื่อความสดใสน่ารัก)</span>
                    <span>{settings.voicePitch.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.8"
                    step="0.05"
                    value={settings.voicePitch}
                    onChange={(e) => onUpdateSettings({ voicePitch: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>ความเร็วในการพูด (Speed)</span>
                    <span>{settings.voiceSpeed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.05"
                    value={settings.voiceSpeed}
                    onChange={(e) => onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>
              </div>

              {/* Voice Tester Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={testVoice}
                  className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-200 flex items-center justify-center gap-2 transition-colors"
                >
                  <Volume2 size={14} />
                  <span>ทดลองฟังตัวอย่างเสียงพูด</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'visual' && (
            <div className="space-y-5">
              {/* Background Theme */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">บรรยากาศและธีมแห่งจักรวาล</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateSettings({ backgroundTheme: t.id })}
                      className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                        settings.backgroundTheme === t.id
                          ? 'bg-purple-500/20 border-purple-400 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-200">
                        <span>{t.name}</span>
                        {settings.backgroundTheme === t.id && <Check size={14} className="text-purple-300" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                {/* Ambient BGM */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">ดนตรีบรรเลงแห่งดวงดาว (Celestial BGM)</div>
                    <div className="text-[11px] text-slate-400">เสียงฮาร์ปและทำนองดนตรีอวกาศสร้างความผ่อนคลาย</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bgmEnabled}
                    onChange={(e) => onUpdateSettings({ bgmEnabled: e.target.checked })}
                    className="w-4 h-4 accent-purple-400 rounded cursor-pointer"
                  />
                </div>

                {settings.bgmEnabled && (
                  <div className="p-3 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>ระดับเสียงดนตรีบรรเลง</span>
                      <span>{Math.round(settings.bgmVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.4"
                      step="0.01"
                      value={settings.bgmVolume}
                      onChange={(e) => onUpdateSettings({ bgmVolume: parseFloat(e.target.value) })}
                      className="w-full accent-purple-400"
                    />
                  </div>
                )}

                {/* SFX */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">เสียงเอฟเฟกต์บรรยากาศ (SFX)</div>
                    <div className="text-[11px] text-slate-400">เสียงกระดิ่ง เสียงประกายดาว และเสียงสะท้อนวงแหวน</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sfxEnabled}
                    onChange={(e) => onUpdateSettings({ sfxEnabled: e.target.checked })}
                    className="w-4 h-4 accent-purple-400 rounded cursor-pointer"
                  />
                </div>

                {/* Subtitles */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">กล่องคำบรรยายบทสนทนา (Subtitles)</div>
                    <div className="text-[11px] text-slate-400">แสดงข้อความคำพูดและแท็กอารมณ์ที่ด้านล่างหน้าจอ</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.subtitlesEnabled}
                    onChange={(e) => onUpdateSettings({ subtitlesEnabled: e.target.checked })}
                    className="w-4 h-4 accent-purple-400 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Clear History */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="w-full py-2.5 rounded-2xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-xs font-semibold text-rose-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>ล้างประวัติการสนทนาทั้งหมด</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Active Gemini Cloud AI Engine Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-cyan-950/40 border border-pink-500/30 text-pink-200 space-y-3 shadow-[0_0_20px_rgba(244,114,182,0.15)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>Cloud AI (Google Gemini Engine)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                          ⚡ พร้อมใช้งาน 0s ทันที
                        </span>
                      </div>
                      <div className="text-[11px] text-pink-300/80">โมเดลปัญญาประดิษฐ์ระดับแนวหน้า ฉลาด เป็นธรรมชาติ เข้าใจภาษาไทยลึกซึ้ง</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-pink-500/20 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                    <Brain size={14} className="text-pink-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">ความจำระยะยาว</div>
                      <div className="text-[10px] text-slate-400">จดจำเรื่องราว ความชอบ และอารมณ์</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                    <Eye size={14} className="text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">ระบบสายตา Vision</div>
                      <div className="text-[10px] text-slate-400">ส่งรูปภาพและไฟล์ให้ดูและวิเคราะห์ได้</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                    <MessageSquareHeart size={14} className="text-purple-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-200">อารมณ์และท่าทาง</div>
                      <div className="text-[10px] text-slate-400">เปลี่ยนสีหน้าและท่าทางตามบทสนทนา</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
                <Bot size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-semibold text-cyan-200">ไม่ต้องดาวน์โหลดไฟล์ขนาดใหญ่ลงเครื่อง:</span>{' '}
                  ลิลลี่ประมวลผลคำตอบและการมองเห็นผ่าน Cloud Server อย่างปลอดภัยและรวดเร็วทันใจ พร้อมรองรับทุกอุปกรณ์ไม่ว่าจะเป็นมือถือ แท็บเล็ต หรือคอมพิวเตอร์
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
