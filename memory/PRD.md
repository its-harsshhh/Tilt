# Tilt — AI Screen Assistant PRD

## Original Problem Statement
Build "Tilt" — a browser-based AI that sees your screen and helps you get things done. Two modes: Tilt (unified chat + step-by-step guidance) and Decide (Safe/Smart/Bold options). Voice commands via OpenAI Whisper.

## Architecture
- **Frontend**: React 18 + Tailwind CSS
- **Backend**: FastAPI + Claude Sonnet 4.5 + OpenAI Whisper via Emergent LLM key
- **State**: localStorage (no auth, no DB)
- **Screen Sharing**: getDisplayMedia with captures every 10s
- **Vision**: Claude Sonnet 4.5 vision for analysis + guidance
- **Voice**: OpenAI Whisper (whisper-1) for speech-to-text
- **Floating Palette**: Document PiP API, collapsible to icon

## What's Been Implemented (Apr 16, 2026)
- [x] Landing page with Ghibli aesthetic
- [x] Screen sharing with animated border
- [x] Real AI vision screen analysis every 10s
- [x] **2 modes: Tilt / Decide** (separate message histories)
- [x] **Tilt mode** — auto-detects chat vs step-by-step guidance
- [x] **Decide mode** — Safe/Smart/Bold options
- [x] **Voice commands** — mic button in both tabs, records audio, Whisper transcription, auto-sends
- [x] **Collapsible palette** — minimize to icon, Cmd+K to expand
- [x] Continuous conversation with input always at bottom
- [x] Keyboard arrow navigation in Decide mode
- [x] Memory/Adaptation/Reflection layers (localStorage)
- [x] Context leak fix (ignores PiP overlays)
- [x] Duplicate message bug fix

## Key API Endpoints
- `GET /api/health`
- `POST /api/tilt` — Unified chat + guide endpoint
- `POST /api/transcribe` — Whisper speech-to-text (audio file upload)
- `POST /api/analyze-screen` — Vision analysis
- `POST /api/generate-decisions` — Safe/Smart/Bold
- `POST /api/guide-step` — Direct guide step (legacy)
- `POST /api/assist` — Direct chat (legacy)

## Backlog
### P1 - Drag-to-paste
### P2 - Decision history sidebar, Custom tone profiles
