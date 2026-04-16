# Tilt — AI Screen Assistant PRD

## Original Problem Statement
Build "Tilt" — a browser-based AI that sees your screen and helps you get things done. Two modes: Tilt (unified chat + step-by-step guidance) and Decide (Safe/Smart/Bold options).

## Architecture
- **Frontend**: React 18 + Tailwind CSS
- **Backend**: FastAPI + Claude Sonnet 4.5 via Emergent LLM key
- **State**: localStorage (no auth, no DB)
- **Screen Sharing**: getDisplayMedia with captures every 10s
- **Vision**: Claude Sonnet 4.5 vision for analysis + guidance
- **Floating Palette**: Document PiP API

## What's Been Implemented (Apr 16, 2026)
- [x] Landing page with Ghibli aesthetic
- [x] Screen sharing with animated border
- [x] Real AI vision screen analysis every 10s (ignores PiP overlays)
- [x] **2 modes: Tilt / Decide**
- [x] **Tilt mode** (unified): auto-detects if user needs chat or step-by-step guidance
  - Regular questions → conversational AI response
  - Action requests ("help me delete this repo") → step-by-step guidance with annotated screenshots
  - Colored beacon on screenshot pointing to target UI element
  - Auto-captures every 6s to check progress and auto-advance
  - Tracks completed steps, detects task completion
- [x] **Decide mode**: Safe/Smart/Bold structured decision options
- [x] Input always visible — continuous conversation
- [x] Keyboard arrow navigation in Decide mode
- [x] Memory/Adaptation/Reflection layers (localStorage)
- [x] Fixed context leak (PiP chat no longer bleeds into screen context)

## Key API Endpoints
- `GET /api/health`
- `POST /api/tilt` — Unified endpoint: `{message, image_base64?, ...}` → `{type:"chat"|"guide", ...}`
- `POST /api/analyze-screen` — Vision analysis (ignores overlays)
- `POST /api/generate-decisions` — Safe/Smart/Bold options
- `POST /api/guide-step` — Direct guide step (legacy)
- `POST /api/assist` — Direct chat (legacy)

## Backlog
### P1 - Drag-to-paste
### P2 - Decision history sidebar, Custom tone profiles
