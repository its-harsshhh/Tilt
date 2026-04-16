# Tilt — AI Decision Layer PRD

## Original Problem Statement
Build "Tilt" — a browser-based AI decision layer that observes user context via screen sharing and helps users make better decisions in real-time. Not a chatbot — a decision system. Single-page, keyboard-first, minimal, fast.

## Architecture
- **Frontend**: React 18 + Tailwind CSS (Instrument Serif/Sans, Inter, JetBrains Mono fonts)
- **Backend**: FastAPI (Python) with Claude Sonnet 4.5 via Emergent LLM key
- **State**: localStorage for memory/adaptation (no auth, no DB needed for user data)
- **Screen Sharing**: `navigator.mediaDevices.getDisplayMedia` with periodic captures every 10s
- **Vision Analysis**: Claude Sonnet 4.5 vision API analyzes captured screenshots for real context
- **Floating Palette**: Document Picture-in-Picture API for cross-tab decision palette

## User Personas
- Professionals composing important messages/replies
- Anyone needing structured decision options for communication

## Core Requirements
1. Landing page with Ghibli mountain aesthetic
2. Screen sharing flow with real AI vision context capture
3. **Floating PiP palette** that works on any tab/window (Cmd+K or click)
4. Decision engine: Safe / Smart / Bold options
5. Output view with copy + reasoning
6. Memory layer tracking last 5 decisions, preferred style, tone traits
7. Adaptation system pre-selecting preferred style, biasing LLM prompts
8. Reflection layer showing "You usually prefer: Smart + Direct"

## What's Been Implemented (Apr 16, 2026)
- [x] Full landing page with Tilt branding, headline, CTA
- [x] Screen sharing via getDisplayMedia with animated border overlay
- [x] **Real AI vision screen analysis** — captures every 10s, sends to Claude vision, returns structured context
- [x] `/api/analyze-screen` endpoint — accepts base64 JPEG, uses Claude Sonnet 4.5 vision
- [x] Screen context displayed in floating palette and in-tab palette
- [x] **Document Picture-in-Picture floating palette** — works on ANY tab
- [x] Floating palette auto-opens when screen sharing starts
- [x] Cmd+K within PiP window focuses the input
- [x] Fallback in-tab CommandPalette for browsers without PiP support
- [x] Decision engine using Claude Sonnet 4.5 (GPT-5.2 fallback)
- [x] 3-option decision UI (Safe/Smart/Bold) — compact Spotlight-style rows
- [x] **Keyboard arrow navigation** between decision rows (up/down + Enter)
- [x] Output view with copy-to-clipboard and reasoning
- [x] **Memory layer** — localStorage tracks last 5 decisions, preferences, tone traits
- [x] **Adaptation system** — pre-highlights preferred style, biases LLM prompts
- [x] **Reflection layer** — "You usually prefer: Smart + Direct" insight chip
- [x] All interactive elements have data-testid attributes

## Key API Endpoints
- `GET /api/health` — Health check
- `POST /api/analyze-screen` — Accepts `{image_base64}`, returns `{context, activity}` using Claude vision
- `POST /api/generate-decisions` — Accepts `{input_text, context, user_preference, tone_traits}`, returns `{safe, smart, bold, reasoning}`

## Bug Fix Log
- **Apr 16, 2026**: Fixed Cmd+K not working on shared tab via Document Picture-in-Picture API.
- **Apr 16, 2026**: Replaced simulated screen context with real AI vision analysis.

## Prioritized Backlog
### P0 (Critical) — None

### P1 (High)
- Drag-to-paste functionality — drag a decision option or auto-paste into active input field

### P2 (Nice to have)
- Decision history view/recall sidebar
- Export decision history
- Sound/haptic feedback on selection
- Custom tone profiles

## Next Tasks
- User testing and feedback collection
- Drag-to-paste functionality
- Decision history sidebar
