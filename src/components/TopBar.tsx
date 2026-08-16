import React from 'react';
import {
  FileText,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ExpressionType } from '../types';

interface TopBarProps {
  currentExpression: ExpressionType;
  onSelectExpression: (exp: ExpressionType) => void;
  onOpenMemories: () => void;
  onOpenSettings: () => void;
  onResetPosition: () => void;
  status: 'idle' | 'thinking' | 'speaking' | 'listening';
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  bgmEnabled?: boolean;
  onToggleBgm?: () => void;
  framing?: 'upper' | 'full';
  onToggleFraming?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentExpression,
  onSelectExpression,
  onOpenMemories,
  onOpenSettings,
  onResetPosition,
  status,
  voiceEnabled,
  onToggleVoice,
  bgmEnabled = false,
  onToggleBgm,
  framing = 'upper',
  onToggleFraming,
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 pointer-events-none">
      {/* Left empty container to preserve right alignment layout */}
      <div className="pointer-events-auto" />

      {/* Right: Actions (Framing, Music, Voice, Diary, Settings) */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Quick Framing Toggle (Upper Half vs Full Body) */}
        {onToggleFraming && (
          <button
            onClick={onToggleFraming}
            className={`px-2.5 py-1.5 rounded-full backdrop-blur-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-300 ${
              framing === 'upper'
                ? 'bg-pink-500/20 border-pink-400/40 text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.2)]'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:text-cyan-300'
            }`}
            title={framing === 'upper' ? 'มุมมอง: ครึ่งตัวบน (คลิกเพื่อดูแบบเต็มตัว)' : 'มุมมอง: เต็มตัว (คลิกเพื่อดูแบบครึ่งตัวบน)'}
          >
            <span>{framing === 'upper' ? '👤 ครึ่งตัวบน' : '🧍 เต็มตัว'}</span>
          </button>
        )}

        {/* Voice Toggle */}
        <button
          onClick={onToggleVoice}
          className={`p-2.5 rounded-full backdrop-blur-xl border transition-all duration-300 ${
            voiceEnabled
              ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
              : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
          title={voiceEnabled ? 'ปิดเสียงพูด' : 'เปิดเสียงพูด'}
        >
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Memory Diary Button (Matching screenshot 📄) */}
        <button
          onClick={onOpenMemories}
          className="p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-pink-400/40 text-slate-300 hover:text-pink-200 backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(244,114,182,0.2)]"
          title="บันทึกความทรงจำและไดอารี่"
        >
          <FileText size={16} />
        </button>

        {/* Settings Button (Matching screenshot ⚙️) */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 hover:border-cyan-400/40 text-slate-300 hover:text-cyan-200 backdrop-blur-xl transition-all duration-300 shadow-lg hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]"
          title="การตั้งค่า"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};
