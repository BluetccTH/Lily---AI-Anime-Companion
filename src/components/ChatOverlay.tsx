import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Plus,
  Volume2,
  Image as ImageIcon,
  FileText,
  X,
} from 'lucide-react';
import { ChatMessage, ChatAttachment } from '../types';
import { soundManager } from '../utils/audioSynth';

interface ChatOverlayProps {
  lastMessage: ChatMessage | null;
  onSendMessage: (text: string, attachment?: ChatAttachment) => void;
  isLoading: boolean;
  onReplayAudio: (msg: ChatMessage) => void;
  onOpenQuickPrompts: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  subtitlesEnabled: boolean;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  lastMessage,
  onSendMessage,
  isLoading,
  onReplayAudio,
  isListening,
  onToggleListening,
  subtitlesEnabled = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<ChatAttachment | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
      }
    };
    if (showPlusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlusMenu]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if ((!trimmed && !selectedAttachment) || isLoading) return;
    soundManager.playSendSound();
    onSendMessage(trimmed, selectedAttachment || undefined);
    setInputText('');
    setSelectedAttachment(null);
    setShowPlusMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSelectedAttachment({
        type: 'image',
        name: file.name,
        url: result,
        dataBase64: base64Data,
        mimeType: file.type || 'image/jpeg',
      });
      setShowPlusMenu(false);
      inputRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      setSelectedAttachment({
        type: 'file',
        name: file.name,
        url: result,
        dataBase64: base64Data,
        mimeType: file.type || 'text/plain',
      });
      setShowPlusMenu(false);
      inputRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const expressionThaiNames: Record<string, string> = {
    normal: 'อ่อนโยน',
    blush: 'เขินอาย',
    happy: 'ร่าเริง',
    wink: 'ขยิบตา',
    surprised: 'ประหลาดใจ',
    thinking: 'ครุ่นคิด',
    pout: 'แก้มป่อง',
    shy: 'เหนียมอาย',
    love: 'หลงรัก',
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center justify-end pb-7 px-4 pointer-events-none">
      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.pdf,.doc,.docx,.json,.md,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Floating Subtitle / Dialogue Bubble */}
      {subtitlesEnabled && showSubtitles && lastMessage && (
        <div className="w-full max-w-2xl mb-4 pointer-events-auto transition-all duration-300">
          <div className="relative p-4 md:p-5 rounded-2xl bg-slate-950/75 border border-pink-500/20 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(244,114,182,0.15)] flex flex-col gap-2 group">
            {/* Header: Name, Emotion Badge, Audio Replay, Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-pink-300 flex items-center gap-1.5 glow-pink">
                  <span>ลิลลี่ (Lily)</span>
                  <span className="text-xs text-amber-300">★</span>
                </span>

                {lastMessage.expression && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-200">
                    {expressionThaiNames[lastMessage.expression] || lastMessage.expression}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onReplayAudio(lastMessage)}
                  className="p-1.5 rounded-full bg-slate-800/80 hover:bg-pink-900/40 text-slate-300 hover:text-pink-200 border border-slate-700/60 transition-colors"
                  title="ฟังเสียงพูดซ้ำ"
                >
                  <Volume2 size={13} />
                </button>
                <button
                  onClick={() => setShowSubtitles(false)}
                  className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
                  title="ซ่อนคำบรรยาย"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Atmospheric Action Gesture */}
            {lastMessage.action && (
              <p className="text-xs italic text-cyan-300/80 select-none">
                {lastMessage.action}
              </p>
            )}

            {/* Spoken Text */}
            <p className="text-sm md:text-[15px] leading-relaxed text-slate-100 font-normal">
              {lastMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* Selected Attachment Preview Chip */}
      {selectedAttachment && (
        <div className="w-full max-w-2xl mb-2 flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-400/40 backdrop-blur-xl text-xs text-cyan-200 shadow-lg">
            {selectedAttachment.type === 'image' ? (
              <img src={selectedAttachment.url} alt="preview" className="w-6 h-6 object-cover rounded" />
            ) : (
              <FileText size={16} className="text-cyan-400" />
            )}
            <span className="max-w-[200px] truncate">{selectedAttachment.name}</span>
            <button
              onClick={() => setSelectedAttachment(null)}
              className="p-1 hover:text-rose-400 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Input Pill Container with Popover */}
      <div className="w-full max-w-2xl pointer-events-auto relative" ref={menuRef}>
        {/* Upload Popover Menu exactly matching user screenshot */}
        {showPlusMenu && (
          <div className="absolute bottom-[calc(100%+10px)] left-0 z-50 overflow-hidden rounded-2xl bg-[#2c2f36]/95 border border-[#3f434d] backdrop-blur-xl shadow-[0_12px_36px_rgba(0,0,0,0.65)] min-w-[200px] p-1.5 flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Upload Image Option */}
            <button
              type="button"
              onClick={() => {
                imageInputRef.current?.click();
              }}
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-left text-[14px] font-medium text-slate-100 hover:bg-white/10 active:bg-white/15 transition-colors group"
            >
              <ImageIcon size={19} className="text-slate-200 group-hover:text-white flex-shrink-0" />
              <span>Upload Image</span>
            </button>

            {/* Upload File Option */}
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-left text-[14px] font-medium text-slate-100 hover:bg-white/10 active:bg-white/15 transition-colors group"
            >
              <FileText size={19} className="text-slate-200 group-hover:text-white flex-shrink-0" />
              <span>Upload File</span>
            </button>
          </div>
        )}

        {/* Input Bar Pill exactly matching screenshot */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center w-full h-[52px] px-2 rounded-full bg-[#2a2d34]/85 border border-[#3e424c]/90 hover:border-slate-500/70 focus-within:border-slate-400/90 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-200"
        >
          {/* Left: Plus Action Button with circular subtle hover */}
          <button
            type="button"
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              showPlusMenu
                ? 'bg-slate-700/80 text-white rotate-45'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Upload Image / File"
          >
            <Plus size={20} strokeWidth={2} />
          </button>

          {/* Center: Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to your voice... ✨'
                : isLoading
                ? 'Lily is thinking... 💫'
                : 'Type a message...'
            }
            disabled={isLoading}
            className="w-full bg-transparent px-3 text-[15px] text-slate-100 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
          />

          {/* Right: Mic Button */}
          <button
            type="button"
            onClick={onToggleListening}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
              isListening
                ? 'bg-rose-500 text-white shadow-[0_0_15px_#f43f5e] animate-pulse'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff size={19} /> : <Mic size={19} />}
          </button>

          {/* Send Button when text is present */}
          {(inputText.trim() || selectedAttachment) && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-9 h-9 ml-1 rounded-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-white flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-50"
              title="Send"
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
