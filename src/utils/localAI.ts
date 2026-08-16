import { MLCEngine, InitProgressCallback } from '@mlc-ai/web-llm';

export interface ModelOption {
  id: string;
  name: string;
  size: string;
  recommended: 'mobile' | 'desktop' | 'fast';
  description: string;
}

export const AVAILABLE_LOCAL_MODELS: ModelOption[] = [
  {
    id: 'SmolLM2-360M-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 360M (เบาพิเศษ / เหมาะกับมือถือ)',
    size: '~250 MB',
    recommended: 'mobile',
    description: 'ดาวน์โหลดไวมาก ใช้แรมน้อย เหมาะกับสมาร์ตโฟนและเครื่องสเปกเริ่มต้น',
  },
  {
    id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC',
    name: 'SmolLM2 1.7B (สมดุล / ฉลาดขึ้น)',
    size: '~900 MB',
    recommended: 'fast',
    description: 'ความจำระดับกลาง ประมวลผลคล่องตัว',
  },
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    name: 'Qwen 2.5 1.5B (เก่งภาษาไทย / แนะนำ)',
    size: '~950 MB',
    recommended: 'desktop',
    description: 'เข้าใจและตอบภาษาไทยได้ดีเยี่ยม แนะนำสำหรับคอมพิวเตอร์และมือถือสเปกสูง',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama 3.2 1B (Meta AI)',
    size: '~800 MB',
    recommended: 'fast',
    description: 'รวดเร็วและตอบคำถามทั่วไปได้ดี',
  }
];

class LocalAIManager {
  private engine: MLCEngine | null = null;
  private isLoaded = false;
  private isLoading = false;
  private currentModelId = 'SmolLM2-360M-Instruct-q4f16_1-MLC';
  private loadProgress = 0;
  private loadStatusText = '';

  public checkWebGPUSupport(): boolean {
    if (typeof navigator === 'undefined') return false;
    return !!(navigator as any).gpu;
  }

  public getLoadState() {
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      progress: this.loadProgress,
      statusText: this.loadStatusText,
      modelId: this.currentModelId,
    };
  }

  public async initEngine(
    modelId: string,
    onProgress?: (progress: number, text: string) => void
  ): Promise<boolean> {
    if (!this.checkWebGPUSupport()) {
      throw new Error('เบราว์เซอร์หรืออุปกรณ์นี้ยังไม่รองรับ WebGPU');
    }

    if (this.engine && this.isLoaded && this.currentModelId === modelId) {
      return true;
    }

    this.isLoading = true;
    this.currentModelId = modelId;
    this.loadProgress = 0;
    this.loadStatusText = 'กำลังเตรียม WebGPU Engine...';

    try {
      const initProgressCallback: InitProgressCallback = (report) => {
        this.loadProgress = Math.round(report.progress * 100);
        this.loadStatusText = report.text;
        if (onProgress) {
          onProgress(this.loadProgress, report.text);
        }
      };

      this.engine = new MLCEngine();
      this.engine.setInitProgressCallback(initProgressCallback);
      await this.engine.reload(modelId);

      this.isLoaded = true;
      this.isLoading = false;
      this.loadProgress = 100;
      this.loadStatusText = 'พร้อมใช้งานในเครื่องแล้ว!';
      return true;
    } catch (err: any) {
      this.isLoading = false;
      this.isLoaded = false;
      console.error('Failed to load WebLLM model:', err);
      throw err;
    }
  }

  public async generateChatResponse(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    systemPrompt: string,
    onStreamChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.engine || !this.isLoaded) {
      throw new Error('โมเดลในเครื่องยังไม่ได้โหลด กรุณากดโหลดโมเดลก่อน');
    }

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ];

    if (onStreamChunk) {
      const chunks = await this.engine.chat.completions.create({
        messages: formattedMessages,
        temperature: 0.7,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullText += content;
        onStreamChunk(fullText);
      }
      return fullText;
    } else {
      const response = await this.engine.chat.completions.create({
        messages: formattedMessages,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || '';
    }
  }

  public unload() {
    if (this.engine) {
      this.engine.unload();
      this.engine = null;
    }
    this.isLoaded = false;
    this.isLoading = false;
    this.loadProgress = 0;
  }
}

export const localAI = new LocalAIManager();
