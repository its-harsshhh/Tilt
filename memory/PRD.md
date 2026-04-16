# Tilt — AI Decision Layer + Screen Guide PRD

## Original Problem Statement
Build "Tilt" — a browser-based AI that sees your screen and helps you get things done. Three modes: Assist (conversational AI), Guide (real-time step-by-step screen guidance with visual annotations), and Decide (Safe/Smart/Bold options).

## Architecture
- **Frontend**: React 18 + Tailwind CSS
- **Backend**: FastAPI + Claude Sonnet 4.5 via Emergent LLM key
- **State**: localStorage (no auth, no DB)
- **Screen Sharing**: getDisplayMedia with periodic captures every 10s
- **Vision**: Claude Sonnet 4.5 vision for screen analysis + step-by-step guidance
- **Floating Palette**: Document PiP API — works on any tab

## What's Been Implemented (Apr 16, 2026)
- [x] Landing page with Ghibli mountain aesthetic
- [x] Screen sharing with animated border overlay
- [x] Real AI vision screen analysis every 10s
- [x] **3 modes: Assist / Guide / Decide**
- [x] **Assist mode** — conversational AI that sees screen, helps with tasks, continuous chat
- [x] **Guide mode** — step-by-step screen guidance:
  - Captures screen, sends to Claude vision
  - Returns annotated screenshot with colored beacon pointing to target UI element
  - Text instruction + detail for each step
  - Auto-captures every 6s to check progress and auto-advance
  - Tracks completed steps, shows progress
  - Detects task completion
- [x] **Decide mode** — Safe/Smart/Bold structured decision options
- [x] Input always visible at bottom — continuous conversation
- [x] Keyboard arrow navigation in Decide mode
- [x] Memory layer (localStorage) — last 5 decisions, preferred style, tone traits
- [x] Adaptation system — pre-highlights preferred style, biases prompts
- [x] Reflection layer — "You usually prefer: Smart + Direct"
- [x] Document PiP floating palette on any tab
- [x] Cmd+K to open/focus palette

## Key API Endpoints
- `GET /api/health`
- `POST /api/analyze-screen` — `{image_base64}` → `{context, activity}`
- `POST /api/assist` — `{message, screen_context, conversation}` → `{response}`
- `POST /api/guide-step` — `{image_base64, task, completed_steps, step_number}` → `{instruction, detail, region, is_complete, step_summary}`
- `POST /api/generate-decisions` — `{input_text, context}` → `{safe, smart, bold, reasoning}`

## Backlog
### P1
- Drag-to-paste functionality

### P2
- Decision history sidebar
- Custom tone profiles
