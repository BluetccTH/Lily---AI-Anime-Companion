import React, { useState } from 'react';
import { X, Heart, Sparkles, BookOpen, Trash2, Plus, MessageSquare, Clock } from 'lucide-react';
import { MemoryItem, ChatMessage } from '../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onAddMemory: (text: string, category: MemoryItem['category']) => void;
  onDeleteMemory: (id: string) => void;
  chatHistory: ChatMessage[];
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
  chatHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'memories' | 'history'>('memories');
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('preference');

  if (!isOpen) return null;

  // Calculate Star Bond Level
  const totalInteractions = chatHistory.length + memories.length * 2;
  let bondTitle = 'คนคุ้นเคยแห่งดวงดาว';
  let bondPercent = Math.min(100, Math.floor(totalInteractions * 4));
  if (totalInteractions >= 25) bondTitle = 'คู่แท้แห่งจักรวาลนิรันดร์';
  else if (totalInteractions >= 15) bondTitle = 'เพื่อนสนิทคู่ใจแห่งดวงดาว';
  else if (totalInteractions >= 8) bondTitle = 'สหายใต้แสงจันทร์';
  else if (totalInteractions >= 3) bondTitle = 'เพื่อนแห่งดวงดารา';

  const categoryThaiLabels: Record<string, string> = {
    preference: 'สิ่งที่ชอบ',
    story: 'เรื่องราว',
    fact: 'ข้อมูลสำคัญ',
    emotion: 'ความรู้สึก',
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    onAddMemory(newMemoryText.trim(), newCategory);
    setNewMemoryText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-xl max-h-[85vh] rounded-3xl bg-slate-950/90 border border-pink-500/30 shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_30px_rgba(244,114,182,0.2)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-300">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>สมุดบันทึกความทรงจำของลิลลี่</span>
                <span className="text-xs text-amber-300">★</span>
              </h2>
              <p className="text-xs text-slate-400">ความทรงจำและช่วงเวลาประทับใจร่วมกัน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Star Bond Meter */}
        <div className="px-6 py-4 bg-gradient-to-r from-pink-950/30 via-purple-950/30 to-cyan-950/30 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-pink-200 flex items-center gap-1.5">
              <Heart size={13} className="text-pink-400 fill-pink-400/40" />
              <span>ระดับความผูกพันแห่งดวงดาว: {bondTitle}</span>
            </span>
            <span className="text-cyan-300 font-mono font-bold">{bondPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 transition-all duration-700 shadow-[0_0_10px_rgba(244,114,182,0.5)]"
              style={{ width: `${Math.max(8, bondPercent)}%` }}
            />
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('memories')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'memories'
                ? 'border-pink-400 text-pink-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={13} />
            <span>ความทรงจำที่บันทึก ({memories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={13} />
            <span>ประวัติการสนทนา ({chatHistory.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'memories' ? (
            <>
              {/* Add Memory Form */}
              <form onSubmit={handleAdd} className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <input
                  type="text"
                  value={newMemoryText}
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  placeholder="พิมพ์รายละเอียดที่อยากให้ลิลลี่จดจำ (เช่น วันเกิดของฉันคือเดือนกรกฎาคม)..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
                  >
                    <option value="preference">สิ่งที่ชอบ (Preference)</option>
                    <option value="story">เรื่องราว (Story)</option>
                    <option value="fact">ข้อมูลสำคัญ (Fact)</option>
                    <option value="emotion">ความรู้สึก (Emotion)</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} />
                    <span>บันทึกความจำ</span>
                  </button>
                </div>
              </form>

              {/* Memory List */}
              {memories.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <Sparkles size={24} className="opacity-40 text-pink-300" />
                  <span>ยังไม่มีความทรงจำที่บันทึกไว้ พูดคุยกับลิลลี่หรือเพิ่มบันทึกเองได้เลย!</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-pink-500/30 flex items-start justify-between gap-3 group transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-pink-500/10 text-pink-300 border border-pink-500/20">
                            {categoryThaiLabels[m.category] || m.category}
                          </span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(m.timestamp).toLocaleDateString('th-TH')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200">{m.text}</p>
                      </div>
                      <button
                        onClick={() => onDeleteMemory(m.id)}
                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-all"
                        title="ลบบันทึก"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Dialogue Transcript */
            <div className="space-y-3">
              {chatHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  ยังไม่มีประวัติการสนทนา
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 p-3 rounded-2xl text-xs ${
                      msg.role === 'user'
                        ? 'bg-cyan-950/30 border border-cyan-500/20 ml-8 text-cyan-100'
                        : 'bg-slate-900/60 border border-pink-500/20 mr-8 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-70">
                      <span className="font-semibold">
                        {msg.role === 'user' ? 'คุณ' : 'ลิลลี่ (Lily)'}
                      </span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {msg.action && <p className="italic text-pink-300/80 text-[11px]">{msg.action}</p>}
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
