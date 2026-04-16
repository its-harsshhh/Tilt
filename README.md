# 🧠 Tilt — A Co-Evolving Decision System

> AI today removes decisions.  
> Tilt improves how you make them — while evolving with you.

---

## ⚡ What is Tilt?

Tilt is a browser-based AI layer that sees your screen and helps you:

- make better decisions  
- execute tasks step-by-step  
- learn your thinking style over time  

It doesn’t just do things for you.

👉 It introduces **useful resistance** — small moments where *you decide*, not the AI.

---

## 🔥 Why Tilt Exists

### The current direction of AI:

- People say: *“just do it for me”*
- AI executes everything
- Humans stop thinking

---

### What breaks over time:

#### 🧍 Humans degrade
- lose judgment  
- stop evaluating tradeoffs  
- become passive  

#### 🤖 AI stagnates
- becomes generic  
- doesn’t adapt to real behavior  
- stops improving  

---

## 💥 Core Idea

Tilt is not:

- an assistant  
- an agent  
- a decision engine  

👉 It’s a **co-evolving system**

Where:

- you make decisions  
- AI observes and adapts  
- both improve over time  

---

## 🔁 Core Loop
1. You bring a decision
2. Tilt generates options (Safe / Smart / Bold)
3. You choose
4. Dual learning happens
5. Next interaction adapts (with variation)


---

### 🧠 What improves?

#### You:
- build taste  
- understand tradeoffs  
- gain clarity  

#### Tilt:
- learns your preferences  
- adapts tone and style  
- still challenges you  

---

## ⚖️ Useful Resistance

Tilt is intentionally balanced:

- ❌ Not doing everything for you  
- ❌ Not leaving you alone  

👉 It creates **micro-decisions** that improve thinking

---

## 🧠 Guided Deviation

Tilt doesn’t blindly follow your patterns.

Sometimes it will say:

> “You usually choose safe, but this situation benefits from bold.”

This is how decision quality improves.

---

## 🚀 Features

### 🖥️ Screen-Aware AI

- Share your screen once  
- Tilt understands what you're doing  
- Works across apps and tabs  

---

### 🧠 Tilt Mode (Chat + Guidance)

- Ask anything  
- Or say: “help me do this”  

✔ detects intent automatically  
✔ step-by-step guidance  
✔ real-time updates using screen context  

---

### 🎯 Decide Mode (Core System)

Structured decisions:

- **Safe** → low-risk  
- **Smart** → balanced  
- **Bold** → assertive  

✔ keyboard navigation  
✔ reasoning included  
✔ copy-ready output  

---

### 🎙️ Voice Interaction

- Speak → auto-transcribed  
- Hear guidance → audio playback  

Works even when minimized.

---

### 🧠 Memory + Adaptation

- Stores recent decisions (local only)  
- Learns preference patterns  
- Adapts tone (Direct / Polite / etc.)  

---

### 🔍 Reflection Layer

Example:

> “You usually prefer: Smart + Direct”

---

### 🧭 Visual Guidance

- Highlights UI elements  
- Crosshair + ring annotations  
- Step tracking with completion  

---

### 🪟 Floating Window (PiP)

- Always-on-top interface  
- Works across tabs  
- `Cmd + K` to open instantly  

---

## 🏗️ Tech Stack

### Frontend
- React 18  
- Tailwind CSS  
- Document Picture-in-Picture API  

### Backend
- FastAPI (Python)

### AI Stack
- Claude Sonnet 4.5 (reasoning + vision)  
- OpenAI Whisper (speech-to-text)  
- OpenAI TTS (voice output)

### State
- localStorage (no database, no auth)

---

## 🧩 Architecture Overview
Screen Capture → Vision Analysis → Context

User Input → Intent Detection
├── Chat
├── Guide
└── Decide

Decision → Stored → Preference Layer
→ Influences future outputs



---

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|--------|
| `/api/tilt` | POST | Chat + guide |
| `/api/generate-decisions` | POST | Safe/Smart/Bold |
| `/api/analyze-screen` | POST | Vision analysis |
| `/api/transcribe` | POST | Voice → text |
| `/api/speak` | POST | Text → audio |
| `/api/health` | GET | Health check |

---

## 🧪 What Makes Tilt Different

Most AI systems:

> learn from static data → then act  

Tilt:

> learns from **live decisions → in context → continuously**

---

## ⚠️ What Tilt Does NOT Do

- Does NOT replace your thinking  
- Does NOT fully understand you  
- Does NOT become a perfect decision-maker  

👉 It adapts in small ways based on real choices

---

## 🎯 Use Cases

- replying to emails  
- writing messages  
- product decisions  
- navigating tools  
- learning workflows  

---

## 🧠 Mental Model

Tilt is:

👉 **a gym for decisions**

- reps = decisions  
- weights = tradeoffs  
- growth = clarity  

---

## 🚀 Getting Started

### 1. Clone repo

```bash
git clone https://github.com/your-username/tilt.git
cd tilt
```
###2. Run frontend
cd frontend
npm install
npm run dev

### 3. Run backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

🔐 Privacy
No database
No authentication
All memory stored locally
Screen data processed per request
💥 Final Thought

The goal isn’t to remove thinking.
It’s to make better thinking inevitable.
