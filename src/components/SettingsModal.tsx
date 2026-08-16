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
  Cpu,
  Download,
  ShieldCheck,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { AppSettings, ExpressionType } from '../types';
import { soundManager } from '../utils/audioSynth';
import { localAI, AVAILABLE_LOCAL_MODELS } from '../utils/localAI';

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
  const [activeTab, setActiveTab] = useState<'engine' | 'avatar' | 'voice' | 'visual'>('engine');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isWebGPUSupported, setIsWebGPUSupported] = useState<boolean>(true);
  const [loadingLocalModel, setLoadingLocalModel] = useState<boolean>(false);
  const [localProgress, setLocalProgress] = useState<number>(0);
  const [localStatusText, setLocalStatusText] = useState<string>('');

  useEffect(() => {
    setIsWebGPUSupported(localAI.checkWebGPUSupport());
    const state = localAI.getLoadState();
    setLocalProgress(state.progress);
    setLocalStatusText(state.statusText);
  }, [isOpen]);

  const handleDownloadLocalModel = async (modelId: string) => {
    try {
      setLoadingLocalModel(true);
      await localAI.initEngine(modelId, (progress, text) => {
        setLocalProgress(progress);
        setLocalStatusText(text);
      });
      onUpdateSettings({
        aiProvider: 'local',
        localModelId: modelId,
      });
      soundManager.playPop();
    } catch (err: any) {
      alert(`ไม่สามารถโหลดโมเดลได้: ${err.message || err}`);
    } finally {
      setLoadingLocalModel(false);
    }
  };

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
              <p className="text-xs text-slate-400">ปรับแต่งเสียงพากย์ การเคลื่อนไหว Live2D และบรรยากาศจักรวาล</p>
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
            onClick={() => setActiveTab('engine')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'engine'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu size={13} />
            <span>สมอง AI (รันในเครื่อง/ฟรี)</span>
          </button>
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
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Engine Tab: Local AI (WebLLM / On-Device) & Ollama & Cloud */}
          {activeTab === 'engine' && (
            <div className="space-y-5">
              {/* WebGPU Device Status Card */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  isWebGPUSupported
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}
              >
                <div
                  className={`p-2 rounded-xl border mt-0.5 ${
                    isWebGPUSupported
                      ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                      : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                  }`}
                >
                  {isWebGPUSupported ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>
                      {isWebGPUSupported
                        ? '✨ อุปกรณ์นี้รองรับ WebGPU (พร้อมรันในเครื่อง 100%)'
                        : '⚠️ อุปกรณ์/เบราว์เซอร์นี้ยังไม่เปิด WebGPU'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {isWebGPUSupported
                      ? 'คุณสามารถรันโมเดล AI ในเครื่องได้โดยตรง ฟรีตลอดชีพ ไม่ใช้โควตา Token ข้อมูลทั้งหมดเป็นส่วนตัวอยู่บนคอม/มือถือของคุณ'
                      : 'สำหรับอุปกรณ์ที่ยังไม่รองรับ WebGPU แนะนำให้ใช้โหมด Cloud AI (Gemini) เพื่อการตอบกลับที่รวดเร็วและลื่นไหล'}
                  </div>
                </div>
              </div>

              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>เลือกแหล่งประมวลผลสมอง AI (AI Engine)</span>
                  <span className="text-[11px] text-emerald-300 font-normal">สลับได้ตลอดเวลา</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Local In-Browser AI (WebLLM) */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ aiProvider: 'local' });
                      soundManager.playPop();
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      settings.aiProvider === 'local'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Cpu size={14} className="text-emerald-400" />
                        <span>รันในเครื่อง (WebGPU)</span>
                      </div>
                      {settings.aiProvider === 'local' && (
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">ฟรี 100% ไม่ใช้ Token รันผ่านเบราว์เซอร์</div>
                  </button>

                  {/* Option 2: Cloud AI (Gemini) */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ aiProvider: 'cloud' });
                      soundManager.playPop();
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      settings.aiProvider === 'cloud'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-100 shadow-[0_0_15px_rgba(244,114,182,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Zap size={14} className="text-pink-400" />
                        <span>Cloud AI (Gemini)</span>
                      </div>
                      {settings.aiProvider === 'cloud' && (
                        <span className="text-[10px] bg-pink-500/30 text-pink-200 px-1.5 py-0.5 rounded font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">เร็ว ฉลาด เข้าใจภาษาไทยลึกซึ้ง</div>
                  </button>

                  {/* Option 3: Ollama Localhost */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSettings({ aiProvider: 'ollama' });
                      soundManager.playPop();
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      settings.aiProvider === 'ollama'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Cpu size={14} className="text-cyan-400" />
                        <span>Ollama ในเครื่อง</span>
                      </div>
                      {settings.aiProvider === 'ollama' && (
                        <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-1.5 py-0.5 rounded font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">ต่อตรง localhost:11434 (สำหรับคอมพิวเตอร์)</div>
                  </button>
                </div>
              </div>

              {/* Local WebGPU Model Selector */}
              {settings.aiProvider === 'local' && (
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Download size={14} />
                      <span>รายการโมเดล AI ในเครื่องที่ดาวน์โหลดได้</span>
                    </label>
                    <span className="text-[10px] text-slate-400">ดาวน์โหลดครั้งเดียว เก็บไว้ในเครื่องถาวร</span>
                  </div>

                  {/* Loading progress bar if actively downloading */}
                  {loadingLocalModel && (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-200">
                        <span className="font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          กำลังเตรียมและแคชโมเดลลงในเครื่อง...
                        </span>
                        <span className="font-mono">{localProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${localProgress}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{localStatusText}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2.5">
                    {AVAILABLE_LOCAL_MODELS.map((model) => {
                      const isSelected = settings.localModelId === model.id;
                      return (
                        <div
                          key={model.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-emerald-950/30 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-100">{model.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                                {model.size}
                              </span>
                              {model.recommended === 'mobile' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                                  📱 เบาพิเศษ สำหรับมือถือ
                                </span>
                              )}
                              {model.recommended === 'desktop' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                                  💻 แนะนำสำหรับคอม
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">{model.description}</div>
                          </div>

                          <button
                            type="button"
                            disabled={loadingLocalModel}
                            onClick={() => handleDownloadLocalModel(model.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                          >
                            {isSelected ? (
                              <>
                                <Check size={13} />
                                <span>กำลังใช้งาน</span>
                              </>
                            ) : (
                              <>
                                <Download size={13} />
                                <span>โหลดและเปิดใช้</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ollama Host Configuration */}
              {settings.aiProvider === 'ollama' && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="text-xs font-bold text-cyan-300">ตั้งค่าการเชื่อมต่อ Ollama</div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400">Ollama API URL</label>
                    <input
                      type="text"
                      value={settings.ollamaUrl || 'http://localhost:11434'}
                      onChange={(e) => onUpdateSettings({ ollamaUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-slate-400">ชื่อโมเดลใน Ollama (Model Name)</label>
                    <input
                      type="text"
                      value={settings.ollamaModel || 'qwen2.5:1.5b'}
                      onChange={(e) => onUpdateSettings({ ollamaModel: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                      placeholder="qwen2.5:1.5b หรือ llama3.2:1b"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'avatar' && (
            <div className="space-y-5">
              {/* Active Model Status Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 border border-pink-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-lg">
                    ✨
                  </div>
                  <div>
                    <div className="text-xs font-bold text-pink-200 flex items-center gap-1.5">
                      <span>โมเดล: 海魔完整版 (MassageSeacubus Full Version)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/30 text-pink-100 font-mono">Full v3</span>
                    </div>
                    <div className="text-[11px] text-slate-400">เท็กซ์เจอร์คมชัดระดับ 4096 HD + 8 สีหน้าอารมณ์ + ระบบฟิสิกส์ผมและปีก</div>
                  </div>
                </div>
              </div>

              {/* Camera Framing Selection (Upper half vs Full body) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>โหมดมุมมองกล้อง (Camera Framing)</span>
                  <span className="text-[11px] text-cyan-300 font-normal">ครึ่งตัวบน vs เต็มตัว</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateSettings({ modelFraming: 'upper' })}
                    className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                      settings.modelFraming === 'upper'
                        ? 'bg-pink-500/20 border-pink-400 text-pink-100 shadow-[0_0_12px_rgba(244,114,182,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>👤 ครึ่งตัวบน (Upper Half)</span>
                      {settings.modelFraming === 'upper' && <span className="text-[10px] text-pink-300 font-normal">● ใช้งานอยู่</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">เน้นใบหน้า อก เอว และสีหน้าชัดเจน</div>
                  </button>

                  <button
                    onClick={() => onUpdateSettings({ modelFraming: 'full' })}
                    className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                      settings.modelFraming === 'full'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>🧍 เต็มตัว (Full Body)</span>
                      {settings.modelFraming === 'full' && <span className="text-[10px] text-cyan-300 font-normal">● ใช้งานอยู่</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">แสดงสัดส่วนโมเดลเต็มตัวตั้งแต่เขาจรดกระโปรง</div>
                  </button>
                </div>
              </div>

              {/* Expression Tester */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                  <span>ทดสอบสีหน้าอารมณ์ Live2D</span>
                  <span className="text-[11px] text-pink-300 font-normal">คลิกเพื่อแสดงอารมณ์</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {expressions.map((exp) => (
                    <button
                      key={exp.type}
                      onClick={() => {
                        soundManager.playPop();
                        onSelectExpression(exp.type);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        currentExpression === exp.type
                          ? 'bg-pink-500/20 border-pink-400 text-pink-100 shadow-[0_0_12px_rgba(244,114,182,0.3)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{exp.label}</span>
                      <span>{exp.icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar Position & Size */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-300">การควบคุมตำแหน่งและการตอบสนอง</h3>

                {/* Autonomous AI Life Engine Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-pink-200 flex items-center gap-1.5">
                      <span>✨ ระบบ AI มีชีวิตอิสระ (Autonomous AI Life)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">ลิลลี่ขยับท่าทาง สบตา หันศีรษะ และกะพริบตาเองตามใจและความรู้สึกอย่างเป็นธรรมชาติ 100%</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autonomousMotion}
                    onChange={(e) => onUpdateSettings({ autonomousMotion: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </div>

                {/* Touch Reactions */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">การตอบสนองเมื่อแตะสัมผัส (Touch Reactions)</div>
                    <div className="text-[11px] text-slate-400">แตะที่หัวเพื่อลูบหัว หรือแตะที่วงแหวนเพื่อเปล่งแสงดาว</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.touchReactions}
                    onChange={(e) => onUpdateSettings({ touchReactions: e.target.checked })}
                    className="w-4 h-4 accent-pink-500 rounded cursor-pointer"
                  />
                </div>

                {/* Model Zoom */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>ขนาดของโมเดล (Scale)</span>
                    <span>{settings.modelScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.4"
                    step="0.05"
                    value={settings.modelScale}
                    onChange={(e) => onUpdateSettings({ modelScale: parseFloat(e.target.value) })}
                    className="w-full accent-pink-500"
                  />
                </div>

                {/* Model Vertical Offset */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>ตำแหน่งแนวตั้ง (Vertical Offset)</span>
                    <span>{settings.modelOffsetY}px</span>
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
        </div>
      </div>
    </div>
  );
};
