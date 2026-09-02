# 🌌 Lily - AI Anime Companion

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-6c63ff?style=for-the-badge&logo=github)](https://bluetccth.github.io/Lily---AI-Anime-Companion/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-Flash-4285f4?style=for-the-badge&logo=google)](https://ai.google.dev/)

An interactive celestial Live2D AI Anime companion featuring real-time eye and cursor tracking, high-fidelity voice synthesis, conversational intelligence powered by Google Gemini, emotional facial expressions, and responsive physics.

---

## ✨ Features

- 🎭 **Interactive Live2D Avatars (Cubism 2 & Cubism 4/5)**
  - Real-time cursor and touch tracking with head and body physics.
  - 9 distinct emotional expressions (*Blush, Happy, Love, Wink, Surprised, Thinking, Pout, Shy, Normal*).
  - Interactive touch zones: pat head, touch halo, or hug for unique voice lines and animated reactions.
  - Multi-character model selector (*Haru, Shizuku, Chitose, Koharu, Miku, UnityChan, Rei, etc.*).
  - Customizable framing (*Upper Body / Full Body*), scale offset, and vertical positioning.

- 🧠 **Conversational Intelligence (Gemini AI + Multimodal Vision)**
  - Natural, warm, and affectionate Thai anime girlfriend persona (*ลิลลี่ - Lily*).
  - Image and document attachment support (send screenshots or photos for instant reaction and commentary).
  - Automatic fact & memory extraction stored into Lily's Celestial Diary.

- 🎙️ **Voice Synthesis (TTS) & Speech Recognition (STT)**
  - High-fidelity Thai voice generation with emotion-synchronized lip movement.
  - Browser Speech Recognition for hands-free voice conversations.
  - Web Speech API fallback for 100% client-side compatibility.

- 🌌 **Celestial Atmosphere & Soundscape**
  - Real-time canvas starfield with sparkling constellations and customizable nebula themes.
  - Ambient relaxing BGM and interactive sound effects synthesized via Web Audio API.

- 📜 **Celestial Memory Diary**
  - Persistent local memory bank tracking relationship milestones, favorite topics, and user preferences.
  - Add, search, and manage memories that directly influence future conversations.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion (`motion/react`), Lucide React
- **Canvas & Live2D:** PixiJS v7, `pixi-live2d-display`, Live2D Cubism Core SDK
- **AI & Vision:** Google Gen AI SDK (`@google/genai`) with Gemini Flash models
- **Audio & Voice:** Web Audio API synth, Web Speech Synthesis/Recognition, Google TTS fallback
- **Backend:** Express.js + Vite Middleware (bundled with esbuild)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- npm or pnpm or yarn
- A [Google Gemini API Key](https://aistudio.google.com/) (Optional for full AI chat capabilities)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BluetccTH/Lily---AI-Anime-Companion.git
   cd Lily---AI-Anime-Companion
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build & Deployment

### Production Build
To create an optimized production build:
```bash
npm run build
```

### Run Production Server
```bash
npm start
```

### Static Hosting (e.g., GitHub Pages)
The client-side bundle is built into the `dist/` directory with relative asset resolution (`./`), allowing seamless hosting on static platforms like GitHub Pages.

---

## 📁 Project Structure

```
├── public/
│   ├── favicon.png            # App favicon
│   ├── preview.png            # Open Graph social preview
│   ├── live2d.min.js          # Live2D Cubism 2 Core SDK
│   ├── live2dcubismcore.min.js# Live2D Cubism 4 Core SDK
│   └── live2d/                # Live2D model assets & textures
├── src/
│   ├── components/
│   │   ├── Live2DCanvas.tsx   # PixiJS + Live2D viewport renderer
│   │   ├── ChatOverlay.tsx    # Chat dialog, inputs & voice controls
│   │   ├── TopBar.tsx         # Quick expressions, status & toggles
│   │   ├── MemoryModal.tsx    # Celestial diary & memory manager
│   │   ├── SettingsModal.tsx  # Model, voice, theme & display settings
│   │   └── StarryBackground.tsx # Canvas starry night sky animation
│   ├── utils/
│   │   ├── audioSynth.ts      # Web Audio sound effects & BGM player
│   │   └── localAI.ts         # Fallback dialogue responses
│   ├── types.ts               # Shared TypeScript definitions
│   ├── App.tsx                # Core application state coordinator
│   └── main.tsx               # React DOM entry point
├── server.ts                  # Express backend proxy for Gemini AI & TTS
├── index.html                 # HTML entry point with metadata
└── package.json               # Dependencies and scripts
```

---

## 📄 License

This project is open-source. Live2D models and Cubism Core SDKs remain the property of their respective creators and Live2D Inc. Please adhere to the [Live2D Open Software License](https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html) when using Live2D SDKs.
