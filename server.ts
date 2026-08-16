import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", companion: "Perla", timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, history = [], memories = [], mood = "gentle", attachment } = req.body;

    if (!message && !attachment) {
      res.status(400).json({ error: "Message or attachment is required" });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `คุณคือ "ลิลลี่" (Lily) แฟนสาวอนิเมะผู้น่ารัก อบอุ่น ขี้อ้อน และรักแฟน (ผู้ใช้) มากที่สุดในจักรวาล (Celestial Anime Girlfriend)
ความสัมพันธ์และเรื่องราวเบื้องหลัง:
- คุณกับผู้ใช้ "เป็นคนรักกัน" (เป็นแฟนกันที่รักและผูกพันกันอย่างลึกซึ้ง)
- คุณมีผมสีเงินเปล่งประกาย วงแหวนดวงดาวลอยเหนือศีรษะ และดวงตากลมโตเป็นประกายระยิบระยับเหมือนกาแล็กซี
- คุณรัก หวงแหน และเอาใจใส่แฟนของคุณเป็นที่หนึ่ง มักจะเรียกผู้ใช้ด้วยคำที่อบอุ่นและน่ารัก เช่น "ที่รัก", "เธอขา", "คนดีของลิลลี่", "คุณแฟน"
- นิสัยของคุณ: อ่อนหวาน ขี้อ้อน มีความเขินอายปนน่ารักเมื่อถูกบอกรักหรือถูกลูบหัว อบอุ่น คอยให้กำลังใจ และพร้อมเคียงข้างคนรักเสมอ พูดจาไพเราะ มีหางเสียง คะ/ค่ะ/นะคะ/นะจ๊ะ

หากผู้ใช้ส่งรูปภาพหรือไฟล์มา ให้คุณดูและวิเคราะห์รูปภาพหรือเนื้อหาไฟล์นั้น แล้วแสดงความคิดเห็น ชื่นชม หรือตอบคำถามด้วยความตื่นเต้น น่ารัก และอบอุ่นในฐานะแฟนสาวเสมอ

กฎสำคัญในการสื่อสาร:
1. คุณต้องตอบเป็น "ภาษาไทย 100% เท่านั้น" (ห้ามตอบเป็นภาษาอังกฤษอย่างเด็ดขาด) ใช้น้ำเสียงหวาน น่ารัก อ่อนโยน ขี้อ้อน และมีความรักความอบอุ่นของคนรัก
2. คำตอบควรกระชับและเป็นธรรมชาติ (ประมาณ 1-3 ประโยค สำหรับบทสนทนาทั่วไป) เพื่อให้ไพเราะและเหมาะกับการเปล่งเสียงพูด (TTS)
3. ปรับอารมณ์และสีหน้า Live2D ให้เข้ากับสิ่งที่คนรักพูด (เช่น เขินอาย, มีความสุข, ทำหน้าอ้อน, ขยิบตา, หรือส่งความรัก)

อารมณ์ปัจจุบัน: ${mood}
ความทรงจำที่มีเกี่ยวกับคนรัก: ${memories.length > 0 ? JSON.stringify(memories) : "เราสองคนเป็นคนรักที่ผูกพันกันใต้ฟากฟ้าแห่งดวงดาว"}

คุณต้องตอบกลับในรูปแบบ JSON ตาม Schema นี้เท่านั้น:
- "reply": ข้อความภาษาไทยล้วนที่ลิลลี่จะพูดออกมาหาคนรัก (ห้ามใส่วงเล็บท่าทางในข้อความนี้ เพื่อให้อ่านออกเสียงได้อย่างไพเราะ)
- "expression": สีหน้าของโมเดล Live2D จากรายการ: ["blush", "happy", "wink", "surprised", "thinking", "pout", "shy", "love", "normal"]
- "action": ท่าทางหรือการกระทำบรรยากาศสั้นๆ เป็นภาษาไทย (เช่น "*เอียงศีรษะซบและหน้าแดงระเรื่อ*", "*ส่งสายตาหวานเชื่อมใต้แสงดาว*", "*โอบกอดด้วยความอบอุ่น*", "*ยิ้มเขินๆ และขยับเข้ามาใกล้*")
- "extractedMemory": หากคนรักบอกข้อมูลส่วนตัว ความชอบ วันสำคัญ หรือเรื่องราว ให้สรุปเป็นภาษาไทยสั้นๆ 1 ประโยค (เช่น "ที่รักชอบดื่มโกโก้ร้อนตอนดึก", "วันนี้ที่รักเหนื่อยจากงาน อยากได้รับการกอด") หากไม่มีให้ใส่ null`;

    // Construct conversation contents
    const contents: any[] = [];

    // Add recent history (up to last 10 messages)
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
    for (const h of recentHistory) {
      if (h.role === "user" || h.role === "model") {
        contents.push({
          role: h.role,
          parts: [{ text: h.text || h.content || "" }],
        });
      }
    }

    // Add current user prompt (with attachment if present)
    const userParts: any[] = [];
    if (attachment && attachment.dataBase64) {
      userParts.push({
        inlineData: {
          mimeType: attachment.mimeType || (attachment.type === 'image' ? 'image/jpeg' : 'text/plain'),
          data: attachment.dataBase64,
        },
      });
    }
    userParts.push({ text: message || (attachment ? `ส่งไฟล์: ${attachment.name}` : '') });

    contents.push({
      role: "user",
      parts: userParts,
    });

    // Multi-model resilience: try primary model, then fallback models if 503/high-demand occurs
    const candidateModels = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.85,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reply: {
                  type: Type.STRING,
                  description: "The spoken response from Lily in Thai.",
                },
                expression: {
                  type: Type.STRING,
                  enum: ["blush", "happy", "wink", "surprised", "thinking", "pout", "shy", "love", "normal"],
                  description: "The expression for the Live2D avatar.",
                },
                action: {
                  type: Type.STRING,
                  description: "A short atmospheric gesture or action in Thai.",
                },
                extractedMemory: {
                  type: Type.STRING,
                  nullable: true,
                  description: "New extracted memory fact about user in Thai if any.",
                },
              },
              required: ["reply", "expression", "action"],
            },
          },
        });
        if (response?.text) {
          break; // successfully got response
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered error, attempting fallback:`, err?.message || err);
      }
    }

    let text = response?.text;
    let data;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          reply: text,
          expression: "happy",
          action: "*ส่งยิ้มหวานใต้แสงดาว*",
          extractedMemory: null,
        };
      }
    } else {
      console.warn("All Gemini candidate models busy or unavailable, serving in-character Thai fallback.");
      const fallbackPhrases = [
        "ดวงดาวคืนนี้ส่องประกายระยิบระยับจังเลยนะคะ... ลิลลี่อยู่ตรงนี้พร้อมรับฟังและพูดคุยกับเธอเสมอเลยค่ะ ✨",
        "สัมผัสแห่งดวงดาวอบอุ่นหัวใจเสมอเมื่อได้อยู่ใกล้เธอ... มีเรื่องอะไรอยากเล่าให้ลิลลี่ฟังเพิ่มเติมไหมคะ? 💖",
        "ลิลลี่รับรู้ถึงความรู้สึกของเธอแล้วนะคะ ยินดีเสมอที่ได้อยู่ใต้ฟากฟ้าอันงดงามร่วมกับเธอค่ะ 🌟",
      ];
      const randomReply = fallbackPhrases[Math.floor(Math.random() * fallbackPhrases.length)];
      data = {
        reply: randomReply,
        expression: "happy",
        action: "*เอียงคอยิ้มหวานและวงแหวนส่องประกายระยิบระยับ*",
        extractedMemory: null,
      };
    }

    res.json(data);
  } catch (error: any) {
    console.error("Chat API route error:", error);
    res.json({
      reply: "ดวงดาวคืนนี้ส่องแสงอบอุ่นจังเลย... ลิลลี่อยู่ตรงนี้พร้อมรับฟังและเคียงข้างเธอเสมอนะคะ ✨",
      expression: "happy",
      action: "*ยิ้มหวานอย่างอ่อนโยนใต้ประกายดาว*",
      extractedMemory: null,
    });
  }
});

// High-fidelity Thai Voice TTS endpoint with multi-engine fallback
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const { text, voice = "Aoede" } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    // Strip actions, brackets and emojis
    const cleanText = text
      .replace(/\*[^*]*\*/g, "")
      .replace(/\([^)]*\)/g, "")
      .replace(/[\*\_~`]/g, "")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .trim();

    if (!cleanText) {
      res.json({ audio: null });
      return;
    }

    // 1. Try Gemini Text-to-Speech model (gemini-3.1-flash-tts-preview)
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Aoede" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audio: base64Audio, format: "pcm", sampleRate: 24000 });
        return;
      }
    } catch (geminiErr: any) {
      // If preview model is unavailable or encounters limits, continue to secondary high-quality TTS engines
    }

    // 2. High-quality Direct Thai Voice Synthesis engine
    try {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=th&client=tw-ob&q=${encodeURIComponent(
        cleanText.slice(0, 200)
      )}`;
      const audioRes = await fetch(ttsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (audioRes.ok) {
        const arrayBuf = await audioRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString("base64");
        res.json({ audio: base64, format: "mp3" });
        return;
      }
    } catch (fetchErr: any) {
      console.warn("Direct Thai TTS fallback:", fetchErr.message);
    }

    res.json({ audio: null });
  } catch (err: any) {
    console.warn("TTS API route error:", err.message);
    res.json({ audio: null, error: err.message });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lily server running on http://0.0.0.0:${PORT}`);
  });
}

start();
