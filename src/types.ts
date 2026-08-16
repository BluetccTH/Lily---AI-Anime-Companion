export type ExpressionType = 
  | 'normal' 
  | 'blush' 
  | 'happy' 
  | 'wink' 
  | 'surprised' 
  | 'thinking' 
  | 'pout' 
  | 'shy' 
  | 'love';

export interface ChatAttachment {
  type: 'image' | 'file';
  name: string;
  url: string;
  dataBase64?: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  expression?: ExpressionType;
  action?: string;
  timestamp: number;
  audioUrl?: string;
  isStreaming?: boolean;
  attachment?: ChatAttachment;
}

export interface MemoryItem {
  id: string;
  text: string;
  category: 'preference' | 'story' | 'fact' | 'emotion' | 'general';
  timestamp: number;
}

export interface AppSettings {
  aiProvider: 'cloud' | 'local' | 'ollama';
  localModelId: string;
  ollamaUrl: string;
  ollamaModel: string;
  voiceEnabled: boolean;
  voiceType: 'web' | 'gemini';
  voicePitch: number;
  voiceSpeed: number;
  voiceVolume: number;
  selectedWebVoice: string;
  autoPlayVoice: boolean;
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number;
  autonomousMotion: boolean;
  touchReactions: boolean;
  backgroundTheme: string;
  modelFraming: 'upper' | 'full';
  modelScale: number;
  modelOffsetY: number;
  subtitlesEnabled: boolean;
}

export interface BackgroundTheme {
  id: string;
  name: string;
  skyGradient: string[];
  starsColor: string;
  nebulaColor1: string;
  nebulaColor2: string;
}
