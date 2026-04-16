# Tilt — AI Screen Assistant PRD

## Original Problem Statement
Build "Tilt" — a browser-based AI that sees your screen and helps you think, decide, and reflect. Context-aware suggestion pills + deep decision support with insights.

## Architecture
- **Frontend**: React 18 + Tailwind CSS
- **Backend**: FastAPI + Claude Sonnet 4.5 + OpenAI Whisper + OpenAI TTS via Emergent LLM key
- **State**: localStorage (no auth, no DB)
- **Vision**: Claude Sonnet 4.5 vision for screen analysis + guidance
- **Voice I/O**: Whisper STT + TTS (nova voice)
- **Floating Palette**: Document PiP API, collapsible

## What's Been Implemented (Apr 17, 2026)

### Tilt Tab (Context Layer)
- [x] Suggestion pills empty state: "Summarize what I'm looking at", "What should I do next?", etc.
- [x] Clicking pill auto-fills input and starts chat/guide
- [x] Full conversational AI (chat + step-by-step guide)
- [x] Screen context banner from vision analysis
- [x] Voice mode toggle (TTS speaks instructions)

### Decide Tab (Decision Layer - Upgraded)
- [x] **Empty state pills**: "Help me reply to this", "Make this more confident", etc.
- [x] **3 Decision options**: Safe / Smart / Bold with keyboard nav
- [x] **Context pills** (after selecting): "Show trade-offs", "Make it shorter", "What am I missing?", etc. — clicking re-generates with modifier
- [x] **Insight layer**: Trade-offs (per option), Blind spots, What to do now — all 1-2 lines
- [x] Modifier support in backend (refines output based on pill selection)

### Other Features
- [x] Landing page persists during screen sharing (red "Co-evolving..." pill)
- [x] Collapsible palette (minimize to icon, Cmd+K to expand)
- [x] Voice input (Whisper) in both tabs
- [x] Voice output (TTS) for guide instructions
- [x] Memory/Adaptation/Reflection layers
- [x] Separate message histories per tab

## Key API Endpoints
- `POST /api/tilt` — Unified chat + guide
- `POST /api/generate-decisions` — Safe/Smart/Bold + insights + modifier support
- `POST /api/transcribe` — Whisper STT
- `POST /api/speak` — TTS
- `POST /api/analyze-screen` — Vision analysis

## Backlog
### P1 - Drag-to-paste
### P2 - Decision history sidebar
