# Tilt — AI Screen Assistant PRD

## Original Problem Statement
Build "Tilt" — a browser-based AI that sees your screen and helps you get things done. Two modes: Tilt (unified chat + step-by-step guidance with voice) and Decide (Safe/Smart/Bold options). Full voice I/O.

## Architecture
- **Frontend**: React 18 + Tailwind CSS
- **Backend**: FastAPI + Claude Sonnet 4.5 + OpenAI Whisper + OpenAI TTS via Emergent LLM key
- **State**: localStorage (no auth, no DB)
- **Screen Sharing**: getDisplayMedia with captures every 10s
- **Vision**: Claude Sonnet 4.5 vision for analysis + guidance
- **Voice Input**: OpenAI Whisper (whisper-1) for speech-to-text
- **Voice Output**: OpenAI TTS (tts-1, nova voice) for spoken instructions
- **Floating Palette**: Document PiP API, collapsible to icon

## What's Been Implemented (Apr 16, 2026)
- [x] Landing page with Ghibli aesthetic
- [x] Screen sharing with animated border
- [x] Real AI vision screen analysis every 10s
- [x] **2 modes: Tilt / Decide** (separate message histories)
- [x] **Tilt mode** — auto-detects chat vs step-by-step guidance
- [x] **Decide mode** — Safe/Smart/Bold options
- [x] **Voice input** — mic button, Whisper transcription, auto-send
- [x] **Voice mode (TTS)** — toggle in Tilt tab, speaks guide instructions aloud
  - Auto-speaks each new guide step
  - Works when palette is minimized — hands-free guidance
  - "Speaking..." indicator in guide header
- [x] **Collapsible palette** — minimize to icon, Cmd+K to expand
- [x] Continuous conversation, keyboard nav, memory/adaptation/reflection

## Key API Endpoints
- `GET /api/health`
- `POST /api/tilt` — Unified chat + guide
- `POST /api/transcribe` — Whisper STT (audio upload)
- `POST /api/speak` — TTS (text → audio base64, nova voice)
- `POST /api/analyze-screen` — Vision analysis
- `POST /api/generate-decisions` — Safe/Smart/Bold

## Backlog
### P1 - Drag-to-paste
### P2 - Decision history sidebar, Custom tone profiles
